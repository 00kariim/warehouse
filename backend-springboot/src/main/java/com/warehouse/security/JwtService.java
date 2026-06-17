package com.warehouse.security;

import com.warehouse.entity.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

/**
 * Signs, issues, and validates HS256 JWTs per spec §3.1.
 * Claims: sub (user UUID), role, iat, exp.
 */
@Service
@Slf4j
public class JwtService {

    private final SecretKey key;
    private final long expiryMs;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiry-ms}") long expiryMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expiryMs = expiryMs;
    }

    public String generateToken(User user) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("role", user.getRole().name())
                .issuedAt(new Date(now))
                .expiration(new Date(now + expiryMs))
                .signWith(key)
                .compact();
    }

    public Claims validateAndExtract(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public UUID extractUserId(Claims claims) {
        return UUID.fromString(claims.getSubject());
    }

    public String extractRole(Claims claims) {
        return claims.get("role", String.class);
    }
}
