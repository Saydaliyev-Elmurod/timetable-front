import API, { PaginatedResponse } from './api';
import { SubjectResponse } from './subjects';
import { TeacherResponse } from './teachers';

export interface RoomResponse {
  id: number;
  name: string;
  shortName: string;
  capacity: number;
}

export interface ClassResponse {
  id: number;
  name: string;
  grade: number;
  section: string;
}

export interface LessonRequest {
  classId: number;
  teacherId: number;
  roomIds: number[];
  subjectId: number;
  lessonCount: number;
  dayOfWeek: string;
  hour: number;
  period: number;
}

export interface LessonUpdateRequest {
  id: number;
  orgId: number;
  classId: number;
  teacherId: number;
  roomIds: number[];
  subjectId: number;
  lessonCount: number;
  dayOfWeek: string;
  hour: number;
  period: number;
}

export interface LessonResponse {
  id: number;
  classInfo: ClassResponse;
  teacher: TeacherResponse;
  rooms: RoomResponse[];
  subject: SubjectResponse;
  lessonCount: number;
  dayOfWeek: string;
  hour: number;
  period: number;
  createdDate: string;
  updatedDate: string;
}

export const LessonService = {
  getAll: async (): Promise<LessonResponse[]> => {
    const response = await API.call<LessonResponse[]>(
      `${API.url('LESSONS')}/all`
    );
    if (response.error) throw response.error;
    return response.data!;
  },

  getPaginated: async (page: number, size: number): Promise<PaginatedResponse<LessonResponse>> => {
    const response = await API.call<PaginatedResponse<LessonResponse>>(
      `${API.url('LESSONS')}?page=${page}&size=${size}`
    );
    if (response.error) throw response.error;
    return response.data!;
  },

  getById: async (id: number): Promise<LessonResponse> => {
    const response = await API.call<LessonResponse>(
      `${API.url('LESSONS')}/${id}`
    );
    if (response.error) throw response.error;
    return response.data!;
  },

  create: async (data: LessonRequest): Promise<void> => {
    const response = await API.call(
      API.url('LESSONS'),
      {
        method: 'POST',
        body: JSON.stringify(data)
      }
    );
    if (response.error) throw response.error;
  },

  update: async (id: number, data: LessonUpdateRequest): Promise<void> => {
    const response = await API.call(
      `${API.url('LESSONS')}/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data)
      }
    );
    if (response.error) throw response.error;
  },

  delete: async (id: number): Promise<void> => {
    const response = await API.call(
      `${API.url('LESSONS')}/${id}`,
      { method: 'DELETE' }
    );
    if (response.error) throw response.error;
  }
};