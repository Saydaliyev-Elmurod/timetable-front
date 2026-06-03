import { PaginatedResponse, createCrudService } from './api';
import { TimeSlot } from './teachers';
import type { RoomResponse } from '@/types/api';

export interface ClassResponse {
  id: number;
  name: string;
  shortName: string;
  availabilities?: TimeSlot[];
  teacher?: {
    id: number;
    fullName: string;
  };
  groups?: Array<{
    id: number;
    name: string;
  }>;
  rooms?: RoomResponse[];
  createdDate?: string;
  updatedDate?: string;
}

export interface ClassRequest {
  name: string;
  shortName: string;
  teacherId?: number | null;
  availabilities: TimeSlot[];
}

export interface ClassBulkTimeoffRequest {
  applyTo: number[];
  timeOff: TimeSlot[];
}

const base = createCrudService<ClassResponse, ClassRequest>('CLASSES');

export const ClassService = {
  getAll: base.getAll,
  getById: base.getById,
  create: base.create,
  update: base.update,
  delete: base.delete,

  getPaginated: (page: number, size: number): Promise<PaginatedResponse<ClassResponse>> =>
    base.get<PaginatedResponse<ClassResponse>>(`${base.endpoint()}?page=${page}&size=${size}`),

  createBulk: base.bulkCreate,
  deleteBulk: base.bulkDelete,

  bulkTimeoff: (data: ClassBulkTimeoffRequest): Promise<void> =>
    base.send(`${base.endpoint()}/timeoff`, 'POST', data),
};
