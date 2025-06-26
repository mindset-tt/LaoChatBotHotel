import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// Optimized API client for chat functionality
const chatApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // Longer timeout for chat responses
  headers: {
    'Content-Type': 'application/json',
  },
});

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
      const response = await chatApiClient.get('/history/all');
      return response.data;
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
      const response = await chatApiClient.get(`/history/${sessionId}`);
      return response.data;
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
