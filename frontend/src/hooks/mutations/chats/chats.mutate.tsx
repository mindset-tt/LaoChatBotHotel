import { useMutation } from "@tanstack/react-query";
import axios from "axios";

export const chatsMutate = {};
// const ROOT = "http://192.168.1.24:8000/";
const ROOT = "http://localhost:8000/";
const ASK = ROOT + "ask";
const HISTORY = ROOT + "history/";
const HISTORY_LIST = ROOT + "history/all";

export const useGetChats = () => {
  return useMutation({
    mutationFn: async (request: any) => {
      console.log("Calling axios with:", request);
      const res = await axios.post<any>(ASK, request, { timeout: 0 });
      return res?.data ?? null;
    },
  });
};
export const useGetChatsHistory = () => {
  return useMutation({
    mutationFn: async (request: any) => {
      const res = await axios.get<any>(HISTORY + request.id);
      return res?.data ?? null;
    },
  });
};

export const useGetChatsHistoryList = () => {
  return useMutation({
    mutationFn: async () => {
      const res = await axios.get<any>(HISTORY_LIST);
      return res?.data ?? null;
    },
  });
};
