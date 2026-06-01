package com.paiva.security.service;

import com.paiva.exception.AccountLockedException;
import com.paiva.exception.TokenRefreshException;
import com.paiva.model.RefreshToken;
import com.paiva.model.User;
import com.paiva.payload.request.LoginRequest;
import com.paiva.payload.request.SignupRequest;
import com.paiva.payload.request.TokenRefreshRequest;
import com.paiva.payload.response.JwtResponse;
import com.paiva.payload.response.MessageResponse;
import com.paiva.payload.response.TokenRefreshResponse;
import com.paiva.repository.UserRepository;
import com.paiva.security.jwt.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder encoder;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private SecurityAuditService securityAuditService;

    private String getClientIP() {
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }

    public JwtResponse authenticateUser(LoginRequest loginRequest) {
        String ip = getClientIP();
        
        Optional<User> userOpt = userRepository.findByEmail(loginRequest.getEmail());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (!user.isAccountNonLocked()) {
                if (!securityAuditService.unlockWhenTimeExpired(user)) {
                    securityAuditService.logLoginAttempt(loginRequest.getEmail(), ip, false);
                    throw new AccountLockedException("Your account has been locked due to 5 failed attempts. Please try again after 15 minutes.");
                }
            }
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtils.generateJwtToken(authentication);

            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(userDetails.getId());
            
            securityAuditService.logLoginAttempt(loginRequest.getEmail(), ip, true);

            return new JwtResponse(jwt, refreshToken.getToken(), userDetails.getId(),
                    userDetails.getName(), userDetails.getUsername());
        } catch (BadCredentialsException e) {
            securityAuditService.logLoginAttempt(loginRequest.getEmail(), ip, false);
            throw e;
        }
    }

    public MessageResponse registerUser(SignupRequest signUpRequest) {
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            throw new IllegalArgumentException("Error: Email is already in use!");
        }

        User user = new User(signUpRequest.getEmail(),
                             encoder.encode(signUpRequest.getPassword()),
                             signUpRequest.getName());

        userRepository.save(user);

        return new MessageResponse("User registered successfully!");
    }

    public TokenRefreshResponse refreshToken(TokenRefreshRequest request) {
        String requestRefreshToken = request.getRefreshToken();

        return refreshTokenService.findByToken(requestRefreshToken)
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    String token = jwtUtils.generateTokenFromUsername(user.getEmail());
                    return new TokenRefreshResponse(token, requestRefreshToken);
                })
                .orElseThrow(() -> new TokenRefreshException(requestRefreshToken,
                        "Refresh token is not in database!"));
    }
}
