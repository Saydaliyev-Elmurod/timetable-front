import API, { PaginatedResponse } from './api';


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

export interface TeacherBulkUpdateRequest {
  ids: number[];
  availabilities: TimeSlot[];
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


    const response = await API.call<TeacherResponse[]>(
      `${API.url('TEACHERS')}/all`
    );
    if (response.error) throw response.error;
    return response.data!;
  },

  getPaginated: async (page: number, size: number, query?: string): Promise<PaginatedResponse<TeacherResponse>> => {
    let url = `${API.url('TEACHERS')}?page=${page}&size=${size}`;
    if (query) url += `&query=${encodeURIComponent(query)}`;
    
    const response = await API.call<PaginatedResponse<TeacherResponse>>(url);
    if (response.error) throw response.error;
    return response.data!;
  },

  getById: async (id: number): Promise<TeacherResponse> => {


    const response = await API.call<TeacherResponse>(
      `${API.url('TEACHERS')}/${id}`
    );
    if (response.error) throw response.error;
    return response.data!;
  },

  create: async (data: TeacherRequest): Promise<void> => {


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


    const response = await API.call(
      `${API.url('TEACHERS')}/${id}`,
      { method: 'DELETE' }
    );
    if (response.error) throw response.error;
  },

  bulkDelete: async (ids: number[]): Promise<void> => {
    const response = await API.call(
      `${API.url('TEACHERS')}/bulk`,
      {
        method: 'DELETE',
        body: JSON.stringify(ids)
      }
    );
    if (response.error) throw response.error;
  },

  bulkUpdate: async (data: TeacherBulkUpdateRequest): Promise<void> => {
    const response = await API.call(
      `${API.url('TEACHERS')}/bulk`,
      {
        method: 'PUT',
        body: JSON.stringify(data)
      }
    );
    if (response.error) throw response.error;
  },

  bulkAdd: async (data: TeacherRequest[]): Promise<void> => {
    const response = await API.call(
      `${API.url('TEACHERS')}/bulk`,
      {
        method: 'POST',
        body: JSON.stringify(data)
      }
    );
    if (response.error) throw response.error;
  },

  getTemplates: async (): Promise<TeacherResponse[]> => {
    const response = await API.call(`${API.url('TEACHERS')}/templates`);
    if (response.error) throw response.error;
    return response.data;
  }
};