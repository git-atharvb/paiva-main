import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { chatService } from '../services/chatService';
import type { Conversation, Message as ApiMessage } from '../services/chatService';
import toast from 'react-hot-toast';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatContextType {
  conversations: Conversation[];
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  refreshConversations: () => Promise<void>;
  isLoadingHistory: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const refreshConversations = useCallback(async () => {
    try {
      const data = await chatService.getConversations();
      setConversations(data);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    // eslint-disable-next-line
    refreshConversations().then(() => {
      // We don't automatically select the first chat because we want them to see 
      // the welcome message and start a new chat by default, or we can select it.
      // The user requested "able to store chats all on the respective user login and user should be able to access all chats properly".
      // Let's not auto-select so New Conversation is default.
    });
  }, [refreshConversations]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConversationId) {
      setTimeout(() => {
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: 'Hi — I\'m PAIVA. How can I help you today?'
        }]);
      }, 0);
      return;
    }

    let isMounted = true;
    // eslint-disable-next-line
    setIsLoadingHistory(true);

    chatService.getMessages(activeConversationId)
      .then((apiMessages: ApiMessage[]) => {
        if (!isMounted) return;
        const mapped = apiMessages.map(m => ({
          id: m.id,
          role: m.role.toLowerCase() as 'user' | 'assistant' | 'system',
          content: m.content
        }));
        setMessages(mapped);
      })
      .catch(err => {
        console.error('Failed to load messages', err);
        if (isMounted) toast.error('Failed to load conversation history');
      })
      .finally(() => {
        if (isMounted) setIsLoadingHistory(false);
      });

    return () => { isMounted = false; };
  }, [activeConversationId]);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversationId,
        setActiveConversationId,
        messages,
        setMessages,
        refreshConversations,
        isLoadingHistory
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
