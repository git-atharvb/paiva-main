package com.paiva.security.service;

import com.paiva.model.LoginAttempt;
import com.paiva.model.User;
import com.paiva.repository.LoginAttemptRepository;
import com.paiva.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
public class SecurityAuditService {

    public static final int MAX_FAILED_ATTEMPTS = 5;
    private static final long LOCK_TIME_DURATION_MINUTES = 15;

    @Autowired
    private LoginAttemptRepository loginAttemptRepository;

    @Autowired
    private UserRepository userRepository;

    public void logLoginAttempt(String email, String ipAddress, boolean success) {
        LoginAttempt attempt = new LoginAttempt(email, ipAddress, success);
        loginAttemptRepository.save(attempt);

        if (!success) {
            handleFailedAttempt(email);
        } else {
            handleSuccessfulAttempt(email);
        }
    }

    private void handleFailedAttempt(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.isAccountNonLocked()) {
                int attempts = user.getFailedLoginAttempts() + 1;
                user.setFailedLoginAttempts(attempts);
                
                if (attempts >= MAX_FAILED_ATTEMPTS) {
                    lock(user);
                }
                userRepository.save(user);
            }
        }
    }

    private void handleSuccessfulAttempt(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getFailedLoginAttempts() > 0) {
                user.setFailedLoginAttempts(0);
                userRepository.save(user);
            }
        }
    }

    private void lock(User user) {
        user.setAccountNonLocked(false);
        user.setLockTime(Instant.now());
    }

    public boolean unlockWhenTimeExpired(User user) {
        if (user.getLockTime() == null) return false;
        
        long lockTimeInMillis = user.getLockTime().toEpochMilli();
        long currentTimeInMillis = System.currentTimeMillis();

        if (lockTimeInMillis + (LOCK_TIME_DURATION_MINUTES * 60 * 1000) < currentTimeInMillis) {
            user.setAccountNonLocked(true);
            user.setLockTime(null);
            user.setFailedLoginAttempts(0);

            userRepository.save(user);
            return true;
        }
        return false;
    }
}
