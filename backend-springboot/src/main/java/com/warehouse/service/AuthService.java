package com.warehouse.service;

import com.warehouse.entity.RefreshToken;
import com.warehouse.entity.User;
import com.warehouse.exception.UnauthorizedException;
import com.warehouse.repository.RefreshTokenRepository;
import com.warehouse.repository.UserRepository;
import com.warehouse.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.jwt.refresh-expiry-ms}")
    private long refreshExpiryMs;

    @Transactional
    public Map<String, Object> login(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid credentials");
        }

        return issueTokenPair(user);
    }

    @Transactional
    public Map<String, Object> refresh(UUID tokenId) {
        RefreshToken rt = refreshTokenRepository.findById(tokenId)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        if (rt.isRevoked() || rt.isExpired()) {
            throw new UnauthorizedException("Refresh token is expired or revoked");
        }

        // Rotate — revoke old token
        rt.setRevokedAt(Instant.now());
        refreshTokenRepository.save(rt);

        return issueTokenPair(rt.getUser());
    }

    @Transactional
    public void logout(UUID tokenId) {
        refreshTokenRepository.findById(tokenId).ifPresent(rt -> {
            rt.setRevokedAt(Instant.now());
            refreshTokenRepository.save(rt);
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Map<String, Object> issueTokenPair(User user) {
        String accessToken = jwtService.generateToken(user);

        RefreshToken rt = RefreshToken.builder()
                .id(UUID.randomUUID())
                .user(user)
                .expiresAt(Instant.now().plusMillis(refreshExpiryMs))
                .build();
        refreshTokenRepository.save(rt);

        long expiresIn = jwtService.generateToken(user).length(); // re-parse for actual exp
        // Return response matching spec §6.3
        return Map.of(
                "access_token", accessToken,
                "refresh_token", rt.getId().toString(),
                "token_type", "Bearer",
                "expires_in", refreshExpiryMs / 1000,
                "role", user.getRole().name()
        );
    }
}
