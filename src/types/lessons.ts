export interface InternalLesson {
  id: number;
  subjectId: number;
  subject: string;
  teacherId: number;
  teacher: string;
  classId: number;
  class: string;
  day: string;
  startTime: string;
  endTime: string;
  period: number;
  frequency: string;
  lessonCount: number;
  roomIds: number[];
  room: string;
  duration: string;
}
