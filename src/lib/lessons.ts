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
  frequency?: 'WEEKLY' | 'BI_WEEKLY' | 'TRI_WEEKLY';
}

export interface LessonResponse {
  id: number;
  classId: number;
  teacherId: number;
  roomIds: number[];
  subjectId: number;
  groupId?: number;
  groupDetails?: GroupLessonDetailResponse[];
  lessonCount: number;
  dayOfWeek: DayOfWeek;
  hour: number;
  period: number;
  frequency?: 'WEEKLY' | 'BI_WEEKLY' | 'TRI_WEEKLY';
  createdDate: string;
  updatedDate: string;
}

export interface GroupLessonDetailResponse {
  groupId: number;
  teacherId?: number;
  subjectId?: number;
  roomIds: number[];
}

export interface LessonsWithMetadataResponse {
  lessons: LessonResponse[];
  classes: ClassResponse[];
  teachers: TeacherResponse[];
  rooms: RoomResponse[];
  subjects: SubjectResponse[];
}

export interface PagedLessonResponse {
  content: LessonResponse[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export const LessonService = {
  /**
   * Get all lessons with metadata (classes, teachers, rooms, subjects).
   * This is the optimized endpoint that reduces JSON size by avoiding duplicate data.
   */
  getAllWithMetadata: async (): Promise<LessonsWithMetadataResponse> => {
    const response = await API.call<any>(
      `${API.url('LESSONS')}/all`
    );
    if (response.error) throw response.error;

    const data = response.data;
    if (!data) {
      return { lessons: [], classes: [], teachers: [], rooms: [], subjects: [] };
    }

    // Handle new response format with metadata
    if (data.lessons && Array.isArray(data.lessons)) {
      return data as LessonsWithMetadataResponse;
    }

    // Fallback for legacy format (array of lessons)
    if (Array.isArray(data)) {
      return { lessons: data, classes: [], teachers: [], rooms: [], subjects: [] };
    }

    return { lessons: [], classes: [], teachers: [], rooms: [], subjects: [] };
  },

  /**
   * @deprecated Use getAllWithMetadata instead for optimized response
   */
  getAll: async (): Promise<LessonResponse[]> => {
    const metadata = await LessonService.getAllWithMetadata();
    return metadata.lessons;
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