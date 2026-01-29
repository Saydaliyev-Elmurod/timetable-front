/**
 * Core Entity Types
 * 
 * Bu fayl barcha asosiy entity typelarni o'z ichiga oladi.
 * Single Source of Truth - boshqa fayllarda bu types import qilinadi.
 * 
 * @module types/entities
 */

// ============================================================================
// TIME & AVAILABILITY
// ============================================================================

/**
 * Hafta kunlari (backend format)
 */
export type DayOfWeek =
    | 'MONDAY'
    | 'TUESDAY'
    | 'WEDNESDAY'
    | 'THURSDAY'
    | 'FRIDAY'
    | 'SATURDAY'
    | 'SUNDAY';

/**
 * Hafta kunlari (frontend format - lowercase)
 */
export type DayOfWeekLower =
    | 'monday'
    | 'tuesday'
    | 'wednesday'
    | 'thursday'
    | 'friday'
    | 'saturday'
    | 'sunday';

/**
 * Backend TimeSlot format
 */
export interface TimeSlot {
    dayOfWeek: DayOfWeek;
    lessons: number[];
}

/**
 * Frontend Availability format
 */
export interface Availability {
    monday: number[];
    tuesday: number[];
    wednesday: number[];
    thursday: number[];
    friday: number[];
    saturday: number[];
    sunday: number[];
}

/**
 * Dars chastotasi
 */
export type LessonFrequency = 'WEEKLY' | 'BI_WEEKLY' | 'TRI_WEEKLY';

// ============================================================================
// TEACHER
// ============================================================================

/**
 * O'qituvchi (backend response)
 */
export interface Teacher {
    id: number;
    fullName: string;
    shortName: string;
    subjects: Subject[];
    availabilities: TimeSlot[];
    createdDate: string;
    updatedDate: string;
}

/**
 * O'qituvchi yaratish uchun request
 */
export interface TeacherCreateRequest {
    fullName: string;
    shortName: string;
    subjects: number[];
    availabilities: TimeSlot[];
}

/**
 * O'qituvchi yangilash uchun request
 */
export interface TeacherUpdateRequest extends TeacherCreateRequest {
    deletedSubjects: number[];
}

/**
 * Soddalashtirilgan o'qituvchi (dropdown uchun)
 */
export interface TeacherSimple {
    id: number;
    name: string;
    fullName: string;
    shortName?: string;
}

// ============================================================================
// SUBJECT (FAN)
// ============================================================================

/**
 * Fan (backend response)
 */
export interface Subject {
    id: number;
    name: string;
    shortName: string;
    availabilities: TimeSlot[];
    emoji?: string;
    color?: string;
    weight?: number;
}

/**
 * Fan yaratish uchun request
 */
export interface SubjectCreateRequest {
    name: string;
    shortName: string;
    availabilities: TimeSlot[];
    emoji?: string;
    color?: string;
    weight?: number;
}

// ============================================================================
// ROOM (XONA)
// ============================================================================

/**
 * Xona turi
 */
export type RoomType = 'SHARED' | 'SPECIAL';

/**
 * Xona (backend response)
 */
export interface Room {
    id: number;
    name: string;
    shortName: string;
    type: RoomType;
    availabilities: TimeSlot[];
    allowedSubjectIds?: number[];
}

/**
 * Xona yaratish uchun request
 */
export interface RoomCreateRequest {
    name: string;
    shortName: string;
    type: RoomType;
    availabilities: TimeSlot[];
    allowedSubjectIds?: number[];
}

/**
 * Soddalashtirilgan xona (dropdown uchun)
 */
export interface RoomSimple {
    id: number;
    name: string;
    shortName?: string;
    type?: RoomType;
}

// ============================================================================
// GROUP (GURUH)
// ============================================================================

/**
 * Sinf ichidagi guruh
 */
export interface Group {
    id: number;
    name: string;
}

/**
 * Guruh yaratish uchun request
 */
export interface GroupCreateRequest {
    name: string;
}

/**
 * Guruh yangilash uchun request
 */
export interface GroupUpdateRequest {
    id: number;
    name: string;
}

// ============================================================================
// CLASS (SINF)
// ============================================================================

/**
 * Sinf (backend response)
 */
export interface Class {
    id: number;
    name: string;
    shortName: string;
    isActive?: boolean;
    isGrouped?: boolean;
    teacher?: Teacher;
    rooms?: Room[];
    groups?: Group[];
    availabilities: TimeSlot[];
    createdDate?: string;
    updatedDate?: string;
}

/**
 * Sinf yaratish uchun request
 */
export interface ClassCreateRequest {
    name: string;
    shortName: string;
    teacherId?: number | null;
    rooms: number[];
    groups: GroupCreateRequest[];
    availabilities: TimeSlot[];
}

/**
 * Sinf yangilash uchun request
 */
export interface ClassUpdateRequest {
    name: string;
    shortName: string;
    teacherId?: number | null;
    rooms: number[];
    deletedRooms: number[];
    newGroups: GroupCreateRequest[];
    updatedGroups: GroupUpdateRequest[];
    deletedGroupIds: number[];
    availabilities: TimeSlot[];
}

/**
 * Frontend uchun sinf (availability converted)
 */
export interface ClassWithAvailability extends Omit<Class, 'availabilities'> {
    classTeacherId: string;
    roomIds: string[];
    availability: Availability;
}

// ============================================================================
// LESSON (DARS)
// ============================================================================

/**
 * Guruh dars tafsilotlari
 */
export interface GroupLessonDetail {
    groupId: number;
    teacherId: number;
    subjectId: number;
    roomIds: number[];
}

/**
 * Guruh dars tafsilotlari (full objects)
 */
export interface GroupLessonDetailFull {
    group: Group;
    teacher: Teacher;
    subject: Subject;
    rooms: Room[];
}

/**
 * Dars (compact format - IDs bilan)
 */
export interface LessonCompact {
    id: number;
    classId: number;
    teacherId: number;
    subjectId: number;
    roomIds: number[];
    groupId?: number;
    groupDetails?: GroupLessonDetail[];
    lessonCount: number;
    dayOfWeek?: DayOfWeek;
    hour?: number;
    period: number;
    frequency?: LessonFrequency;
    createdDate: string;
    updatedDate: string;
}

/**
 * Dars (full format - objects bilan)
 */
export interface LessonFull {
    id: number;
    class: Class;
    teacher: Teacher;
    subject: Subject;
    rooms: Room[];
    group?: Group;
    groupDetails?: GroupLessonDetailFull[];
    lessonCount: number;
    dayOfWeek?: DayOfWeek;
    hour?: number;
    period: number;
    frequency?: LessonFrequency;
    createdDate: string;
    updatedDate: string;
}

/**
 * Dars yaratish uchun request
 */
export interface LessonCreateRequest {
    classId: number[];
    teacherId: number;
    subjectId: number;
    roomIds: number[];
    lessonCount: number;
    dayOfWeek?: DayOfWeek;
    hour?: number;
    period: number;
    frequency?: LessonFrequency;
    groups?: GroupLessonDetail[];
}

/**
 * Dars yangilash uchun request
 */
export interface LessonUpdateRequest extends LessonCreateRequest {
    id: number;
}

// ============================================================================
// TIMETABLE
// ============================================================================

/**
 * Jadval holati
 */
export type TimetableStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

/**
 * Jadval entity
 */
export interface Timetable {
    id: string;
    name: string;
    status: TimetableStatus;
    period: number;
    createdDate: string;
    updatedDate: string;
}

/**
 * Jadval ma'lumotlari
 */
export interface TimetableData {
    id: string;
    timetableId: string;
    isScheduled: boolean;
    classId: number;
    dayOfWeek: DayOfWeek;
    hour: number;
    weekIndex?: number | null;
    version: number;
}

// ============================================================================
// PAGINATION & API RESPONSE
// ============================================================================

/**
 * Sahifalash javob formati
 */
export interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
}

/**
 * Optimallashtirilgan lessons response (metadata bilan)
 */
export interface LessonsWithMetadataResponse {
    lessons: LessonCompact[];
    classes: Class[];
    teachers: Teacher[];
    rooms: Room[];
    subjects: Subject[];
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * LessonCompact ekanligini tekshirish
 */
export function isLessonCompact(lesson: LessonCompact | LessonFull): lesson is LessonCompact {
    return 'classId' in lesson && typeof lesson.classId === 'number';
}

/**
 * LessonFull ekanligini tekshirish
 */
export function isLessonFull(lesson: LessonCompact | LessonFull): lesson is LessonFull {
    return 'class' in lesson && typeof lesson.class === 'object';
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Entity ID type
 */
export type EntityId = number;

/**
 * Optional ID (yangi entity uchun)
 */
export type OptionalId<T extends { id: EntityId }> = Omit<T, 'id'> & { id?: EntityId };

/**
 * Create request type generator
 */
export type CreateRequest<T extends { id: EntityId; createdDate?: string; updatedDate?: string }> =
    Omit<T, 'id' | 'createdDate' | 'updatedDate'>;
