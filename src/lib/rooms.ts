import API, { PaginatedResponse } from './api';
import { mockRoomApi } from '../components/api/mockApi';
import { TimeSlot } from './teachers';

// Room Type Enum
export enum RoomType {
  SHARED = 'SHARED',
  SPECIAL = 'SPECIAL'
}

// Enum definitions and descriptions
export const ROOM_TYPE_DEFINITIONS: Record<RoomType, { labelKey: string; descriptionKey: string }> = {
  [RoomType.SHARED]: {
    labelKey: 'rooms.type.shared.label',
    descriptionKey: 'rooms.type.shared.description'
  },
  [RoomType.SPECIAL]: {
    labelKey: 'rooms.type.special.label',
    descriptionKey: 'rooms.type.special.description'
  }
};

export interface RoomRequest {
  name: string;
  shortName: string;
  type: RoomType;
  availabilities: TimeSlot[];
  allowedSubjectIds?: number[]; // For SPECIAL rooms only
}

export interface RoomResponse {
  id: number;
  name: string;
  shortName: string;
  type: RoomType;
  availabilities: TimeSlot[];
  allowedSubjectIds?: number[];
}

export const RoomService = {
  getAll: async (): Promise<RoomResponse[]> => {
    if (API.config.USE_MOCK) return mockRoomApi.getAll();
    
    const response = await API.call<RoomResponse[]>(
      `${API.url('ROOMS')}/all`
    );
    if (response.error) throw response.error;
    return response.data!;
  },

  getPaginated: async (page: number, size: number): Promise<PaginatedResponse<RoomResponse>> => {
    if (API.config.USE_MOCK) return mockRoomApi.getPaginated(page, size);
    
    const response = await API.call<PaginatedResponse<RoomResponse>>(
      `${API.url('ROOMS')}?page=${page}&size=${size}`
    );
    if (response.error) throw response.error;
    return response.data!;
  },

  getById: async (id: number): Promise<RoomResponse> => {
    if (API.config.USE_MOCK) return mockRoomApi.getById(id);
    
    const response = await API.call<RoomResponse>(
      `${API.url('ROOMS')}/${id}`
    );
    if (response.error) throw response.error;
    return response.data!;
  },

  create: async (data: RoomRequest): Promise<void> => {
    if (API.config.USE_MOCK) return mockRoomApi.create(data);
    
    const response = await API.call(
      API.url('ROOMS'),
      {
        method: 'POST',
        body: JSON.stringify(data)
      }
    );
    if (response.error) throw response.error;
  },

  update: async (id: number, data: RoomRequest): Promise<void> => {
    if (API.config.USE_MOCK) return mockRoomApi.update(id, data);
    
    const response = await API.call(
      `${API.url('ROOMS')}/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data)
      }
    );
    if (response.error) throw response.error;
  },

  delete: async (id: number): Promise<void> => {
    if (API.config.USE_MOCK) return mockRoomApi.delete(id);
    
    const response = await API.call(
      `${API.url('ROOMS')}/${id}`,
      { method: 'DELETE' }
    );
    if (response.error) throw response.error;
  }
};