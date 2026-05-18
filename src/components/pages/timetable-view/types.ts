// API Types based on backend entities

export interface TimeSlot {
  dayOfWeek: string;
  lessons: number[];
}

export interface TeacherResponse {
  id: number;
  fullName: string;
  shortName: string;
  availabilities: TimeSlot[];
  createdDate: string;
  updatedDate: string;
}

export interface SubjectResponse {
  id: number;
  shortName: string;
  name: string;
  availabilities: TimeSlot[];
}

export interface RoomResponse {
  id: number;
  name: string;
}

export interface ClassResponse {
  id: number;
  shortName: string;
  name: string;
  availabilities: TimeSlot[];
  teacher: TeacherResponse;
  rooms: RoomResponse[];
  updatedDate: string;
  createdDate: string;
}

export interface TimetableGroupDetail {
  lessonId: number;
  subjectId: number;
  teacherId: number;
  roomId: number;
  groupId: number | null;
  originalLessonData: any;
}

// Unscheduled data from API (contains IDs)
export interface UnscheduledLessonData {
  classId: number;
  teacherId: number;
  subjectId: number;
  roomIds: number[];
  requiredCount: number;
  scheduledCount: number;
  missingCount: number;
}

// Timetable metadata for score/quality display
export interface TimetableMeta {
  id: string;
  name: string;
  scheduled: number | null;
  unscheduled: number | null;
  score: number | null;
  teacherGaps: number | null;
  classGaps: number | null;
  createdDate: string;
  updatedDate: string;
}

// Full API Response structure
export interface TimetableAPIResponse {
  timetableData: TimetableDataEntity[];
  classes: ClassResponse[];
  teachers: TeacherResponse[];
  subjects: SubjectResponse[];
  rooms: RoomResponse[];
  groups: GroupResponse[];
}

export interface TimetableDataEntity {
  id: string;
  timetableId: string;
  isScheduled: boolean;
  classId: number;
  dayOfWeek: string;
  hour: number;
  weekIndex: number | null;
  slotDetails: TimetableGroupDetail[];
  unscheduledData: UnscheduledLessonData | null;
  version: number;
}

export interface GroupResponse {
  id: number;
  name: string;
}

// Internal Lesson format (for DnD and display)
export interface Lesson {
  id: string;
  subject: string;
  subjectId: number;
  teacher: string;
  teacherId: number;
  teacherShort: string;
  room: string;
  roomId: number;
  class: string;
  classId: number;
  day?: string;
  timeSlot?: number;
  isLocked?: boolean;
  groupName?: string;
  groupId?: number;
  weekIndex?: number | null;
  isBiWeekly?: boolean;
  rawDetails?: TimetableGroupDetail;
}

export interface UnplacedLesson extends Lesson {
  reason: string;
  requiredCount?: number;
  scheduledCount?: number;
  missingCount?: number;
}

export interface DisplayOptions {
  showTeacher: boolean;
  showRoom: boolean;
  showSubject: boolean;
}
