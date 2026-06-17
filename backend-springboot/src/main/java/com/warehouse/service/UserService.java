package com.warehouse.service;

import com.warehouse.entity.User;
import com.warehouse.exception.ConflictException;
import com.warehouse.exception.ResourceNotFoundException;
import com.warehouse.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public Page<User> findAll(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    @Transactional
    public User create(String username, String rawPassword, User.Role role) {
        if (userRepository.existsByUsername(username)) {
            throw new ConflictException("Username '" + username + "' is already taken");
        }
        User user = User.builder()
                .username(username)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .role(role)
                .build();
        return userRepository.save(user);
    }
}
