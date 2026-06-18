package com.warehouse.repository;

import com.warehouse.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {

    boolean existsBySku(String sku);

    /** Used by stock movement service to lock row before update (SELECT FOR UPDATE). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdForUpdate(UUID id);

    /** Low-stock filter for GET /api/products?low_stock=true */
    @Query("SELECT p FROM Product p WHERE p.currentStock < p.minStock")
    Page<Product> findByCurrentStockLessThanMinStock(Pageable pageable);
}
