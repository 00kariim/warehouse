package com.warehouse.service;

import com.warehouse.client.AiServiceClient;
import com.warehouse.entity.*;
import com.warehouse.exception.ResourceNotFoundException;
import com.warehouse.exception.ValidationException;
import com.warehouse.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/**
 * Handles stock movement registration per spec §4 FR-04.
 *
 * The critical path:
 * 1. Validate movement business rules
 * 2. SELECT FOR UPDATE on the product row (via ProductRepository#findByIdForUpdate)
 * 3. INSERT stock_movement + UPDATE product.current_stock — single transaction
 * 4. Post-commit: asynchronously call FastAPI anomaly detection
 * 5. If anomaly → UPDATE stock_movements SET anomaly_flag = true
 * 6. If AI failure → log warning, anomaly_flag stays false (never rejects the movement)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StockMovementService {

    private final StockMovementRepository movementRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final UserRepository userRepository;
    private final AnomalyEventRepository anomalyEventRepository;
    private final AiServiceClient aiServiceClient;

    @Transactional
    public StockMovement register(UUID productId, UUID warehouseId, UUID userId,
                                  int quantity, StockMovement.MovementType type, String notes) {

        // Lock product row to prevent race conditions (spec §4 FR-04 atomicity)
        Product product = productRepository.findByIdForUpdate(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));

        Warehouse warehouse = warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found: " + warehouseId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        // Business rule validation (spec §4 FR-04 movement types)
        validateMovement(type, quantity, product.getCurrentStock());

        // Update stock level atomically
        int newStock = applyMovement(type, product.getCurrentStock(), quantity);
        product.setCurrentStock(newStock);
        productRepository.save(product);

        // Insert movement record
        StockMovement movement = StockMovement.builder()
                .product(product).warehouse(warehouse).user(user)
                .quantity(quantity).type(type).notes(notes)
                .anomalyFlag(false)
                .build();
        StockMovement saved = movementRepository.save(movement);

        // Schedule async anomaly check (non-blocking, never blocks commit)
        scheduleAnomalyCheck(saved, product);

        return saved;
    }

    @Transactional(readOnly = true)
    public Page<StockMovement> findAll(UUID productId, UUID warehouseId,
                                       StockMovement.MovementType type, boolean anomalyOnly,
                                       Instant from, Instant to, Pageable pageable) {
        return movementRepository.findFiltered(productId, warehouseId, type, anomalyOnly, from, to, pageable);
    }

    @Transactional(readOnly = true)
    public Page<Product> findLowStock(Pageable pageable) {
        return productRepository.findByCurrentStockLessThanMinStock(pageable);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void validateMovement(StockMovement.MovementType type, int quantity, int currentStock) {
        switch (type) {
            case IN -> {
                if (quantity <= 0) throw new ValidationException("IN quantity must be > 0");
            }
            case OUT -> {
                if (quantity <= 0) throw new ValidationException("OUT quantity must be > 0");
                if (currentStock < quantity)
                    throw new ValidationException("Insufficient stock: available=" + currentStock + " requested=" + quantity);
            }
            case ADJUSTMENT -> {
                if (quantity == 0) throw new ValidationException("ADJUSTMENT quantity must be non-zero");
                if (currentStock + quantity < 0)
                    throw new ValidationException("Adjustment would result in negative stock");
            }
        }
    }

    private int applyMovement(StockMovement.MovementType type, int currentStock, int quantity) {
        return switch (type) {
            case IN -> currentStock + quantity;
            case OUT -> currentStock - quantity;
            case ADJUSTMENT -> currentStock + quantity;
        };
    }

    /**
     * Fires the async anomaly detection call after the transaction commits.
     * Never throws — per spec §4 FR-04 "A movement is never rejected due to AI unavailability".
     */
    private void scheduleAnomalyCheck(StockMovement movement, Product product) {
        // Compute features
        int hourOfDay = movement.getTimestamp().atZone(ZoneOffset.UTC).getHour();
        double avgDailyVol = computeAvgDailyVolume(product.getId());
        double stdDev = avgDailyVol * 0.3 + 1e-6;
        double zscore = (movement.getQuantity() - avgDailyVol) / stdDev;

        AiServiceClient.AnomalyRequest request = new AiServiceClient.AnomalyRequest(
                product.getId().toString(),
                movement.getQuantity(),
                movement.getType().name(),
                hourOfDay,
                avgDailyVol,
                zscore
        );

        CompletableFuture<AiServiceClient.AnomalyResult> future = aiServiceClient.detectAnomaly(request);
        future.thenAccept(result -> {
            if (result == null) {
                log.warn("Anomaly detection skipped for movement {} — AI service unavailable", movement.getId());
                return;
            }
            if (result.isAnomaly()) {
                updateAnomalyFlag(movement.getId(), result);
            }
        }).exceptionally(ex -> {
            log.warn("Async anomaly check failed for movement {}: {}", movement.getId(), ex.getMessage());
            return null;
        });
    }

    @Transactional
    protected void updateAnomalyFlag(UUID movementId, AiServiceClient.AnomalyResult result) {
        movementRepository.findById(movementId).ifPresent(m -> {
            m.setAnomalyFlag(true);
            movementRepository.save(m);

            // Create anomaly_events record
            AnomalyEvent event = AnomalyEvent.builder()
                    .movement(m)
                    .confidenceScore(java.math.BigDecimal.valueOf(result.confidenceScore()))
                    .modelVersion(result.modelVersion())
                    .build();
            anomalyEventRepository.save(event);
        });
    }

    /** Mean daily quantity for this product over the last 30 days (best-effort). */
    private double computeAvgDailyVolume(UUID productId) {
        Instant thirtyDaysAgo = LocalDate.now(ZoneOffset.UTC).minusDays(30)
                .atStartOfDay(ZoneOffset.UTC).toInstant();
        List<StockMovement> recent = movementRepository
                .findFiltered(productId, null, null, false, thirtyDaysAgo, null, Pageable.unpaged())
                .getContent();
        if (recent.isEmpty()) return 0.0;
        return recent.stream().mapToInt(m -> Math.abs(m.getQuantity())).average().orElse(0.0);
    }
}
