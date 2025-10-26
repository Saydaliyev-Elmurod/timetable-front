import API, { PaginatedResponse } from './api';
import { mockSubjectApi } from '../components/api/mockApi';
import { TimeSlot } from './teachers';

export interface SubjectRequest {
  name: string;
  shortName: string;
  availabilities: TimeSlot[];
  emoji?: string;
  color?: string;
  weight?: number;
}

export interface SubjectResponse {
  id: number;
  name: string;
  shortName: string;
  availabilities: TimeSlot[];
  emoji?: string;
  color?: string;
  weight?: number;
}

export const SubjectService = {
  getAll: async (): Promise<SubjectResponse[]> => {
    if (API.config.USE_MOCK) return mockSubjectApi.getAll();
    
    const response = await API.call<SubjectResponse[]>(
      `${API.url('SUBJECTS')}/all`
    );
    if (response.error) throw response.error;
    return response.data!;
  },

  getPaginated: async (page: number, size: number): Promise<PaginatedResponse<SubjectResponse>> => {
    if (API.config.USE_MOCK) return mockSubjectApi.getPaginated(page, size);
    
    const response = await API.call<PaginatedResponse<SubjectResponse>>(
      `${API.url('SUBJECTS')}?page=${page}&size=${size}`
    );
    if (response.error) throw response.error;
    return response.data!;
  },

  getById: async (id: number): Promise<SubjectResponse> => {
    if (API.config.USE_MOCK) return mockSubjectApi.getById(id);
    
    const response = await API.call<SubjectResponse>(
      `${API.url('SUBJECTS')}/${id}`
    );
    if (response.error) throw response.error;
    return response.data!;
  },

  create: async (data: SubjectRequest): Promise<void> => {
    if (API.config.USE_MOCK) return mockSubjectApi.create(data);
    
    const response = await API.call(
      API.url('SUBJECTS'),
      {
        method: 'POST',
        body: JSON.stringify(data)
      }
    );
    if (response.error) throw response.error;
  },

  update: async (id: number, data: SubjectRequest): Promise<void> => {
    if (API.config.USE_MOCK) return mockSubjectApi.update(id, data);
    
    const response = await API.call(
      `${API.url('SUBJECTS')}/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data)
      }
    );
    if (response.error) throw response.error;
  },

  delete: async (id: number): Promise<void> => {
    if (API.config.USE_MOCK) return mockSubjectApi.delete(id);
    
    const response = await API.call(
      `${API.url('SUBJECTS')}/${id}`,
      { method: 'DELETE' }
    );
    if (response.error) throw response.error;
  }
};