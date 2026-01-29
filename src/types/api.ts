// API Response Types - Unified type definitions for frontend
// Backend sends full objects for single fetch, IDs for batch fetch

// ========================
// CORE ENTITY TYPES
// ========================

export interface ClassResponse {
  id: number;
  shortName: string;
  name: string;
  availabilities?: TimeSlot[];
  teacher?: TeacherResponse;
  rooms?: RoomResponse[];
  groups?: GroupResponse[];
  updatedDate?: string;
  createdDate?: string;
}

export interface GroupResponse {
  id: number;
  name: string;
}

export interface TeacherResponse {
  id: number;
  fullName: string;
  shortName?: string;
  availabilities?: TimeSlot[];
  subjects?: SubjectResponse[];
}

export interface RoomResponse {
  id: number;
  name: string;
  shortName?: string;
  type: 'SPECIAL' | 'SHARED';
}

export interface SubjectResponse {
  id: number;
  name: string;
  shortName?: string;
}

// ========================
// LESSON TYPES
// ========================

/**
 * Lesson response with full entity objects (used in single fetch)
 */
export interface LessonResponseFull {
  id: number;
  class: ClassResponse;
  teacher: TeacherResponse;
  rooms: RoomResponse[];
  subject: SubjectResponse;
  group?: GroupResponse;
  groupDetails?: GroupLessonDetailResponse[];
  lessonCount: number;
  dayOfWeek?: string;
  hour?: number;
  period: number;
  frequency?: LessonFrequency;
  createdDate: string;
  updatedDate: string;
}

/**
 * Lesson response with IDs only (used in batch fetch with metadata)
 */
export interface LessonResponseCompact {
  id: number;
  classId: number;
  teacherId: number;
  roomIds: number[];
  subjectId: number;
  groupId?: number;
  groupDetails?: GroupLessonDetailCompact[];
  lessonCount: number;
  dayOfWeek?: string;
  hour?: number;
  period: number;
  frequency?: LessonFrequency;
  createdDate: string;
  updatedDate: string;
}

export interface GroupLessonDetailResponse {
  group: GroupResponse;
  teacher: TeacherResponse;
  subject: SubjectResponse;
  rooms: RoomResponse[];
}

export interface GroupLessonDetailCompact {
  groupId: number;
  teacherId: number;
  subjectId: number;
  roomIds: number[];
}

/**
 * Unified lesson type - can handle both full and compact formats
 */
export type LessonResponse = LessonResponseFull | LessonResponseCompact;

// Type guard to check if lesson has full objects or IDs
export function isCompactLesson(lesson: LessonResponse): lesson is LessonResponseCompact {
  return 'classId' in lesson;
}

export function isFullLesson(lesson: LessonResponse): lesson is LessonResponseFull {
  return 'class' in lesson && typeof (lesson as any).class === 'object';
}

// ========================
// REQUEST TYPES
// ========================

export type LessonFrequency = 'WEEKLY' | 'BI_WEEKLY' | 'TRI_WEEKLY';

export interface ClassRequest {
  name: string;
  shortName: string;
  availabilities: TimeSlot[];
  teacherId: number | null;
  rooms: number[];
  groups: GroupRequest[];
}

export interface GroupRequest {
  name: string;
}

export interface ClassUpdateRequest {
  name: string;
  shortName: string;
  availabilities: TimeSlot[];
  teacherId: number | null;
  rooms: number[];
  deletedRooms: number[];
  newGroups: GroupRequest[];
  updatedGroups: GroupUpdateRequest[];
  deletedGroupIds: number[];
}

export interface GroupUpdateRequest {
  id: number;
  name: string;
}

export interface GroupLessonDetail {
  groupId: number;
  teacherId: number;
  subjectId: number;
  roomIds: number[];
}

export interface LessonRequest {
  classId: number[];
  teacherId: number;
  roomIds: number[];
  subjectId: number;
  lessonCount: number;
  dayOfWeek?: string;
  hour?: number;
  frequency?: LessonFrequency;
  period: number;
  groups?: GroupLessonDetail[];
}

export interface LessonUpdateRequest extends LessonRequest {
  id: number;
}

// ========================
// COMMON TYPES
// ========================

export interface TimeSlot {
  dayOfWeek: string;
  lessons: number[];
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

/**
 * Optimized response for batch fetching lessons with metadata
 * Each entity appears only once, lessons reference them by ID
 */
export interface LessonsWithMetadataResponse {
  lessons: LessonResponseCompact[];
  classes: ClassResponse[];
  teachers: TeacherResponse[];
  rooms: RoomResponse[];
  subjects: SubjectResponse[];
}

/**
 * Helper to create lookup maps from metadata response
 */
export function createLookupMaps(metadata: LessonsWithMetadataResponse) {
  return {
    classesById: new Map(metadata.classes.map(c => [c.id, c])),
    teachersById: new Map(metadata.teachers.map(t => [t.id, t])),
    subjectsById: new Map(metadata.subjects.map(s => [s.id, s])),
    roomsById: new Map(metadata.rooms.map(r => [r.id, r])),
  };
}

/**
 * Convert compact lesson to full lesson using lookup maps
 */
export function expandCompactLesson(
  lesson: LessonResponseCompact,
  lookups: ReturnType<typeof createLookupMaps>
): LessonResponseFull {
  const classEntity = lookups.classesById.get(lesson.classId);
  const teacherEntity = lookups.teachersById.get(lesson.teacherId);
  const subjectEntity = lookups.subjectsById.get(lesson.subjectId);
  const roomEntities = lesson.roomIds
    .map(id => lookups.roomsById.get(id))
    .filter((r): r is RoomResponse => r !== undefined);

  return {
    id: lesson.id,
    class: classEntity || { id: lesson.classId, shortName: 'Unknown', name: 'Unknown' },
    teacher: teacherEntity || { id: lesson.teacherId, fullName: 'Unknown' },
    subject: subjectEntity || { id: lesson.subjectId, name: 'Unknown' },
    rooms: roomEntities,
    group: lesson.groupId ? { id: lesson.groupId, name: 'Unknown' } : undefined,
    lessonCount: lesson.lessonCount,
    dayOfWeek: lesson.dayOfWeek,
    hour: lesson.hour,
    period: lesson.period,
    frequency: lesson.frequency,
    createdDate: lesson.createdDate,
    updatedDate: lesson.updatedDate,
  };
}