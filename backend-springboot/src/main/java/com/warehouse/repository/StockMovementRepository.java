package com.warehouse.repository;

import com.warehouse.entity.StockMovement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.UUID;

public interface StockMovementRepository extends JpaRepository<StockMovement, UUID> {

    boolean existsByProductId(UUID productId);

    @Query("""
        SELECT sm FROM StockMovement sm
        WHERE (:productId IS NULL OR sm.product.id = :productId)
          AND (:warehouseId IS NULL OR sm.warehouse.id = :warehouseId)
          AND (:type IS NULL OR sm.type = :type)
          AND (:anomalyOnly = FALSE OR sm.anomalyFlag = TRUE)
          AND (:from IS NULL OR sm.timestamp >= :from)
          AND (:to IS NULL OR sm.timestamp <= :to)
        """)
    Page<StockMovement> findFiltered(
            @Param("productId") UUID productId,
            @Param("warehouseId") UUID warehouseId,
            @Param("type") StockMovement.MovementType type,
            @Param("anomalyOnly") boolean anomalyOnly,
            @Param("from") Instant from,
            @Param("to") Instant to,
            Pageable pageable
    );
}
