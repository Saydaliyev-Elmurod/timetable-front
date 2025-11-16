import API, { PaginatedResponse } from './api';
import { TimeSlot } from './teachers';

export interface ClassResponse {
  id: number;
  name: string;
  shortName: string;
  availabilities?: TimeSlot[];
  teacher?: {
    id: number;
    fullName: string;
  };
  createdDate?: string;
  updatedDate?: string;
}

export interface ClassRequest {
  name: string;
  shortName: string;
  teacherId?: number | null;
  availabilities: TimeSlot[];
}

export const ClassService = {
  getAll: async (): Promise<ClassResponse[]> => {
    const response = await API.call<ClassResponse[]>(
      `${API.url('CLASSES')}/all`
    );
    if (response.error) throw response.error;
    return response.data!;
  },

  getPaginated: async (page: number, size: number): Promise<PaginatedResponse<ClassResponse>> => {
    const response = await API.call<PaginatedResponse<ClassResponse>>(
      `${API.url('CLASSES')}?page=${page}&size=${size}`
    );
    if (response.error) throw response.error;
    return response.data!;
  },

  getById: async (id: number): Promise<ClassResponse> => {
    const response = await API.call<ClassResponse>(
      `${API.url('CLASSES')}/${id}`
    );
    if (response.error) throw response.error;
    return response.data!;
  },

  create: async (data: ClassRequest): Promise<void> => {
    const response = await API.call(
      API.url('CLASSES'),
      {
        method: 'POST',
        body: JSON.stringify(data)
      }
    );
    if (response.error) throw response.error;
  },

  update: async (id: number, data: ClassRequest): Promise<void> => {
    const response = await API.call(
      `${API.url('CLASSES')}/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data)
      }
    );
    if (response.error) throw response.error;
  },

  delete: async (id: number): Promise<void> => {
    const response = await API.call(
      `${API.url('CLASSES')}/${id}`,
      { method: 'DELETE' }
    );
    if (response.error) throw response.error;
  }
};
