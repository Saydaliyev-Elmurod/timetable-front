import { PaginatedResponse, createCrudService, buildQuery } from './api';

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
}

export interface RoomResponse {
  id: number;
  name: string;
  shortName: string;
  type: RoomType;
  availabilities: TimeSlot[];
}

const base = createCrudService<RoomResponse, RoomRequest>('ROOMS');

export const RoomService = {
  getAll: base.getAll,
  getById: base.getById,
  create: base.create,
  update: base.update,
  delete: base.delete,
  bulkCreate: base.bulkCreate,
  deleteBulk: base.bulkDelete,

  getPaginated: (
    page: number,
    size: number,
    query?: string,
    sort?: string,
  ): Promise<PaginatedResponse<RoomResponse>> =>
    base.get<PaginatedResponse<RoomResponse>>(
      buildQuery(base.endpoint(), { page, size, query, sort }),
    ),

  bulkUpdate: (data: { ids: number[]; availabilities: TimeSlot[] }): Promise<void> =>
    base.bulkUpdate(data),
};