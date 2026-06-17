package com.warehouse.controller;

import com.warehouse.dto.PageResponse;
import com.warehouse.entity.AnomalyEvent;
import com.warehouse.entity.User;
import com.warehouse.service.AnomalyService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/anomalies")
@RequiredArgsConstructor
public class AnomalyController {

    private final AnomalyService anomalyService;

    record ReviewRequest(@NotBlank String outcome) {}

    @GetMapping
    public ResponseEntity<PageResponse<AnomalyEvent>> list(
            @RequestParam(required = false) Boolean reviewed,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(PageResponse.of(anomalyService.findAll(reviewed, pageable)));
    }

    @PatchMapping("/{eventId}/review")
    public ResponseEntity<AnomalyEvent> review(
            @PathVariable UUID eventId,
            @Valid @RequestBody ReviewRequest req,
            @AuthenticationPrincipal User currentUser) {
        AnomalyEvent event = anomalyService.review(eventId, req.outcome(), currentUser.getId());
        return ResponseEntity.ok(event);
    }
}
