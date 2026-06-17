package com.warehouse.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * HTTP client for the FastAPI AI service.
 *
 * detect-anomaly: called asynchronously — spec §4 FR-04 "AI Anomaly Check"
 * generate-query: called synchronously — spec §4 FR-06
 */
@Component
@Slf4j
public class AiServiceClient {

    private final RestTemplate restTemplate;
    private final String aiServiceUrl;

    public AiServiceClient(
            RestTemplateBuilder builder,
            @Value("${app.ai-service.url}") String aiServiceUrl,
            @Value("${app.ai-service.timeout-ms}") long timeoutMs) {
        this.aiServiceUrl = aiServiceUrl;
        this.restTemplate = builder
                .connectTimeout(Duration.ofMillis(timeoutMs))
                .readTimeout(Duration.ofMillis(timeoutMs))
                .build();
    }

    /**
     * Asynchronous anomaly detection call.
     * On any failure the caller receives {@code null} and logs a warning.
     */
    @Async
    public CompletableFuture<AnomalyResult> detectAnomaly(AnomalyRequest request) {
        try {
            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> response = restTemplate.postForEntity(
                    aiServiceUrl + "/detect-anomaly", request, (Class<Map<String, Object>>) (Class<?>) Map.class);
            Map<String, Object> body = response.getBody();
            if (body == null) return CompletableFuture.completedFuture(null);

            boolean isAnomaly = Boolean.TRUE.equals(body.get("is_anomaly"));
            double confidence = body.get("confidence_score") instanceof Number n ? n.doubleValue() : 0.0;
            Object ver = body.get("model_version");
            String version = ver != null ? ver.toString() : "unknown";
            return CompletableFuture.completedFuture(new AnomalyResult(isAnomaly, confidence, version));
        } catch (RestClientException ex) {
            log.warn("AI service anomaly detection failed: {}", ex.getMessage());
            return CompletableFuture.completedFuture(null);
        }
    }

    /**
     * Synchronous NL2SQL call. Throws ServiceUnavailableException on failure.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> generateQuery(String prompt, String sessionId) {
        try {
            Map<String, Object> reqBody = Map.of("prompt", prompt, "session_id", sessionId != null ? sessionId : "");
            ResponseEntity<Map<String, Object>> response = restTemplate.postForEntity(
                    aiServiceUrl + "/generate-query", reqBody,
                    (Class<Map<String, Object>>) (Class<?>) Map.class);
            return response.getBody() != null ? response.getBody() : Map.of();
        } catch (RestClientException ex) {
            log.error("AI service NL2SQL call failed: {}", ex.getMessage());
            throw new com.warehouse.exception.ServiceUnavailableException("AI service is unavailable");
        }
    }

    public record AnomalyRequest(
            String product_id,
            double quantity,
            String type,
            int hour_of_day,
            double product_avg_daily_volume,
            double quantity_zscore
    ) {}

    public record AnomalyResult(boolean isAnomaly, double confidenceScore, String modelVersion) {}
}
