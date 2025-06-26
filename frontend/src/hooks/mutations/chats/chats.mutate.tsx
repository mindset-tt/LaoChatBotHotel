import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { MOCK_DATA_ENABLED } from "../../mockData";

export const chatsMutate = {};

const ROOT = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/";
const ASK = ROOT + "ask";
const HISTORY = ROOT + "history/";
const HISTORY_LIST = ROOT + "history/all";

export const useGetChats = () => {
  return useMutation({
    mutationFn: async (request: any) => {
      if (MOCK_DATA_ENABLED) {
        console.log("🎭 Mock: Chat request", request);
        return {
          id: `msg_${Date.now()}`,
          content: "This is a mock response from the AI assistant via chat mutations.",
          sender: 'assistant',
          timestamp: new Date().toISOString(),
          session_id: request.session_id || 'mock_session'
        };
      }
      
      console.log("Calling axios with:", request);
      const res = await axios.post<any>(ASK, request, { timeout: 0 });
      return res?.data ?? null;
    },
  });
};
export const useGetChatsHistory = () => {
  return useMutation({
    mutationFn: async (request: any) => {
      if (MOCK_DATA_ENABLED) {
        console.log("🎭 Mock: Chat history request", request);
        return {
          session_id: request.id,
          messages: [
            {
              id: "1",
              content: "Hello! How can I help you today?",
              sender: "assistant",
              timestamp: new Date().toISOString()
            }
          ]
        };
      }
      
      const res = await axios.get<any>(HISTORY + request.id);
      return res?.data ?? null;
    },
  });
};

export const useGetChatsHistoryList = () => {
  return useMutation({
    mutationFn: async () => {
      if (MOCK_DATA_ENABLED) {
        console.log("🎭 Mock: Chat history list request");
        return [
          {
            session_id: "mock_session_1",
            title: "General Inquiry",
            last_message: "Hello! How can I help you today?",
            timestamp: new Date().toISOString()
          },
          {
            session_id: "mock_session_2", 
            title: "Booking Question",
            last_message: "I'd like to make a reservation",
            timestamp: new Date(Date.now() - 86400000).toISOString()
          }
        ];
      }
      
      const res = await axios.get<any>(HISTORY_LIST);
      return res?.data ?? null;
    },
  });
};
