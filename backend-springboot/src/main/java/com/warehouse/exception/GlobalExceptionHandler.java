package com.warehouse.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Global exception handler — maps all exceptions to the standard error body
 * described in spec §6.1.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // ── Domain exceptions ─────────────────────────────────────────────────────

    @ExceptionHandler(ResourceNotFoundException.class)
    ResponseEntity<Map<String, Object>> handleNotFound(ResourceNotFoundException ex, HttpServletRequest req) {
        return error(HttpStatus.NOT_FOUND, "NOT_FOUND", ex.getMessage(), req);
    }

    @ExceptionHandler(ConflictException.class)
    ResponseEntity<Map<String, Object>> handleConflict(ConflictException ex, HttpServletRequest req) {
        return error(HttpStatus.CONFLICT, "CONFLICT", ex.getMessage(), req);
    }

    @ExceptionHandler(ValidationException.class)
    ResponseEntity<Map<String, Object>> handleValidation(ValidationException ex, HttpServletRequest req) {
        return error(HttpStatus.UNPROCESSABLE_ENTITY, "VALIDATION_FAILED", ex.getMessage(), req);
    }

    @ExceptionHandler(UnauthorizedException.class)
    ResponseEntity<Map<String, Object>> handleUnauthorized(UnauthorizedException ex, HttpServletRequest req) {
        return error(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", ex.getMessage(), req);
    }

    @ExceptionHandler(ServiceUnavailableException.class)
    ResponseEntity<Map<String, Object>> handleServiceUnavailable(ServiceUnavailableException ex, HttpServletRequest req) {
        return error(HttpStatus.SERVICE_UNAVAILABLE, "SERVICE_UNAVAILABLE", ex.getMessage(), req);
    }

    // ── Spring / framework exceptions ─────────────────────────────────────────

    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<Map<String, Object>> handleForbidden(AccessDeniedException ex, HttpServletRequest req) {
        return error(HttpStatus.FORBIDDEN, "FORBIDDEN", "Insufficient permissions", req);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<Map<String, Object>> handleBeanValidation(MethodArgumentNotValidException ex,
                                                              HttpServletRequest req) {
        List<Map<String, String>> violations = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> Map.of("field", fe.getField(), "message", fe.getDefaultMessage()))
                .toList();

        Map<String, Object> body = buildBody(HttpStatus.UNPROCESSABLE_ENTITY, "VALIDATION_FAILED",
                "Request validation failed", req);
        body.put("violations", violations);
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(body);
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<Map<String, Object>> handleGeneric(Exception ex, HttpServletRequest req) {
        log.error("Unhandled exception at {}: {}", req.getRequestURI(), ex.getMessage(), ex);
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "An unexpected error occurred", req);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private ResponseEntity<Map<String, Object>> error(HttpStatus status, String code, String message,
                                                       HttpServletRequest req) {
        return ResponseEntity.status(status).body(buildBody(status, code, message, req));
    }

    private Map<String, Object> buildBody(HttpStatus status, String code, String message,
                                           HttpServletRequest req) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", code);
        body.put("message", message);
        body.put("status", status.value());
        body.put("timestamp", Instant.now().toString());
        body.put("path", req.getRequestURI());
        return body;
    }
}
