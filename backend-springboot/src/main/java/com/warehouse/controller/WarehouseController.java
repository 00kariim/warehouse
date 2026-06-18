package com.warehouse.controller;

import com.warehouse.dto.PageResponse;
import com.warehouse.entity.Warehouse;
import com.warehouse.service.WarehouseService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/warehouses")
@RequiredArgsConstructor
public class WarehouseController {

    private final WarehouseService warehouseService;

    record CreateWarehouseRequest(@NotBlank @Size(max = 255) String name, @Size(max = 255) String location) {}
    record UpdateWarehouseRequest(@Size(max = 255) String name, @Size(max = 255) String location) {}

    @PostMapping
    public ResponseEntity<Warehouse> create(@Valid @RequestBody CreateWarehouseRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(warehouseService.create(req.name(), req.location()));
    }

    @GetMapping
    public ResponseEntity<PageResponse<Warehouse>> list(
            @RequestParam(required = false) String name,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {
        String[] parts = sort.split(",");
        Sort.Direction dir = parts.length > 1 && "asc".equalsIgnoreCase(parts[1]) ? Sort.Direction.ASC : Sort.Direction.DESC;
        var pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(dir, parts[0]));
        return ResponseEntity.ok(PageResponse.of(warehouseService.findAll(name, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Warehouse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(warehouseService.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Warehouse> update(@PathVariable UUID id,
                                            @Valid @RequestBody UpdateWarehouseRequest req) {
        return ResponseEntity.ok(warehouseService.update(id, req.name(), req.location()));
    }
}
