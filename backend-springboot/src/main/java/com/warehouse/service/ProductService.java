package com.warehouse.service;

import com.warehouse.entity.Product;
import com.warehouse.exception.ConflictException;
import com.warehouse.exception.ResourceNotFoundException;
import com.warehouse.repository.ProductRepository;
import com.warehouse.repository.StockMovementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final StockMovementRepository stockMovementRepository;

    @Transactional
    public Product create(String sku, String name, String description, int minStock, int currentStock) {
        if (productRepository.existsBySku(sku)) {
            throw new ConflictException("Product with SKU '" + sku + "' already exists");
        }
        Product product = Product.builder()
                .sku(sku).name(name).description(description)
                .minStock(minStock).currentStock(currentStock)
                .build();
        return productRepository.save(product);
    }

    @Transactional(readOnly = true)
    public Page<Product> findAll(boolean lowStock, Pageable pageable) {
        if (lowStock) {
            return productRepository.findByCurrentStockLessThanMinStock(pageable);
        }
        return productRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Product findById(UUID id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
    }

    @Transactional
    public Product update(UUID id, String name, String description, Integer minStock) {
        Product product = findById(id);
        if (name != null) product.setName(name);
        if (description != null) product.setDescription(description);
        if (minStock != null) product.setMinStock(minStock);
        return productRepository.save(product);
    }

    @Transactional
    public void delete(UUID id) {
        Product product = findById(id);
        if (stockMovementRepository.existsByProductId(id)) {
            throw new ConflictException("Cannot delete product with existing stock movements");
        }
        productRepository.delete(product);
    }
}
