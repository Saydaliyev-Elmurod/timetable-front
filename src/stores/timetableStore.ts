import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  TimetableState, 
  Lesson, 
  Position, 
  Teacher,
  Class,
  Room 
} from '@/types/timetable';
import { validateMove, validateSwap } from '@/lib/timetableValidation';

type Schedule = Record<string, Record<number, number | 'FREE' | 'TIME-OFF'>>;

interface InitialData {
  teachers: Teacher[];
  classes: Class[];
  rooms: Room[];
  unplacedLessons: Lesson[];
}

interface TimetableStore extends TimetableState {
  // State modifiers
  setInitialData: (data: InitialData) => void;
  moveLesson: (lesson: Lesson, position: Position) => boolean;
  swapLessons: (lessonA: Lesson, lessonB: Lesson) => boolean;
  placeLessonFromUnplaced: (lesson: Lesson, position: Position) => boolean;
  
  // Helpers
  validateMove: (lesson: Lesson, position: Position) => { isValid: boolean; reason: string | null };
  validateSwap: (lessonA: Lesson, lessonB: Lesson) => { isValid: boolean; reason: string | null };
  getTeacherSchedule: (teacherId: number) => Schedule;
  getClassSchedule: (classId: number) => Schedule;
  getRoomSchedule: (roomId: number) => Schedule;
}

const useTimetableStore = create<TimetableStore>((set, get) => ({
      teachers: {},
      classes: {},
      rooms: {},
      unplacedLessons: [],

      setInitialData: (data: InitialData) => {
        const teachersMap = data.teachers.reduce((acc: Record<number, Teacher>, teacher: Teacher) => {
          acc[teacher.id] = teacher;
          return acc;
        }, {});

        const classesMap = data.classes.reduce((acc: Record<number, Class>, cls: Class) => {
          acc[cls.id] = cls;
          return acc;
        }, {});

        const roomsMap = data.rooms.reduce((acc: Record<number, Room>, room: Room) => {
          acc[room.id] = room;
          return acc;
        }, {});

        set({
          teachers: teachersMap,
          classes: classesMap,
          rooms: roomsMap,
          unplacedLessons: data.unplacedLessons,
        });
      },

      moveLesson: (lesson: Lesson, position: Position) => {
        const validation = validateMove(lesson, position, get());
        if (!validation.isValid) return false;

        const { teachers, classes, rooms } = get();
        const oldPosition = {
          day: lesson.day!,
          hour: lesson.hour!,
          roomId: lesson.roomId,
        };

        // Clear old position
        if (oldPosition.day && oldPosition.hour) {
          teachers[lesson.teacherId].schedule[oldPosition.day][oldPosition.hour] = 'FREE';
          classes[lesson.classId].schedule[oldPosition.day][oldPosition.hour] = 'FREE';
          if (oldPosition.roomId) {
            rooms[oldPosition.roomId].schedule[oldPosition.day][oldPosition.hour] = 'FREE';
          }
        }

        // Set new position
        teachers[lesson.teacherId].schedule[position.day][position.hour] = lesson.id;
        classes[lesson.classId].schedule[position.day][position.hour] = lesson.id;
        if (position.roomId) {
          rooms[position.roomId].schedule[position.day][position.hour] = lesson.id;
        }

        set({ teachers, classes, rooms });
        return true;
      },

      swapLessons: (lessonA: Lesson, lessonB: Lesson) => {
        const validation = validateSwap(lessonA, lessonB, get());
        if (!validation.isValid) return false;

        const positionA = {
          day: lessonA.day!,
          hour: lessonA.hour!,
          roomId: lessonA.roomId,
        };

        const positionB = {
          day: lessonB.day!,
          hour: lessonB.hour!,
          roomId: lessonB.roomId,
        };

        get().moveLesson(lessonA, positionB);
        get().moveLesson(lessonB, positionA);

        return true;
      },

      placeLessonFromUnplaced: (lesson: Lesson, position: Position) => {
        const validation = validateMove(lesson, position, get());
        if (!validation.isValid) return false;

        const { teachers, classes, rooms, unplacedLessons } = get();

        // Update schedules
        teachers[lesson.teacherId].schedule[position.day][position.hour] = lesson.id;
        classes[lesson.classId].schedule[position.day][position.hour] = lesson.id;
        if (position.roomId) {
          rooms[position.roomId].schedule[position.day][position.hour] = lesson.id;
        }

        // Remove from unplaced
        const newUnplacedLessons = unplacedLessons.filter(l => l.id !== lesson.id);

        set({
          teachers,
          classes,
          rooms,
          unplacedLessons: newUnplacedLessons,
        });

        return true;
      },

      validateMove: (lesson: Lesson, position: Position) => validateMove(lesson, position, get()),
      validateSwap: (lessonA: Lesson, lessonB: Lesson) => validateSwap(lessonA, lessonB, get()),

      getTeacherSchedule: (teacherId: number) => get().teachers[teacherId]?.schedule || {},
      getClassSchedule: (classId: number) => get().classes[classId]?.schedule || {},
      getRoomSchedule: (roomId: number) => get().rooms[roomId]?.schedule || {},
    }));

export default useTimetableStore;