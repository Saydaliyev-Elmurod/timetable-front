export type ScheduleSlot = number | 'FREE' | 'TIME-OFF';

export interface Schedule {
  [day: string]: {
    [hour: number]: ScheduleSlot;
  };
}

export interface Teacher {
  id: number;
  name: string;
  schedule: Schedule;
  subjects: string[];
  timePreferences?: {
    preferredDays?: string[];
    preferredHours?: number[];
  };
}

export interface Class {
  id: number;
  name: string;
  schedule: Schedule;
  grade: number;
  section: string;
}

export interface Room {
  id: number;
  name: string;
  schedule: Schedule;
  capacity: number;
  facilities: string[];
}

export interface TimetableState {
  teachers: { [id: number]: Teacher };
  classes: { [id: number]: Class };
  rooms: { [id: number]: Room };
  unplacedLessons: Lesson[];
}

export interface Lesson {
  id: number;
  teacherId: number;
  classId: number;
  roomId?: number;
  subject: string;
  day?: string;
  hour?: number;
  duration: number;
}

export interface MoveValidationResult {
  isValid: boolean;
  reason: string | null;
  softConstraints?: {
    gaps: number;
    balanceScore: number;
    preferenceScore: number;
  };
}

export interface Position {
  day: string;
  hour: number;
  roomId?: number;
}