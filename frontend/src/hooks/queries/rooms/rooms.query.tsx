import axios from "axios";
import { useQuery } from "@tanstack/react-query";

// const ROOT = "http://192.168.1.24:8000/";
const ROOT = "http://localhost:8000/";
const ROOM_LIST = ROOT + "rooms";

export const useGetRoomsList = () => {
  return useQuery({
    queryKey: [ROOM_LIST],
    queryFn: async () => {
      const res = await axios.get<any>(ROOM_LIST);
      return res?.data ?? null;
    },
    refetchInterval: 10000, // 10 seconds
  });
};
