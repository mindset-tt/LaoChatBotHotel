import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { 
  MOCK_DATA_ENABLED, 
  mockChatSessions, 
  mockChatHistory 
} from './mockData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Optimized API client for chat functionality
const chatApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // Longer timeout for chat responses
  headers: {
    'Content-Type': 'application/json',
  },
});

// Fallback function for mock data
const apiCallWithFallback = async <T>(
  apiCall: () => Promise<T>,
  mockData: T,
  endpoint: string
): Promise<T> => {
  if (MOCK_DATA_ENABLED) {
    console.log(`🎭 Using mock data for ${endpoint}`);
    return mockData;
  }

  try {
    return await apiCall();
  } catch (error) {
    console.warn(`⚠️ API call failed for ${endpoint}, falling back to mock data:`, error);
    return mockData;
  }
};

// Types for better TypeScript support
export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface ChatRequest {
  message: string;
  session_id?: string;
}

// Chat History Hooks
export const useChatHistoryList = () => {
  return useQuery({
    queryKey: ['chat', 'history', 'list'],
    queryFn: async (): Promise<ChatSession[]> => {
      return await apiCallWithFallback(
        async () => {
          const response = await chatApiClient.get('/history/all');
          return response.data;
        },
        mockChatSessions,
        'chat-history-list'
      );
    },
    staleTime: 60000, // History list doesn't change often
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

export const useChatHistory = (sessionId: string | undefined) => {
  return useQuery({
    queryKey: ['chat', 'history', sessionId],
    queryFn: async (): Promise<ChatSession> => {
      if (!sessionId) throw new Error('Session ID required');
      return await apiCallWithFallback(
        async () => {
          const response = await chatApiClient.get(`/history/${sessionId}`);
          return response.data;
        },
        mockChatHistory.find(session => session.session_id === sessionId) || mockChatHistory[0],
        `chat-history-${sessionId}`
      );
    },
    enabled: !!sessionId,
    staleTime: 30000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

// Optimized Chat Mutation
export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (request: ChatRequest): Promise<any> => {
      if (MOCK_DATA_ENABLED) {
        console.log('🎭 Mock: Sending chat message', request);
        return {
          id: `msg_${Date.now()}`,
          content: "This is a mock response from the AI assistant using optimized chat hooks.",
          sender: 'assistant',
          timestamp: new Date().toISOString(),
          session_id: request.session_id || 'mock_session'
        };
      }
      
      const response = await chatApiClient.post('/ask', request);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Update chat history list
      queryClient.invalidateQueries({ queryKey: ['chat', 'history', 'list'] });
      
      // If we have a session_id, update that specific session
      if (variables.session_id) {
        queryClient.invalidateQueries({ 
          queryKey: ['chat', 'history', variables.session_id] 
        });
      }
    },
    onError: (error) => {
      console.error('Chat error:', error);
    },
  });
};

// Prefetch utilities for better UX
export const usePrefetchChatHistory = () => {
  const queryClient = useQueryClient();
  
  return {
    prefetchHistoryList: () => {
      queryClient.prefetchQuery({
        queryKey: ['chat', 'history', 'list'],
        queryFn: async () => {
          const response = await chatApiClient.get('/history/all');
          return response.data;
        },
        staleTime: 60000,
      });
    },
    prefetchSession: (sessionId: string) => {
      queryClient.prefetchQuery({
        queryKey: ['chat', 'history', sessionId],
        queryFn: async () => {
          const response = await chatApiClient.get(`/history/${sessionId}`);
          return response.data;
        },
        staleTime: 30000,
      });
    },
  };
};

// Optimistic updates for better UX
export const useOptimisticChat = () => {
  const queryClient = useQueryClient();
  
  const addOptimisticMessage = (sessionId: string, message: ChatMessage) => {
    queryClient.setQueryData(
      ['chat', 'history', sessionId],
      (old: ChatSession | undefined) => {
        if (!old) return old;
        return {
          ...old,
          messages: [...old.messages, message],
        };
      }
    );
  };

  const removeOptimisticMessage = (sessionId: string, messageId: string) => {
    queryClient.setQueryData(
      ['chat', 'history', sessionId],
      (old: ChatSession | undefined) => {
        if (!old) return old;
        return {
          ...old,
          messages: old.messages.filter(msg => msg.id !== messageId),
        };
      }
    );
  };

  return { addOptimisticMessage, removeOptimisticMessage };
};

export default {
  useChatHistoryList,
  useChatHistory,
  useSendMessage,
  usePrefetchChatHistory,
  useOptimisticChat,
};
