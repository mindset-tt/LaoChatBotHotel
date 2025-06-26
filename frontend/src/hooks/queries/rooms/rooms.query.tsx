import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { MOCK_DATA_ENABLED, mockRooms } from "../../mockData";

const ROOT = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/";
const ROOM_LIST = ROOT + "rooms";

export const useGetRoomsList = () => {
  return useQuery({
    queryKey: [ROOM_LIST],
    queryFn: async () => {
      if (MOCK_DATA_ENABLED) {
        console.log("🎭 Mock: Rooms list request");
        return mockRooms;
      }
      
      const res = await axios.get<any>(ROOM_LIST);
      return res?.data ?? null;
    },
    refetchInterval: 10000, // 10 seconds
  });
};
