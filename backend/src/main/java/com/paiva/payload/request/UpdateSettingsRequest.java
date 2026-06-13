package com.paiva.payload.request;

public class UpdateSettingsRequest {
    private String customInstructions;
    private String assistantName;
    private String aboutUser;
    private String responseStyle;
    private Boolean memoryEnabled;
    private String googleAccessToken;
    private String googleRefreshToken;
    private String aiModel;
    private Integer aiCreativity;
    private Boolean autoPlayVoice;
    private Boolean uiSoundsEnabled;
    private String currentFocus;
    private String expertiseLevel;
    private String uiDensity;
    private String preferredLanguage;
    private String userDisplayName;

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

    public Boolean getMemoryEnabled() {
        return memoryEnabled;
    }

    public void setMemoryEnabled(Boolean memoryEnabled) {
        this.memoryEnabled = memoryEnabled;
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

    public Boolean getAutoPlayVoice() {
        return autoPlayVoice;
    }

    public void setAutoPlayVoice(Boolean autoPlayVoice) {
        this.autoPlayVoice = autoPlayVoice;
    }

    public Boolean getUiSoundsEnabled() {
        return uiSoundsEnabled;
    }

    public void setUiSoundsEnabled(Boolean uiSoundsEnabled) {
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
