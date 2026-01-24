import axiosInstance from '@/lib/axios';
import { API_CONFIG } from '@/config/api';
import {
  LessonRequest,
  LessonUpdateRequest,
  LessonResponse,
  PageResponse,
  GroupLessonDetailResponse
} from '@/types/api';

const USE_MOCK_API = API_CONFIG.USE_MOCK;
const LESSONS_ENDPOINT = API_CONFIG.ENDPOINTS.LESSONS;

// Mock data for development
const mockLessons: LessonResponse[] = [
  {
    id: 1,
    class: { id: 1, name: "9A", shortName: "9A", availabilities: [], teacher: { id: 1, fullName: "Main Teacher" }, rooms: [], groups: [], createdDate: "", updatedDate: "" },
    teacher: { id: 2, fullName: "John Doe" },
    rooms: [
      { id: 3, name: "Lab 1", type: "SPECIAL" }
    ],
    subject: { id: 4, name: "Physics" },
    lessonCount: 2,
    dayOfWeek: "MONDAY",
    hour: 3,
    period: 1,
    frequency: "WEEKLY",
    groupDetails: [],
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

  createLesson: async (lesson: LessonRequest): Promise<LessonResponse> => {
    const newId = Math.max(...mockLessons.map(l => l.id), 0) + 1;
    const newLesson: LessonResponse = {
      id: newId,
      class: { 
        id: lesson.classId[0], 
        name: "Class " + lesson.classId[0],
        shortName: "C" + lesson.classId[0],
        availabilities: [],
        teacher: { id: lesson.teacherId, fullName: "Teacher " + lesson.teacherId },
        rooms: lesson.roomIds.map(id => ({ id, name: "Room " + id, type: "SHARED" })),
        groups: lesson.groups?.map((g, idx) => ({ id: g.groupId, name: "Group " + (idx + 1) })) || [],
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString()
      },
      teacher: { id: lesson.teacherId, fullName: "Teacher " + lesson.teacherId },
      rooms: lesson.roomIds.map(id => ({ id, name: "Room " + id, type: "SHARED" })),
      subject: { id: lesson.subjectId, name: "Subject " + lesson.subjectId },
      lessonCount: lesson.lessonCount,
      dayOfWeek: lesson.dayOfWeek,
      hour: lesson.hour,
      period: lesson.period,
      frequency: lesson.frequency || "WEEKLY",
      groupDetails: (lesson.groups || []).map(g => ({
        group: { id: g.groupId, name: "Group " + g.groupId },
        teacher: { id: g.teacherId, fullName: "Teacher " + g.teacherId },
        subject: { id: g.subjectId, name: "Subject " + g.subjectId },
        rooms: g.roomIds.map(id => ({ id, name: "Room " + id, type: "SHARED" }))
      })),
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString()
    };
    mockLessons.push(newLesson);
    return newLesson;
  },

  updateLesson: async (lesson: LessonUpdateRequest): Promise<LessonResponse> => {
    const existingLesson = mockLessons.find(l => l.id === lesson.id);
    const updated: LessonResponse = {
      id: lesson.id,
      class: existingLesson?.class || { 
        id: lesson.classId[0], 
        name: "Class " + lesson.classId[0],
        shortName: "C" + lesson.classId[0],
        availabilities: [],
        teacher: { id: lesson.teacherId, fullName: "Teacher " + lesson.teacherId },
        rooms: lesson.roomIds.map(id => ({ id, name: "Room " + id, type: "SHARED" })),
        groups: lesson.groups?.map((g, idx) => ({ id: g.groupId, name: "Group " + (idx + 1) })) || [],
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString()
      },
      teacher: { id: lesson.teacherId, fullName: "Teacher " + lesson.teacherId },
      rooms: lesson.roomIds.map(id => ({ id, name: "Room " + id, type: "SHARED" })),
      subject: { id: lesson.subjectId, name: "Subject " + lesson.subjectId },
      lessonCount: lesson.lessonCount,
      dayOfWeek: lesson.dayOfWeek,
      hour: lesson.hour,
      period: lesson.period,
      frequency: lesson.frequency || "WEEKLY",
      groupDetails: (lesson.groups || []).map(g => ({
        group: { id: g.groupId, name: "Group " + g.groupId },
        teacher: { id: g.teacherId, fullName: "Teacher " + g.teacherId },
        subject: { id: g.subjectId, name: "Subject " + g.subjectId },
        rooms: g.roomIds.map(id => ({ id, name: "Room " + id, type: "SHARED" }))
      })),
      createdDate: existingLesson?.createdDate || new Date().toISOString(),
      updatedDate: new Date().toISOString()
    };
    const index = mockLessons.findIndex(l => l.id === lesson.id);
    if (index > -1) mockLessons[index] = updated;
    return updated;
  },

  deleteLesson: async (id: number): Promise<void> => {
    const index = mockLessons.findIndex(l => l.id === id);
    if (index > -1) mockLessons.splice(index, 1);
  }
} : {
  // Real API implementations
  // Get paginated lessons
  getLessons: async (page: number, size: number = 10): Promise<PageResponse<LessonResponse>> => {
    const response = await axiosInstance.get(LESSONS_ENDPOINT, {
      params: { page, size }
    });
    return response.data;
  },

  // Get all lessons
  getAllLessons: async (): Promise<LessonResponse[]> => {
    const response = await axiosInstance.get(`${LESSONS_ENDPOINT}/all`);
    return response.data;
  },

  // Create new lesson
  createLesson: async (lesson: LessonRequest): Promise<LessonResponse> => {
    const response = await axiosInstance.post(LESSONS_ENDPOINT, lesson);
    return response.data;
  },

  // Update lesson
  updateLesson: async (lesson: LessonUpdateRequest): Promise<LessonResponse> => {
    const response = await axiosInstance.put(LESSONS_ENDPOINT, lesson);
    return response.data;
  },

  // Delete lesson
  deleteLesson: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${LESSONS_ENDPOINT}/${id}`);
  }
};

// Helper function to format rooms display
export const formatRooms = (rooms: LessonResponse['rooms']): string => {
  return rooms
    .map(room => `${room.name} (${room.type})`)
    .join(', ');
};