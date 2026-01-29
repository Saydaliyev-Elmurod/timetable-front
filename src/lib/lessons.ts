import API, { PaginatedResponse } from './api';
import {
  LessonResponseCompact,
  LessonResponseFull,
  LessonsWithMetadataResponse,
  LessonRequest,
  createLookupMaps,
  expandCompactLesson
} from '@/types/api';
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

// Re-export types for backward compatibility
export type {
  LessonResponseCompact,
  LessonResponseFull,
  LessonsWithMetadataResponse,
  LessonRequest,
};

// Legacy type alias (prefer using specific types)
export type LessonResponse = LessonResponseCompact;

export interface RoomResponse {
  id: number;
  name: string;
  shortName?: string;
  type?: string;
}

export interface ClassResponse {
  id: number;
  name: string;
  shortName: string;
}

export interface GroupLessonDetailResponse {
  groupId: number;
  teacherId?: number;
  subjectId?: number;
  roomIds: number[];
}

export interface PagedLessonResponse {
  content: LessonResponseCompact[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

// Abort controller for cleanup
let currentAbortController: AbortController | null = null;

export const LessonService = {
  /**
   * Get all lessons with metadata (classes, teachers, rooms, subjects).
   * This is the optimized endpoint that reduces JSON size by avoiding duplicate data.
   */
  getAllWithMetadata: async (): Promise<LessonsWithMetadataResponse> => {
    // Cancel any previous request
    if (currentAbortController) {
      currentAbortController.abort();
    }
    currentAbortController = new AbortController();

    try {
      const response = await API.call<any>(
        `${API.url('LESSONS')}/all`,
        { signal: currentAbortController.signal }
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
    } finally {
      currentAbortController = null;
    }
  },

  /**
   * Get all lessons as full objects (expanded from compact + metadata)
   * @deprecated Use getAllWithMetadata for better performance
   */
  getAllExpanded: async (): Promise<LessonResponseFull[]> => {
    const metadata = await LessonService.getAllWithMetadata();
    const lookups = createLookupMaps(metadata);
    return metadata.lessons.map(lesson => expandCompactLesson(lesson, lookups));
  },

  /**
   * @deprecated Use getAllWithMetadata instead for optimized response
   */
  getAll: async (): Promise<LessonResponseCompact[]> => {
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

  getById: async (id: number): Promise<LessonResponseFull> => {
    const response = await API.call<LessonResponseFull>(
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
  },

  /**
   * Cancel any ongoing request (for cleanup)
   */
  cancelPendingRequests: () => {
    if (currentAbortController) {
      currentAbortController.abort();
      currentAbortController = null;
    }
  }
};