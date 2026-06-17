package com.warehouse.repository;

import com.warehouse.entity.Warehouse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface WarehouseRepository extends JpaRepository<Warehouse, UUID> {
    Page<Warehouse> findByNameContainingIgnoreCase(String name, Pageable pageable);
}
