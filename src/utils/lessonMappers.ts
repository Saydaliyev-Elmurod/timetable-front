import { InternalLesson } from '@/types/lessons';
import { LessonResponse, LessonRequest, LessonUpdateRequest } from '@/types/api';

export function mapApiLessonToInternal(apiLesson: LessonResponse | null): InternalLesson | null {
  if (!apiLesson || !apiLesson.subject || !apiLesson.teacher || !apiLesson.class) {
    console.warn('Invalid lesson data received:', apiLesson);
    return null;
  }

  return {
    id: apiLesson.id,
    subjectId: apiLesson.subject.id,
    subject: apiLesson.subject.name || 'Unknown Subject',
    teacherId: apiLesson.teacher.id,
    teacher: apiLesson.teacher.fullName || 'Unknown Teacher',
    classId: apiLesson.class.id,
    class: apiLesson.class.name || 'Unknown Class',
    day: apiLesson.dayOfWeek || 'MONDAY',
    startTime: '09:00', // This would come from hour + period calculation
    endTime: '10:00',   // This would come from hour + period + duration
    period: apiLesson.period || 1,
    frequency: `${apiLesson.lessonCount || 1}x/week`,
    lessonCount: apiLesson.lessonCount || 1,
    roomIds: (apiLesson.rooms || []).map(r => r.id),
    room: (apiLesson.rooms || []).map(r => r?.name || 'Unknown Room').join(', ') || 'No Room',
    duration: '45 min'  // This could be calculated from period
  };
}

export function mapInternalLessonToApiRequest(lesson: InternalLesson): LessonRequest {
  return {
    classId: lesson.classId,
    teacherId: lesson.teacherId,
    roomIds: lesson.roomIds,
    subjectId: lesson.subjectId,
    lessonCount: lesson.lessonCount,
    dayOfWeek: lesson.day.toUpperCase(),
    hour: parseInt(lesson.startTime.split(':')[0]),
    period: lesson.period
  };
}

export function mapInternalLessonToApiUpdateRequest(lesson: InternalLesson): LessonUpdateRequest {
  return {
    id: lesson.id,
    ...mapInternalLessonToApiRequest(lesson)
  };
}