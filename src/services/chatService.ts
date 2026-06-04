import { fetchWithAuth } from './api';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  timestamp: string;
}

export const chatService = {
  getConversations: async (): Promise<Conversation[]> => {
    const response = await fetchWithAuth('/api/chat/conversations');
    if (!response.ok) throw new Error('Failed to fetch conversations');
    return response.json();
  },

  getMessages: async (conversationId: string): Promise<Message[]> => {
    const response = await fetchWithAuth(`/api/chat/conversations/${conversationId}/messages`);
    if (!response.ok) throw new Error('Failed to fetch messages');
    return response.json();
  },

  deleteConversation: async (conversationId: string): Promise<void> => {
    const response = await fetchWithAuth(`/api/chat/conversations/${conversationId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete conversation');
  },

  renameConversation: async (conversationId: string, title: string): Promise<Conversation> => {
    const response = await fetchWithAuth(`/api/chat/conversations/${conversationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
    if (!response.ok) throw new Error('Failed to rename conversation');
    return response.json();
  },

  streamMessage: async (
    conversationId: string | null,
    message: string,
    contextImageEnabled: boolean,
    aiModel: string | undefined,
    attachedDocumentText: string | undefined,
    attachedImageBase64: string | undefined,
    userLocation: string | undefined,
    onChunk: (data: { conversationId?: string, c?: string }) => void,
    onComplete: () => void,
    onError: (err: Error) => void,
    signal?: AbortSignal
  ) => {
    try {
      const userStr = localStorage.getItem('user');
      let token = '';
      if (userStr) {
        const user = JSON.parse(userStr);
        token = user.accessToken || user.token;
      }

      const response = await fetch(`${API_BASE}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ conversationId, message, contextImageEnabled, aiModel, attachedDocumentText, attachedImageBase64, userLocation }),
        signal
      });

      if (!response.ok) {
        throw new Error(`Stream failed with status ${response.status}`);
      }

      if (!response.body) throw new Error('ReadableStream not supported');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          
          if (line.startsWith('data:')) {
            const dataStr = line.substring(5).trim();
            if (dataStr === '[DONE]') {
              continue;
            }
            try {
              const json = JSON.parse(dataStr);
              onChunk(json);
            } catch {
              // Ignore malformed chunks
            }
          }
        }
      }
      
      // Process any remaining text in buffer
      if (buffer.startsWith('data:')) {
        const dataStr = buffer.substring(5).trim();
        if (dataStr !== '[DONE]') {
          try {
            const json = JSON.parse(dataStr);
            onChunk(json);
          } catch {
            // Ignore malformed chunks
          }
        }
      }
      
      onComplete();
    } catch (err) {
      onError(err instanceof Error ? err : new Error('Unknown stream error'));
    }
  }
};
