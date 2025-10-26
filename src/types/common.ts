import { InternalLesson } from './lessons';

export interface GroupedData {
  id: string;
  name: string;
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
  multiClass: boolean;
  selectedClasses: string[];
  selectedTeachers: string[];
  subject: string;
  formats: {
    timesPerWeek: number;
    duration: number;
  }[];
}