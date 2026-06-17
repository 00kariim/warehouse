package com.warehouse.controller;

import com.warehouse.dto.PageResponse;
import com.warehouse.entity.Product;
import com.warehouse.entity.StockMovement;
import com.warehouse.entity.User;
import com.warehouse.service.StockMovementService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.UUID;

@RestController
@RequestMapping("/api/stocks")
@RequiredArgsConstructor
public class StockMovementController {

    private final StockMovementService stockMovementService;

    record CreateMovementRequest(
            @NotNull UUID product_id,
            @NotNull UUID warehouse_id,
            int quantity,
            @NotBlank String type,
            String notes
    ) {}

    @PostMapping("/movements")
    public ResponseEntity<StockMovement> create(
            @Valid @RequestBody CreateMovementRequest req,
            @AuthenticationPrincipal User currentUser) {

        StockMovement.MovementType movType = StockMovement.MovementType.valueOf(req.type());
        StockMovement movement = stockMovementService.register(
                req.product_id(), req.warehouse_id(), currentUser.getId(),
                req.quantity(), movType, req.notes());

        return ResponseEntity.status(HttpStatus.CREATED).body(movement);
    }

    @GetMapping("/movements")
    public ResponseEntity<PageResponse<StockMovement>> list(
            @RequestParam(required = false) UUID product_id,
            @RequestParam(required = false) UUID warehouse_id,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "false") boolean anomaly_only,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "timestamp,desc") String sort) {

        String[] parts = sort.split(",");
        Sort.Direction dir = parts.length > 1 && "asc".equalsIgnoreCase(parts[1]) ? Sort.Direction.ASC : Sort.Direction.DESC;
        var pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(dir, parts[0]));

        StockMovement.MovementType movType = type != null ? StockMovement.MovementType.valueOf(type) : null;
        Instant fromInstant = from != null ? from.atStartOfDay(ZoneOffset.UTC).toInstant() : null;
        Instant toInstant = to != null ? to.atTime(23, 59, 59).toInstant(ZoneOffset.UTC) : null;

        return ResponseEntity.ok(PageResponse.of(
                stockMovementService.findAll(product_id, warehouse_id, movType, anomaly_only, fromInstant, toInstant, pageable)));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<PageResponse<Product>> lowStock(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.ASC, "name"));
        return ResponseEntity.ok(PageResponse.of(stockMovementService.findLowStock(pageable)));
    }
}
