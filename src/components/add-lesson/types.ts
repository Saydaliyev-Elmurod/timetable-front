export interface GroupLessonConfig {
  groupId: number;
  groupName: string;
  isSelected: boolean;
  teacherId: number | null;
  teacherName?: string;
  subjectId: number | null;
  subjectName?: string;
  roomIds: number[];
  roomNames?: string[];
}

export type Frequency = 'WEEKLY' | 'BI_WEEKLY' | 'TRI_WEEKLY';

export interface AddLessonFormData {
  subject: string;
  selectedClasses: number[];
  selectedTeacher: string;
  selectedTeacherId: number | null;
  lessonsPerWeek: number;
  lessonSequence: string;
  scheduleType: string;
  enableFixedPlacement: boolean;
  dayOfWeek: string | null;
  hour: number | null;
  roomIds: number[];
  period: number;
  frequency: Frequency;
  formats: { timesPerWeek: number; duration: string }[];
}

export const INITIAL_FORM_DATA: AddLessonFormData = {
  subject: '',
  selectedClasses: [],
  selectedTeacher: '',
  selectedTeacherId: null,
  lessonsPerWeek: 1,
  lessonSequence: 'single',
  scheduleType: 'weekly',
  enableFixedPlacement: false,
  dayOfWeek: 'MONDAY',
  hour: 1,
  roomIds: [],
  period: 1,
  frequency: 'WEEKLY',
  formats: [{ timesPerWeek: 1, duration: '45' }],
};
