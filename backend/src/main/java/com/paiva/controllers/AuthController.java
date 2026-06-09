package com.paiva.controllers;

import com.paiva.payload.request.GoogleLoginRequest;
import com.paiva.payload.request.LoginRequest;
import com.paiva.payload.request.SignupRequest;
import com.paiva.payload.request.TokenRefreshRequest;
import com.paiva.security.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"}, maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        return ResponseEntity.ok(authService.authenticateUser(loginRequest));
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        try {
            return ResponseEntity.ok(authService.registerUser(signUpRequest));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new com.paiva.payload.response.MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/refreshtoken")
    public ResponseEntity<?> refreshtoken(@Valid @RequestBody TokenRefreshRequest request) {
        return ResponseEntity.ok(authService.refreshToken(request));
    }

    @PostMapping("/google")
    public ResponseEntity<?> authenticateGoogleUser(@Valid @RequestBody GoogleLoginRequest googleLoginRequest) {
        try {
            return ResponseEntity.ok(authService.authenticateGoogleUser(googleLoginRequest));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new com.paiva.payload.response.MessageResponse("Google authentication failed: " + e.getMessage()));
        }
    }
}
