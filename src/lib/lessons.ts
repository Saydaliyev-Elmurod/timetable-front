import API, { PaginatedResponse } from './api';
import { SubjectResponse } from './subjects';
import { TeacherResponse } from './teachers';

// Day of Week Enum
export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

export interface RoomResponse {
  id: number;
  name: string;
  shortName: string;
  type?: string;
}

export interface ClassResponse {
  id: number;
  name: string;
  shortName: string;
}

export interface LessonRequest {
  classId: number[];
  teacherId: number;
  roomIds: number[];
  subjectId: number;
  lessonCount: number;
  dayOfWeek: DayOfWeek;
  hour: number;
  period: number;
}

export interface LessonResponse {
  id: number;
  class: ClassResponse;
  teacher: TeacherResponse;
  rooms: RoomResponse[];
  subject: SubjectResponse;
  lessonCount: number;
  dayOfWeek: DayOfWeek;
  hour: number;
  period: number;
  createdDate: string;
  updatedDate: string;
}

export interface PagedLessonResponse {
  content: LessonResponse[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export const LessonService = {
  getAll: async (): Promise<LessonResponse[]> => {
    const response = await API.call<any>(
      `${API.url('LESSONS')}/all`
    );
    if (response.error) throw response.error;

    const data = response.data;
    if (!data) return [];

    // Normalize possible shapes:
    // - Array of LessonResponse
    // - Paginated { content: LessonResponse[] }
    // - Wrapped { response: [...] } (if apiCall didn't unwrap for some reason)
    if (Array.isArray(data)) return data as LessonResponse[];
    if (Array.isArray(data.content)) return data.content as LessonResponse[];
    if (Array.isArray(data.response)) return data.response as LessonResponse[];
    if (data.response && Array.isArray(data.response.content)) return data.response.content as LessonResponse[];

    // Last-resort: try to find a content-like field
    const maybeContent = data.content || (data.response && data.response.content);
    if (Array.isArray(maybeContent)) return maybeContent as LessonResponse[];

    return [];
  },

  getPaginated: async (page: number, size: number): Promise<PagedLessonResponse> => {
    const response = await API.call<PagedLessonResponse>(
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

  update: async (id: number, data: LessonRequest): Promise<void> => {
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