package com.paiva.payload.request;

public class ChatRequest {
    private String conversationId;
    private String message;
    private boolean contextImageEnabled;
    private String aiModel;
    private String attachedDocumentText;
    private String attachedImageBase64;
    private String userLocation;

    public ChatRequest() {}

    public ChatRequest(String conversationId, String message) {
        this.conversationId = conversationId;
        this.message = message;
    }

    public String getConversationId() {
        return conversationId;
    }

    public void setConversationId(String conversationId) {
        this.conversationId = conversationId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isContextImageEnabled() {
        return contextImageEnabled;
    }

    public void setContextImageEnabled(boolean contextImageEnabled) {
        this.contextImageEnabled = contextImageEnabled;
    }

    public String getAiModel() {
        return aiModel;
    }

    public void setAiModel(String aiModel) {
        this.aiModel = aiModel;
    }

    public String getAttachedDocumentText() {
        return attachedDocumentText;
    }

    public void setAttachedDocumentText(String attachedDocumentText) {
        this.attachedDocumentText = attachedDocumentText;
    }

    public String getAttachedImageBase64() {
        return attachedImageBase64;
    }

    public void setAttachedImageBase64(String attachedImageBase64) {
        this.attachedImageBase64 = attachedImageBase64;
    }

    public String getUserLocation() {
        return userLocation;
    }

    public void setUserLocation(String userLocation) {
        this.userLocation = userLocation;
    }
}
