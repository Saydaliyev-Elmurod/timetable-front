/**
 * Types Module - Barrel Export
 * 
 * Barcha types ni bir joydan import qilish uchun
 * 
 * @example
 * import { Teacher, Class, Lesson } from '@/types';
 */

// Entity types (primary source of truth)
export * from './entities';

// API types - faqat api.ts da unique types (entities.ts da yo'q bo'lganlar)
export {
    type ClassResponse,
    type GroupResponse,
    type TeacherResponse,
    type RoomResponse,
    type SubjectResponse,
    type LessonResponseFull,
    type LessonResponseCompact,
    isCompactLesson,
    isFullLesson,
    createLookupMaps,
    expandCompactLesson,
} from './api';
