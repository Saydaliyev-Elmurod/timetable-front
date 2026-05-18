import API, { PaginatedResponse } from './api';
import { TimeSlot } from './teachers';

export interface SubjectRequest {
  name: string;
  nameUz?: string;
  nameRu?: string;
  nameEn?: string;
  shortName: string;
  availabilities: TimeSlot[];
  color?: string;
  weight?: number;
  category?: string;
}

export interface SubjectResponse {
  id: number;
  name: string;
  nameUz?: string;
  nameRu?: string;
  nameEn?: string;
  shortName: string;
  availabilities: TimeSlot[];
  color?: string;
  weight?: number;
  category?: string;
}

export interface SubjectBulkUpdateRequest {
  ids: number[];
  weight?: number;
  availabilities?: TimeSlot[];
}

export const SubjectService = {
  getAll: async (): Promise<SubjectResponse[]> => {
    const response = await API.call<SubjectResponse[]>(
      `${API.url('SUBJECTS')}/all`
    );
    if (response.error) throw response.error;
    return response.data!;
  },

  getTemplates: async (): Promise<SubjectResponse[]> => {
    const response = await API.call<SubjectResponse[]>(
      `${API.url('SUBJECTS')}/templates`
    );
    if (response.error) throw response.error;
    return response.data!;
  },

  getPaginated: async (page: number, size: number, query?: string, category?: string, sort?: string): Promise<PaginatedResponse<SubjectResponse>> => {
    let url = `${API.url('SUBJECTS')}?page=${page}&size=${size}`;
    if (query) url += `&query=${encodeURIComponent(query)}`;
    if (category && category !== 'ALL' && category !== 'all') url += `&category=${category}`;
    if (sort) url += `&sort=${sort}`;
    
    const response = await API.call<PaginatedResponse<SubjectResponse>>(url);
    if (response.error) throw response.error;
    return response.data!;
  },

  getById: async (id: number): Promise<SubjectResponse> => {
    const response = await API.call<SubjectResponse>(
      `${API.url('SUBJECTS')}/${id}`
    );
    if (response.error) throw response.error;
    return response.data!;
  },

  create: async (data: SubjectRequest): Promise<void> => {
    const response = await API.call(
      API.url('SUBJECTS'),
      {
        method: 'POST',
        body: JSON.stringify(data)
      }
    );
    if (response.error) throw response.error;
  },

  bulkCreate: async (data: SubjectRequest[]): Promise<void> => {
    const response = await API.call(
      `${API.url('SUBJECTS')}/bulk`,
      {
        method: 'POST',
        body: JSON.stringify(data)
      }
    );
    if (response.error) throw response.error;
  },

  update: async (id: number, data: SubjectRequest): Promise<void> => {
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
    const response = await API.call(
      `${API.url('SUBJECTS')}/${id}`,
      { method: 'DELETE' }
    );
    if (response.error) throw response.error;
  },

  bulkDelete: async (ids: number[]): Promise<void> => {
    const response = await API.call(
      `${API.url('SUBJECTS')}/bulk`,
      {
        method: 'DELETE',
        body: JSON.stringify(ids)
      }
    );
    if (response.error) throw response.error;
  },

  bulkUpdate: async (data: SubjectBulkUpdateRequest): Promise<void> => {
    const response = await API.call(
      `${API.url('SUBJECTS')}/bulk`,
      {
        method: 'PUT',
        body: JSON.stringify(data)
      }
    );
    if (response.error) throw response.error;
  }
};