/**
 * Hooks Module - Barrel Export
 * 
 * Barcha custom hookslarni bir joydan import qilish uchun
 * 
 * @example
 * import { useClasses, useTeachers, useLessons } from '@/hooks';
 */

// Classes
export { useClasses } from './useClasses';
export type { ClassWithAvailability } from './useClasses';

// Teachers
export { useTeachers } from './useTeachers';

// Rooms
export { useRooms } from './useRooms';
export type { RoomWithAvailability } from './useRooms';

// Subjects
export { useSubjects } from './useSubjects';
export type { SubjectWithAvailability } from './useSubjects';

// Lessons
export { useLessons } from './useLessons';
