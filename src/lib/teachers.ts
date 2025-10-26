import API, { PaginatedResponse } from './api';
import { mockTeacherApi } from '../components/api/mockApi';

// Types
export interface TimeSlot {
  dayOfWeek: string;
  lessons: number[];
}

export interface TeacherRequest {
  fullName: string;
  shortName: string;
  subjects: number[];
  availabilities: TimeSlot[];
}

export interface TeacherUpdateRequest extends TeacherRequest {
  deletedSubjects: number[];
}

export interface TeacherResponse {
  id: number;
  fullName: string;
  shortName: string;
  subjects: SubjectResponse[];
  availabilities: TimeSlot[];
  createdDate: string;
  updatedDate: string;
}

export interface SubjectResponse {
  id: number;
  shortName: string;
  name: string;
  availabilities: TimeSlot[];
  emoji?: string;
  color?: string;
  weight?: number;
}

// Service
export const TeacherService = {
  getAll: async (): Promise<TeacherResponse[]> => {
    if (API.config.USE_MOCK) return mockTeacherApi.getAll();
    
    const response = await API.call<TeacherResponse[]>(
      `${API.url('TEACHERS')}/all`
    );
    if (response.error) throw response.error;
    return response.data!;
  },

  getPaginated: async (page: number, size: number): Promise<PaginatedResponse<TeacherResponse>> => {
    if (API.config.USE_MOCK) return mockTeacherApi.getPaginated(page, size);
    
    const response = await API.call<PaginatedResponse<TeacherResponse>>(
      `${API.url('TEACHERS')}?page=${page}&size=${size}`
    );
    if (response.error) throw response.error;
    return response.data!;
  },

  getById: async (id: number): Promise<TeacherResponse> => {
    if (API.config.USE_MOCK) return mockTeacherApi.getById(id);
    
    const response = await API.call<TeacherResponse>(
      `${API.url('TEACHERS')}/${id}`
    );
    if (response.error) throw response.error;
    return response.data!;
  },

  create: async (data: TeacherRequest): Promise<void> => {
    if (API.config.USE_MOCK) return mockTeacherApi.create(data);
    
    const response = await API.call(
      API.url('TEACHERS'),
      {
        method: 'POST',
        body: JSON.stringify(data)
      }
    );
    if (response.error) throw response.error;
  },

  update: async (id: number, data: TeacherUpdateRequest): Promise<void> => {
    if (API.config.USE_MOCK) return mockTeacherApi.update(id, data);
    
    const response = await API.call(
      `${API.url('TEACHERS')}/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data)
      }
    );
    if (response.error) throw response.error;
  },

  delete: async (id: number): Promise<void> => {
    if (API.config.USE_MOCK) return mockTeacherApi.delete(id);
    
    const response = await API.call(
      `${API.url('TEACHERS')}/${id}`,
      { method: 'DELETE' }
    );
    if (response.error) throw response.error;
  }
};