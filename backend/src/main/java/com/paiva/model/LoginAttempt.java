package com.paiva.model;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "login_attempts")
public class LoginAttempt {
    @Id
    private String id;

    private String email;
    private String ipAddress;
    private boolean success;

    @CreatedDate
    private Instant attemptTime;

    public LoginAttempt() {
    }

    public LoginAttempt(String email, String ipAddress, boolean success) {
        this.email = email;
        this.ipAddress = ipAddress;
        this.success = success;
    }

    public String getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public Instant getAttemptTime() {
        return attemptTime;
    }
    
    public void setAttemptTime(Instant attemptTime) {
        this.attemptTime = attemptTime;
    }
}
