package com.warehouse.controller;

import com.warehouse.dto.PageResponse;
import com.warehouse.entity.Product;
import com.warehouse.service.ProductService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    record CreateProductRequest(
            @NotBlank @Size(max = 100) String sku,
            @NotBlank @Size(max = 255) String name,
            String description,
            @Min(0) int min_stock,
            @Min(0) int current_stock
    ) {}

    record UpdateProductRequest(
            @Size(max = 255) String name,
            String description,
            @Min(0) Integer min_stock
    ) {}

    @PostMapping
    public ResponseEntity<Product> create(@Valid @RequestBody CreateProductRequest req) {
        Product p = productService.create(req.sku(), req.name(), req.description(), req.min_stock(), req.current_stock());
        return ResponseEntity.status(HttpStatus.CREATED).body(p);
    }

    @GetMapping
    public ResponseEntity<PageResponse<Product>> list(
            @RequestParam(defaultValue = "false") boolean low_stock,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {
        Pageable pageable = buildPageable(page, size, sort);
        return ResponseEntity.ok(PageResponse.of(productService.findAll(low_stock, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(productService.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> update(@PathVariable UUID id,
                                          @Valid @RequestBody UpdateProductRequest req) {
        return ResponseEntity.ok(productService.update(id, req.name(), req.description(), req.min_stock()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        productService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private Pageable buildPageable(int page, int size, String sort) {
        size = Math.min(size, 100);
        String[] parts = sort.split(",");
        Sort.Direction dir = parts.length > 1 && "asc".equalsIgnoreCase(parts[1])
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        return PageRequest.of(page, size, Sort.by(dir, parts[0]));
    }
}
