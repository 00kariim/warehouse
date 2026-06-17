package com.warehouse.controller;

import com.warehouse.dto.PageResponse;
import com.warehouse.entity.User;
import com.warehouse.service.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    record CreateUserRequest(
            @NotBlank @Size(max = 255) String username,
            @NotBlank @Size(min = 8) String password,
            @NotBlank String role
    ) {}

    @GetMapping
    public ResponseEntity<PageResponse<User>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(PageResponse.of(userService.findAll(pageable)));
    }

    @PostMapping
    public ResponseEntity<User> create(@Valid @RequestBody CreateUserRequest req) {
        User user = userService.create(req.username(), req.password(), User.Role.valueOf(req.role()));
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }
}
