import { InternalLesson } from '../types/lessons';
import { GroupedData } from '../types/common';

type LessonsByKey = { [key: string]: InternalLesson[] };

export const groupLessonsByKey = (lessons: InternalLesson[], key: keyof InternalLesson): LessonsByKey => {
  return lessons.reduce((acc: LessonsByKey, lesson) => {
    const keyValue = lesson[key].toString();
    if (!acc[keyValue]) {
      acc[keyValue] = [];
    }
    acc[keyValue].push(lesson);
    return acc;
  }, {});
};

export const getUniqueCount = (lessons: InternalLesson[], key: keyof InternalLesson): number => {
  return new Set(lessons.map(l => l[key])).size;
};

export const getFrequencySum = (lessons: InternalLesson[]): number => {
  return lessons.reduce((sum, lesson) => {
    const frequencyNumber = parseInt(lesson.frequency);
    return sum + (isNaN(frequencyNumber) ? 0 : frequencyNumber);
  }, 0);
};

export const getLessonsByClass = (lessons: InternalLesson[]): GroupedData[] => {
  const grouped = groupLessonsByKey(lessons, 'class');
  
  return Object.entries(grouped).map(([className, classLessons]) => ({
    id: className,
    name: className,
    lessons: classLessons,
    totalLessons: classLessons.length,
    totalPeriods: getFrequencySum(classLessons),
    teachers: getUniqueCount(classLessons, 'teacher'),
    subjects: getUniqueCount(classLessons, 'subject')
  }));
};

export const getLessonsByTeacher = (lessons: InternalLesson[]): GroupedData[] => {
  const grouped = groupLessonsByKey(lessons, 'teacher');
  
  return Object.entries(grouped).map(([teacherName, teacherLessons]) => ({
    id: teacherName,
    name: teacherName,
    lessons: teacherLessons,
    totalLessons: teacherLessons.length,
    totalPeriods: getFrequencySum(teacherLessons),
    classes: getUniqueCount(teacherLessons, 'class'),
    subjects: getUniqueCount(teacherLessons, 'subject')
  }));
};

export const getLessonsBySubject = (lessons: InternalLesson[]): GroupedData[] => {
  const grouped = groupLessonsByKey(lessons, 'subject');
  
  return Object.entries(grouped).map(([subjectName, subjectLessons]) => ({
    id: subjectName,
    name: subjectName,
    lessons: subjectLessons,
    totalLessons: subjectLessons.length,
    teachers: getUniqueCount(subjectLessons, 'teacher'),
    classes: getUniqueCount(subjectLessons, 'class'),
    totalPeriods: getFrequencySum(subjectLessons)
  }));
};

export const getLessonsByRoom = (lessons: InternalLesson[]): GroupedData[] => {
  const grouped = groupLessonsByKey(lessons, 'room');
  
  return Object.entries(grouped).map(([roomName, roomLessons]) => ({
    id: roomName,
    name: roomName,
    lessons: roomLessons,
    totalLessons: roomLessons.length,
    totalPeriods: getFrequencySum(roomLessons),
    teachers: getUniqueCount(roomLessons, 'teacher'),
    classes: getUniqueCount(roomLessons, 'class')
  }));
};