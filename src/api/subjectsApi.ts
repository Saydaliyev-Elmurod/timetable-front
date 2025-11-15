import axios from 'axios';
import { TimeSlot } from './roomsApi';  // Reuse the TimeSlot type

export interface SubjectResponse {
  id: number;
  shortName: string;
  name: string;
  availabilities: TimeSlot[];
  emoji: string;
  color: string;
  weight: number;
  createdDate: string;
  updatedDate: string;
}

const API_BASE = import.meta.env.VITE_API_URL || '';
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';

export const subjectsApi = USE_MOCK_API ? {
  getAllSubjects: async (): Promise<SubjectResponse[]> => {
    return [
      {
        id: 1,
        shortName: "MATH",
        name: "Mathematics",
        availabilities: [],
        emoji: "📐",
        color: "#FF5733",
        weight: 1,
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString()
      }
    ];
  }
} : {
  getAllSubjects: async (): Promise<SubjectResponse[]> => {
    const response = await axios.get(`${API_BASE}/api/subjects/v1/all`);
    return response.data;
  }
};