package com.warehouse.controller;

import com.warehouse.client.AiServiceClient;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * Proxies AI chat requests to the FastAPI /generate-query endpoint (spec §6.7).
 * Assembles the response into the structure expected by the frontend.
 */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiServiceClient aiServiceClient;

    record ChatRequest(@NotBlank String query) {}

    @PostMapping("/chat")
    public ResponseEntity<Map<?, ?>> chat(@Valid @RequestBody ChatRequest req) {
        String sessionId = UUID.randomUUID().toString();
        Map<String, Object> result = aiServiceClient.generateQuery(req.query(), sessionId);

        // Map FastAPI response fields to spec §6.7 response shape
        // FastAPI returns: sql_executed, results, row_count, truncated
        // Spec expects:    answer, sql_executed, data, row_count, truncated
        return ResponseEntity.ok(Map.of(
                "answer", "Query executed successfully.",
                "sql_executed", result.getOrDefault("sql_executed", ""),
                "data", result.getOrDefault("results", java.util.List.of()),
                "row_count", result.getOrDefault("row_count", 0),
                "truncated", result.getOrDefault("truncated", false)
        ));
    }
}
