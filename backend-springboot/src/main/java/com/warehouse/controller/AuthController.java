package com.warehouse.controller;

import com.warehouse.service.AuthService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    record LoginRequest(@NotBlank String username, @NotBlank String password) {}
    record RefreshRequest(@NotBlank String refresh_token) {}
    record LogoutRequest(@NotBlank String refresh_token) {}

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req.username(), req.password()));
    }

    @PostMapping("/refresh")
    public ResponseEntity<Map<String, Object>> refresh(@Valid @RequestBody RefreshRequest req) {
        UUID tokenId = UUID.fromString(req.refresh_token());
        return ResponseEntity.ok(authService.refresh(tokenId));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@Valid @RequestBody LogoutRequest req) {
        authService.logout(UUID.fromString(req.refresh_token()));
        return ResponseEntity.noContent().build();
    }
}
