import axios from 'axios';
import { 
  LessonRequest, 
  LessonUpdateRequest, 
  LessonResponse, 
  PageResponse 
} from '@/types/api';

const API_BASE = import.meta.env.VITE_API_URL || '';
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';

// Mock data for development
const mockLessons: LessonResponse[] = [
  {
    id: 1,
    class: { id: 1, name: "9A" },
    teacher: { id: 2, fullName: "John Doe" },
    rooms: [
      { id: 3, name: "Lab 1", type: "SPECIAL" }
    ],
    subject: { id: 4, name: "Physics" },
    lessonCount: 2,
    dayOfWeek: "MONDAY",
    hour: 3,
    period: 1,
    createdDate: "2025-10-28T08:15:12Z",
    updatedDate: "2025-10-28T09:45:32Z"
  }
];

export const lessonsApi = USE_MOCK_API ? {
  // Mock implementations
  getLessons: async (page: number, size: number = 10): Promise<PageResponse<LessonResponse>> => ({
    content: mockLessons,
    totalPages: 1,
    totalElements: mockLessons.length,
    size,
    number: page
  }),

  getAllLessons: async (): Promise<LessonResponse[]> => mockLessons,

  createLesson: async (lesson: LessonRequest): Promise<LessonResponse> => ({
    id: Math.max(...mockLessons.map(l => l.id)) + 1,
    class: { id: lesson.classId, name: "Class " + lesson.classId },
    teacher: { id: lesson.teacherId, fullName: "Teacher " + lesson.teacherId },
    rooms: lesson.roomIds.map(id => ({ id, name: "Room " + id, type: "SHARED" })),
    subject: { id: lesson.subjectId, name: "Subject " + lesson.subjectId },
    lessonCount: lesson.lessonCount,
    dayOfWeek: lesson.dayOfWeek,
    hour: lesson.hour,
    period: lesson.period,
    createdDate: new Date().toISOString(),
    updatedDate: new Date().toISOString()
  }),

  updateLesson: async (lesson: LessonUpdateRequest): Promise<LessonResponse> => ({
    id: lesson.id,
    class: { id: lesson.classId, name: "Class " + lesson.classId },
    teacher: { id: lesson.teacherId, fullName: "Teacher " + lesson.teacherId },
    rooms: lesson.roomIds.map(id => ({ id, name: "Room " + id, type: "SHARED" })),
    subject: { id: lesson.subjectId, name: "Subject " + lesson.subjectId },
    lessonCount: lesson.lessonCount,
    dayOfWeek: lesson.dayOfWeek,
    hour: lesson.hour,
    period: lesson.period,
    createdDate: mockLessons.find(l => l.id === lesson.id)?.createdDate || new Date().toISOString(),
    updatedDate: new Date().toISOString()
  }),

  deleteLesson: async (id: number): Promise<void> => {
    const index = mockLessons.findIndex(l => l.id === id);
    if (index > -1) mockLessons.splice(index, 1);
  }
} : {
  // Real API implementations
  // Get paginated lessons
  getLessons: async (page: number, size: number = 10): Promise<PageResponse<LessonResponse>> => {
    const response = await axios.get(`${API_BASE}/api/lessons/v1`, {
      params: { page, size }
    });
    return response.data;
  },

  // Get all lessons
  getAllLessons: async (): Promise<LessonResponse[]> => {
    const response = await axios.get(`${API_BASE}/api/lessons/v1/all`);
    return response.data;
  },

  // Create new lesson
  createLesson: async (lesson: LessonRequest): Promise<LessonResponse> => {
    const response = await axios.post(`${API_BASE}/api/lessons/v1`, lesson);
    return response.data;
  },

  // Update lesson
  updateLesson: async (lesson: LessonUpdateRequest): Promise<LessonResponse> => {
    const response = await axios.put(`${API_BASE}/api/lessons/v1`, lesson);
    return response.data;
  },

  // Delete lesson
  deleteLesson: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE}/api/lessons/v1/${id}`);
  }
};

// Helper function to format rooms display
export const formatRooms = (rooms: LessonResponse['rooms']): string => {
  return rooms
    .map(room => `${room.name} (${room.type})`)
    .join(', ');
};