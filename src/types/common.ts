import { InternalLesson } from './lessons';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface GroupedData {
  id: string;
  name:string;
  lessons: InternalLesson[];
  totalLessons: number;
  totalPeriods: number;
  teachers?: number;
  subjects?: number;
  classes?: number;
}

export interface ConflictDetail {
  type: 'teacher' | 'class' | 'room';
  message: string;
}

export type ViewType = 'classes' | 'teachers' | 'subjects' | 'rooms';

export interface LessonSubmitData {
  subject: string;
  selectedClasses: string[];
  selectedTeacher: string;
  lessonsPerWeek: number;
  lessonSequence: string;
  scheduleType: string;
  enableFixedPlacement: boolean;
  formats: {
    timesPerWeek: number;
    duration: string;
  }[];
}