import { PaginatedResponse, createCrudService, buildQuery } from './api';
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

const base = createCrudService<SubjectResponse, SubjectRequest>('SUBJECTS');

export const SubjectService = {
  getAll: base.getAll,
  getById: base.getById,
  create: base.create,
  update: base.update,
  delete: base.delete,
  bulkCreate: base.bulkCreate,
  bulkDelete: base.bulkDelete,

  getTemplates: (): Promise<SubjectResponse[]> =>
    base.get<SubjectResponse[]>(`${base.endpoint()}/templates`),

  getPaginated: (
    page: number,
    size: number,
    query?: string,
    category?: string,
    sort?: string,
  ): Promise<PaginatedResponse<SubjectResponse>> =>
    base.get<PaginatedResponse<SubjectResponse>>(
      buildQuery(base.endpoint(), {
        page,
        size,
        query,
        category: category && category !== 'ALL' && category !== 'all' ? category : undefined,
        sort,
      }),
    ),

  bulkUpdate: (data: SubjectBulkUpdateRequest): Promise<void> => base.bulkUpdate(data),
};