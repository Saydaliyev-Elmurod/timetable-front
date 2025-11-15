// API Response Types
export interface ClassResponse {
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

export interface LessonResponse {
  id: number;
  class: ClassResponse;
  teacher: TeacherResponse;
  rooms: RoomResponse[];
  subject: SubjectResponse;
  lessonCount: number;
  dayOfWeek: string;
  hour: number;
  period: number;
  createdDate: string;
  updatedDate: string;
}

// API Request Types
export interface LessonRequest {
  classId: number;
  teacherId: number;
  roomIds: number[];
  subjectId: number;
  lessonCount: number;
  dayOfWeek: string;
  hour: number;
  period: number;
}

export interface LessonUpdateRequest extends LessonRequest {
  id: number;
}

// API Response with Pagination
export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}