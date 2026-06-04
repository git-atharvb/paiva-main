package com.paiva.controllers;

import com.paiva.model.User;
import com.paiva.payload.request.UpdateSettingsRequest;
import com.paiva.repository.UserRepository;
import com.paiva.security.service.UserDetailsImpl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/settings")
    public ResponseEntity<?> getUserSettings() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        Optional<User> userOpt = userRepository.findById(userDetails.getId());
        if (userOpt.isPresent()) {
            Map<String, String> response = new HashMap<>();
            response.put("customInstructions", userOpt.get().getCustomInstructions());
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body("Error: User not found.");
    }

    @PutMapping("/settings")
    public ResponseEntity<?> updateUserSettings(@RequestBody UpdateSettingsRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        Optional<User> userOpt = userRepository.findById(userDetails.getId());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setCustomInstructions(request.getCustomInstructions());
            userRepository.save(user);
            return ResponseEntity.ok("User settings updated successfully!");
        }
        return ResponseEntity.badRequest().body("Error: User not found.");
    }
}
