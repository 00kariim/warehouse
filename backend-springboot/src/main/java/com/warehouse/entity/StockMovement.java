package com.warehouse.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "stock_movements")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StockMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private int quantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private MovementType type;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false)
    private Instant timestamp;

    @Column(name = "anomaly_flag", nullable = false)
    private boolean anomalyFlag;

    @PrePersist
    void prePersist() {
        if (timestamp == null) timestamp = Instant.now();
    }

    public enum MovementType { IN, OUT, ADJUSTMENT }
}
