package com.warehouse.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Pagination envelope per spec §6.2.
 */
@Getter
@AllArgsConstructor
public class PageResponse<T> {
    private final List<T> data;
    private final int page;
    private final int size;
    private final long totalElements;
    private final int totalPages;

    public static <T> PageResponse<T> of(Page<T> page) {
        return new PageResponse<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages()
        );
    }
}
