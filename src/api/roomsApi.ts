import axios from 'axios';

// Types
export interface TimeSlot {
  dayOfWeek: string;
  startHour: number;
  endHour: number;
}

export interface RoomResponse {
  id: number;
  name: string;
  shortName: string;
  type: 'SHARED' | 'SPECIAL';
  availabilities: TimeSlot[];
}

const API_BASE = import.meta.env.VITE_API_URL || '';
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';

export const roomsApi = USE_MOCK_API ? {
  getAllRooms: async (): Promise<RoomResponse[]> => {
    return [
      {
        id: 1,
        name: "Physics Lab",
        shortName: "PHY-1",
        type: "SPECIAL",
        availabilities: []
      }
    ];
  }
} : {
  getAllRooms: async (): Promise<RoomResponse[]> => {
    const response = await axios.get(`${API_BASE}/api/rooms/v1/all`);
    return response.data;
  }
};