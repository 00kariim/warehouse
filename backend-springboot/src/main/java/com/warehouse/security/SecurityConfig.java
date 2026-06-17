package com.warehouse.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Stateless JWT security configuration.
 *
 * Role permission matrix enforced here at the HTTP level; individual
 * methods use @PreAuthorize for fine-grained control where needed.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/actuator/health").permitAll()

                // Products (spec §3.3)
                .requestMatchers(HttpMethod.POST, "/api/products").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/products/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/products/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/products/**").hasAnyRole("ADMIN","MANAGER","OPERATOR")

                // Warehouses
                .requestMatchers(HttpMethod.POST, "/api/warehouses").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/warehouses/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/warehouses/**").hasAnyRole("ADMIN","MANAGER","OPERATOR")

                // Stock movements
                .requestMatchers(HttpMethod.POST, "/api/stocks/movements").hasAnyRole("ADMIN","MANAGER","OPERATOR")
                .requestMatchers(HttpMethod.GET, "/api/stocks/**").hasAnyRole("ADMIN","MANAGER")

                // AI chat
                .requestMatchers("/api/ai/chat").hasAnyRole("ADMIN","MANAGER")

                // Anomalies
                .requestMatchers("/api/anomalies/**").hasAnyRole("ADMIN","MANAGER")

                // Users
                .requestMatchers("/api/users/**").hasRole("ADMIN")

                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}
