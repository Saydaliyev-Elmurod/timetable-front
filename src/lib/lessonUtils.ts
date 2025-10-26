import { InternalLesson } from '../types/lessons';

export interface ClassStats {
  totalLessons: number;
  totalPeriods: number;
  teachers: number;
  subjects: number;
}

export interface TeacherStats {
  totalLessons: number;
  totalPeriods: number;
  classes: number;
  subjects: number;
}

export interface LessonsByClass {
  [key: string]: InternalLesson[];
}

export interface LessonsByTeacher {
  [key: string]: InternalLesson[];
}

export const calculateClassStats = (lessons: InternalLesson[]) => {
  const lessonsByClass: LessonsByClass = lessons.reduce((acc: LessonsByClass, lesson) => {
    if (!acc[lesson.class]) {
      acc[lesson.class] = [];
    }
    acc[lesson.class].push(lesson);
    return acc;
  }, {});

  return Object.entries(lessonsByClass).map(([className, classLessons]) => ({
    className,
    stats: {
      totalLessons: classLessons.length,
      totalPeriods: classLessons.reduce((sum, lesson) => {
        const frequencyNumber = parseInt(lesson.frequency);
        return sum + (isNaN(frequencyNumber) ? 0 : frequencyNumber);
      }, 0),
      teachers: new Set(classLessons.map(l => l.teacher)).size,
      subjects: new Set(classLessons.map(l => l.subject)).size
    }
  }));
};

export const calculateTeacherStats = (lessons: InternalLesson[]) => {
  const lessonsByTeacher: LessonsByTeacher = lessons.reduce((acc: LessonsByTeacher, lesson) => {
    if (!acc[lesson.teacher]) {
      acc[lesson.teacher] = [];
    }
    acc[lesson.teacher].push(lesson);
    return acc;
  }, {});

  return Object.entries(lessonsByTeacher).map(([teacherName, teacherLessons]) => ({
    teacherName,
    stats: {
      totalLessons: teacherLessons.length,
      totalPeriods: teacherLessons.reduce((sum, lesson) => {
        const frequencyNumber = parseInt(lesson.frequency);
        return sum + (isNaN(frequencyNumber) ? 0 : frequencyNumber);
      }, 0),
      classes: new Set(teacherLessons.map(l => l.class)).size,
      subjects: new Set(teacherLessons.map(l => l.subject)).size
    }
  }));
};

export const filterLessons = (lessons: InternalLesson[], query: string): InternalLesson[] => {
  if (!query) return lessons;
  
  const lowercaseQuery = query.toLowerCase();
  return lessons.filter(lesson => 
    lesson.subject.toLowerCase().includes(lowercaseQuery) ||
    lesson.teacher.toLowerCase().includes(lowercaseQuery) ||
    lesson.class.toLowerCase().includes(lowercaseQuery) ||
    lesson.room.toLowerCase().includes(lowercaseQuery)
  );
};

export const paginateLessons = (
  lessons: InternalLesson[], 
  page: number, 
  perPage: number
): InternalLesson[] => {
  const start = page * perPage;
  const end = start + perPage;
  return lessons.slice(start, end);
};