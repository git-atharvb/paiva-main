package com.paiva.security.service;

import java.util.Optional;

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

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.paiva.exception.AccountLockedException;
import com.paiva.exception.TokenRefreshException;
import com.paiva.model.AuthProvider;
import com.paiva.model.RefreshToken;
import com.paiva.model.User;
import com.paiva.payload.request.GoogleLoginRequest;
import com.paiva.payload.request.LoginRequest;
import com.paiva.payload.request.SignupRequest;
import com.paiva.payload.request.TokenRefreshRequest;
import com.paiva.payload.response.JwtResponse;
import com.paiva.payload.response.MessageResponse;
import com.paiva.payload.response.TokenRefreshResponse;
import com.paiva.repository.UserRepository;
import com.paiva.security.jwt.JwtUtils;

import jakarta.servlet.http.HttpServletRequest;

@Service
public class AuthService {

    @org.springframework.beans.factory.annotation.Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleClientId;

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

    public JwtResponse authenticateGoogleUser(GoogleLoginRequest googleLoginRequest) throws Exception {
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                .setAudience(java.util.Collections.singletonList(googleClientId))
                .build();

        GoogleIdToken idToken = verifier.verify(googleLoginRequest.getIdToken());
        if (idToken != null) {
            GoogleIdToken.Payload payload = idToken.getPayload();

            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String googleId = payload.getSubject();

            Optional<User> userOpt = userRepository.findByEmail(email);
            User user;
            if (userOpt.isPresent()) {
                user = userOpt.get();
                // Optionally update provider if they signed up with email before
                if (user.getProvider() != AuthProvider.GOOGLE) {
                    user.setProvider(AuthProvider.GOOGLE);
                    user.setProviderId(googleId);
                    userRepository.save(user);
                }
            } else {
                user = new User(email, null, name);
                user.setProvider(AuthProvider.GOOGLE);
                user.setProviderId(googleId);
                userRepository.save(user);
            }

            UserDetailsImpl userDetails = UserDetailsImpl.build(user);
            
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities());
            
            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtils.generateJwtToken(authentication);
            
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());
            
            return new JwtResponse(jwt, refreshToken.getToken(), userDetails.getId(),
                    userDetails.getName(), userDetails.getUsername());
        } else {
            throw new Exception("Invalid ID token.");
        }
    }
}
