package com.paiva.model;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "users")
public class User {
    @Id
    private String id;
    
    private String email;
    private String password;
    private String name;
    
    private AuthProvider provider = AuthProvider.LOCAL;
    private String providerId;
    
    private String googleAccessToken;
    private String googleRefreshToken;
    
    private String customInstructions;
    private String assistantName = "PAIVA";
    private String aboutUser;
    private String responseStyle = "Balanced";
    private boolean memoryEnabled = true;

    private String aiModel = "paiva-core";
    private Integer aiCreativity = 50;
    private boolean autoPlayVoice = true;
    private boolean uiSoundsEnabled = true;

    private String currentFocus;
    private String expertiseLevel = "Intermediate";
    private String uiDensity = "Comfortable";
    private String preferredLanguage = "English";
    private String userDisplayName;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    private boolean accountNonLocked = true;
    private boolean enabled = true;
    private int failedLoginAttempts = 0;
    private Instant lockTime;

    public User() {
    }

    public User(String email, String password, String name) {
        this.email = email;
        this.password = password;
        this.name = name;
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

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public boolean isAccountNonLocked() {
        return accountNonLocked;
    }

    public void setAccountNonLocked(boolean accountNonLocked) {
        this.accountNonLocked = accountNonLocked;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public int getFailedLoginAttempts() {
        return failedLoginAttempts;
    }

    public void setFailedLoginAttempts(int failedLoginAttempts) {
        this.failedLoginAttempts = failedLoginAttempts;
    }

    public Instant getLockTime() {
        return lockTime;
    }

    public void setLockTime(Instant lockTime) {
        this.lockTime = lockTime;
    }

    public AuthProvider getProvider() {
        return provider;
    }

    public void setProvider(AuthProvider provider) {
        this.provider = provider;
    }

    public String getProviderId() {
        return providerId;
    }

    public void setProviderId(String providerId) {
        this.providerId = providerId;
    }

    public String getGoogleAccessToken() {
        return googleAccessToken;
    }

    public void setGoogleAccessToken(String googleAccessToken) {
        this.googleAccessToken = googleAccessToken;
    }

    public String getGoogleRefreshToken() {
        return googleRefreshToken;
    }

    public void setGoogleRefreshToken(String googleRefreshToken) {
        this.googleRefreshToken = googleRefreshToken;
    }

    public String getCustomInstructions() {
        return customInstructions;
    }

    public void setCustomInstructions(String customInstructions) {
        this.customInstructions = customInstructions;
    }

    public String getAssistantName() {
        return assistantName;
    }

    public void setAssistantName(String assistantName) {
        this.assistantName = assistantName;
    }

    public String getAboutUser() {
        return aboutUser;
    }

    public void setAboutUser(String aboutUser) {
        this.aboutUser = aboutUser;
    }

    public String getResponseStyle() {
        return responseStyle;
    }

    public void setResponseStyle(String responseStyle) {
        this.responseStyle = responseStyle;
    }

    public boolean isMemoryEnabled() {
        return memoryEnabled;
    }

    public void setMemoryEnabled(boolean memoryEnabled) {
        this.memoryEnabled = memoryEnabled;
    }

    public String getAiModel() {
        return aiModel;
    }

    public void setAiModel(String aiModel) {
        this.aiModel = aiModel;
    }

    public Integer getAiCreativity() {
        return aiCreativity;
    }

    public void setAiCreativity(Integer aiCreativity) {
        this.aiCreativity = aiCreativity;
    }

    public boolean isAutoPlayVoice() {
        return autoPlayVoice;
    }

    public void setAutoPlayVoice(boolean autoPlayVoice) {
        this.autoPlayVoice = autoPlayVoice;
    }

    public boolean isUiSoundsEnabled() {
        return uiSoundsEnabled;
    }

    public void setUiSoundsEnabled(boolean uiSoundsEnabled) {
        this.uiSoundsEnabled = uiSoundsEnabled;
    }

    public String getCurrentFocus() {
        return currentFocus;
    }

    public void setCurrentFocus(String currentFocus) {
        this.currentFocus = currentFocus;
    }

    public String getExpertiseLevel() {
        return expertiseLevel;
    }

    public void setExpertiseLevel(String expertiseLevel) {
        this.expertiseLevel = expertiseLevel;
    }

    public String getUiDensity() {
        return uiDensity;
    }

    public void setUiDensity(String uiDensity) {
        this.uiDensity = uiDensity;
    }

    public String getPreferredLanguage() {
        return preferredLanguage;
    }

    public void setPreferredLanguage(String preferredLanguage) {
        this.preferredLanguage = preferredLanguage;
    }

    public String getUserDisplayName() {
        return userDisplayName;
    }

    public void setUserDisplayName(String userDisplayName) {
        this.userDisplayName = userDisplayName;
    }
}
