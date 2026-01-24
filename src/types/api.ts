// API Response Types
export interface ClassResponse {
  id: number;
  shortName: string;
  name: string;
  availabilities: TimeSlot[];
  teacher: TeacherResponse;
  rooms: RoomResponse[];
  groups: GroupResponse[];
  updatedDate: string;
  createdDate: string;
}

export interface GroupResponse {
  id: number;
  name: string;
}

export interface TeacherResponse {
  id: number;
  fullName: string;
}

export interface RoomResponse {
  id: number;
  name: string;
  type: 'SPECIAL' | 'SHARED';
}

export interface SubjectResponse {
  id: number;
  name: string;
}

export interface GroupLessonDetailResponse {
  group: GroupResponse;
  teacher: TeacherResponse;
  subject: SubjectResponse;
  rooms: RoomResponse[];
}

export interface LessonResponse {
  id: number;
  class: ClassResponse;
  teacher: TeacherResponse;
  rooms: RoomResponse[];
  subject: SubjectResponse;
  group?: GroupResponse;
  groupDetails?: GroupLessonDetailResponse[];
  lessonCount: number;
  dayOfWeek: string;
  hour: number;
  period: number;
  frequency?: 'WEEKLY' | 'BI_WEEKLY' | 'TRI_WEEKLY';
  createdDate: string;
  updatedDate: string;
}

// API Request Types
export interface ClassRequest {
  name: string;
  shortName: string;
  availabilities: TimeSlot[];
  teacherId: number | null;
  rooms: number[]; // Set<Integer> as array
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
  frequency?: 'WEEKLY' | 'BI_WEEKLY' | 'TRI_WEEKLY';
  period: number;
  groups?: GroupLessonDetail[];
}

export interface LessonUpdateRequest extends LessonRequest {
  id: number;
}

// TimeSlot type (assuming it's defined elsewhere, but adding here for completeness)
export interface TimeSlot {
  dayOfWeek: string;
  lessons: number[];
}

// API Response with Pagination
export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}