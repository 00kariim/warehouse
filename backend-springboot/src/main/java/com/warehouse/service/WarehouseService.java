package com.warehouse.service;

import com.warehouse.entity.Warehouse;
import com.warehouse.exception.ResourceNotFoundException;
import com.warehouse.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WarehouseService {

    private final WarehouseRepository warehouseRepository;

    @Transactional
    public Warehouse create(String name, String location) {
        return warehouseRepository.save(Warehouse.builder().name(name).location(location).build());
    }

    @Transactional(readOnly = true)
    public Page<Warehouse> findAll(String nameFilter, Pageable pageable) {
        if (nameFilter != null && !nameFilter.isBlank()) {
            return warehouseRepository.findByNameContainingIgnoreCase(nameFilter, pageable);
        }
        return warehouseRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Warehouse findById(UUID id) {
        return warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found: " + id));
    }

    @Transactional
    public Warehouse update(UUID id, String name, String location) {
        Warehouse w = findById(id);
        if (name != null) w.setName(name);
        if (location != null) w.setLocation(location);
        return warehouseRepository.save(w);
    }
}
