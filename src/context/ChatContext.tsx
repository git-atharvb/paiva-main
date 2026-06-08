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
  setConversationIdWithoutFetch: (id: string) => void;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  
  secondaryConversationId: string | null;
  setSecondaryConversationId: (id: string | null) => void;
  setSecondaryConversationIdWithoutFetch: (id: string) => void;
  secondaryMessages: ChatMessage[];
  setSecondaryMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  
  refreshConversations: () => Promise<void>;
  isLoadingHistory: boolean;
  isLoadingSecondaryHistory: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [secondaryConversationId, setSecondaryConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [secondaryMessages, setSecondaryMessages] = useState<ChatMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingSecondaryHistory, setIsLoadingSecondaryHistory] = useState(false);
  const skipNextFetch = React.useRef(false);
  const skipNextSecondaryFetch = React.useRef(false);

  const setConversationIdWithoutFetch = useCallback((id: string) => {
    skipNextFetch.current = true;
    setActiveConversationId(id);
  }, []);

  const setSecondaryConversationIdWithoutFetch = useCallback((id: string) => {
    skipNextSecondaryFetch.current = true;
    setSecondaryConversationId(id);
  }, []);

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
    refreshConversations().then(() => {});
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

    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }

    let isMounted = true;
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

  // Load secondary messages
  useEffect(() => {
    if (!secondaryConversationId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSecondaryMessages([]);
      return;
    }

    if (skipNextSecondaryFetch.current) {
      skipNextSecondaryFetch.current = false;
      return;
    }

    let isMounted = true;
    setIsLoadingSecondaryHistory(true);

    chatService.getMessages(secondaryConversationId)
      .then((apiMessages: ApiMessage[]) => {
        if (!isMounted) return;
        const mapped = apiMessages.map(m => ({
          id: m.id,
          role: m.role.toLowerCase() as 'user' | 'assistant' | 'system',
          content: m.content
        }));
        setSecondaryMessages(mapped);
      })
      .catch(err => {
        console.error('Failed to load secondary messages', err);
        if (isMounted) toast.error('Failed to load split view history');
      })
      .finally(() => {
        if (isMounted) setIsLoadingSecondaryHistory(false);
      });

    return () => { isMounted = false; };
  }, [secondaryConversationId]);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversationId,
        setActiveConversationId,
        setConversationIdWithoutFetch,
        messages,
        setMessages,
        secondaryConversationId,
        setSecondaryConversationId,
        setSecondaryConversationIdWithoutFetch,
        secondaryMessages,
        setSecondaryMessages,
        refreshConversations,
        isLoadingHistory,
        isLoadingSecondaryHistory
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
