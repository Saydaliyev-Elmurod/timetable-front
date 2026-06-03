import { PaginatedResponse, createCrudService, buildQuery } from './api';


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
const base = createCrudService<TeacherResponse, TeacherRequest, TeacherUpdateRequest>('TEACHERS');

export const TeacherService = {
  getAll: base.getAll,
  getById: base.getById,
  create: base.create,
  update: base.update,
  delete: base.delete,
  bulkDelete: base.bulkDelete,
  bulkAdd: base.bulkCreate,

  getPaginated: (page: number, size: number, query?: string): Promise<PaginatedResponse<TeacherResponse>> =>
    base.get<PaginatedResponse<TeacherResponse>>(
      buildQuery(base.endpoint(), { page, size, query }),
    ),

  bulkUpdate: (data: TeacherBulkUpdateRequest): Promise<void> => base.bulkUpdate(data),

  getTemplates: (): Promise<TeacherResponse[]> =>
    base.get<TeacherResponse[]>(`${base.endpoint()}/templates`),
};