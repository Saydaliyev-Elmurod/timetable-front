/**
 * Timetable Types
 * 
 * @module components/timetable/types
 */

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface TimeSlot {
    dayOfWeek: string;
    lessons: number[];
}

export interface TeacherResponse {
    id: number;
    fullName: string;
    shortName: string;
    availabilities: TimeSlot[];
    createdDate: string;
    updatedDate: string;
}

export interface SubjectResponse {
    id: number;
    shortName: string;
    name: string;
    availabilities: TimeSlot[];
}

export interface RoomResponse {
    id: number;
    name: string;
}

export interface ClassResponse {
    id: number;
    shortName: string;
    name: string;
    availabilities: TimeSlot[];
    teacher: TeacherResponse;
    rooms: RoomResponse[];
    updatedDate: string;
    createdDate: string;
}

export interface GroupResponse {
    id: number;
    name: string;
}

/**
 * Per-detail entry inside a slot. Carries the subject, teacher, room and
 * optional group for a single sub-lesson. Multiple entries can share the
 * same slot (parallel groups with potentially different subjects).
 */
export interface TimetableGroupDetail {
    lessonId: number;
    subjectId: number | null;
    teacherId: number;
    roomId: number;
    groupId: number | null;
}

export interface TimetableFullResponse {
    timetableData: TimetableDataEntity[];
    classes: ClassResponse[];
    teachers: TeacherResponse[];
    subjects: SubjectResponse[];
    rooms: RoomResponse[];
    groups: GroupResponse[];
}

export interface UnscheduledLessonResponse {
    classInfo: ClassResponse;
    teacher: TeacherResponse;
    subject: SubjectResponse;
    room: RoomResponse[];
    requiredCount: number;
    scheduledCount: number;
    missingCount: number;
}

export interface TimetableDataEntity {
    id: string;
    timetableId: string;
    isScheduled: boolean;
    classId: number;
    dayOfWeek: string;
    hour: number;
    /**
     * Legacy parent-level subject. Superseded by `TimetableGroupDetail.subjectId`
     * on each slot detail; retained only as a fallback for older payloads and
     * for unscheduled entries.
     */
    subjectId: number | null;
    weekIndex: number | null;
    slotDetails: TimetableGroupDetail[];
    unscheduledData: UnscheduledLessonResponse | null;
    version: number;
}

// ============================================================================
// INTERNAL TYPES (for DnD and display)
// ============================================================================

export interface Lesson {
    id: string;
    subject: string;
    subjectId: number;
    teacher: string;
    teacherId: number;
    teacherShort: string;
    room: string;
    roomId: number;
    class: string;
    classId: number;
    day?: string;
    timeSlot?: number;
    isLocked?: boolean;
    groupName?: string;
    groupId?: number;
    weekIndex?: number | null;
    isBiWeekly?: boolean;
    rawDetails?: TimetableGroupDetail;
    // Slot-grouping metadata.
    /** Stable key identifying the slot this lesson belongs to: classId::day::hour::weekIndex */
    slotKey: string;
    /** Index of this lesson inside its parent slotDetails array (0..groupCount-1). */
    groupIndex: number;
    /** Total number of lessons sharing the same slot. */
    groupCount: number;
    /** Deterministic color palette index derived from subjectId (0..11), or -1 if unknown. */
    subjectColorIndex: number;
    /** Parent TimetableDataEntity.id */
    entityId: string;
    /** Parent TimetableDataEntity.version */
    version: number;
}

export interface UnplacedLesson extends Lesson {
    reason: string;
    requiredCount?: number;
    scheduledCount?: number;
    missingCount?: number;
}

/**
 * A SlotGroup represents ALL lessons that share a single timetable slot
 * (same class/day/hour/weekIndex). Multiple `slotDetails` on a single
 * `TimetableDataEntity` produce exactly one SlotGroup with N lessons.
 * This is the primary unit used by the grid to render side-by-side sub-cards.
 *
 * NOTE: `subjectId`, `subjectName`, and `colorIndex` are representative of
 * the slot only when all lessons share the same subject. When a slot holds
 * parallel groups with different subjects, aggregation yields
 * `subjectId: null`, `subjectName: "Mixed"`, `colorIndex: -1` so consumers
 * don't silently mislabel heterogeneous slots. Consult the per-lesson
 * `Lesson.subjectId` for authoritative values.
 */
export interface SlotGroup {
    slotKey: string;
    entityId: string;
    classId: number;
    day: string;
    hour: number;
    weekIndex: number | null;
    subjectId: number | null;
    subjectName: string;
    colorIndex: number;
    lessons: Lesson[];
    groupCount: number;
    version: number;
    isLocked: boolean;
}

export interface DisplayOptions {
    showTeacher: boolean;
    showRoom: boolean;
    showSubject: boolean;
}

// ============================================================================
// VIEW MODE TYPES
// ============================================================================

export type ViewMode = 'classes' | 'teachers' | 'rooms' | 'compact';
export type FilterBy = 'all' | 'class' | 'teacher' | 'room';

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface DraggableLessonCardProps {
    lesson: Lesson | UnplacedLesson;
    onEdit: (lesson: Lesson | UnplacedLesson) => void;
    onDelete: (lesson: Lesson | UnplacedLesson) => void;
    onToggleLock: (lesson: Lesson | UnplacedLesson) => void;
    displayOptions: DisplayOptions;
    isUnplaced?: boolean;
    compact?: boolean;
    showClass?: boolean;
    hasConflict?: boolean;
    isSelected?: boolean;
    onSelect?: (lesson: Lesson | UnplacedLesson) => void;
}

export interface DroppableTimeSlotProps {
    day: string;
    timeSlot: number;
    lessons?: Lesson[];
    onDrop: (lesson: Lesson, day: string, timeSlot: number) => void;
    onEdit: (lesson: Lesson) => void;
    onDelete: (lesson: Lesson) => void;
    onToggleLock: (lesson: Lesson) => void;
    displayOptions: DisplayOptions;
    compact?: boolean;
    showClass?: boolean;
    allLessons?: Lesson[];
    rowClass?: string;
    entityKey?: string;
    selectedLesson?: Lesson | UnplacedLesson | null;
    onManualPlace?: (day: string, timeSlot: number) => void;
}

export interface GridProps {
    lessons: Lesson[];
    onDrop: (lesson: Lesson, day: string, timeSlot: number) => void;
    onEdit: (lesson: Lesson) => void;
    onDelete: (lesson: Lesson) => void;
    onToggleLock: (lesson: Lesson) => void;
    displayOptions: DisplayOptions;
    timeSlots: number[];
    allLessons?: Lesson[];
    selectedLesson?: Lesson | UnplacedLesson | null;
    onManualPlace?: (day: string, timeSlot: number) => void;
}

export interface ClassViewGridProps extends GridProps {
    className: string;
    onSelectLesson?: (lesson: Lesson | UnplacedLesson) => void;
}

export interface TeacherViewGridProps extends GridProps {
    teacherName: string;
}

export interface RoomViewGridProps extends GridProps {
    roomName: string;
}

export interface CompactViewGridProps extends GridProps {
    classes: string[];
}

export interface TimetableToolbarProps {
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    displayOptions: DisplayOptions;
    onDisplayOptionsChange: (options: DisplayOptions) => void;
    filterBy: FilterBy;
    onFilterByChange: (filter: FilterBy) => void;
    selectedEntity: string;
    onSelectedEntityChange: (entity: string) => void;
    allClasses: string[];
    allTeachers: string[];
    allRooms: string[];
    onOptimize: () => void;
    onExport: () => void;
    onNavigate?: (page: string) => void;
    timetableVersion: number;
    scheduleIntegrity: number;
    conflicts: number;
    unplacedCount: number;
}

export interface UnplacedSidebarProps {
    lessons: UnplacedLesson[];
    onEdit: (lesson: UnplacedLesson) => void;
    onDelete: (lesson: UnplacedLesson) => void;
    onToggleLock: (lesson: UnplacedLesson) => void;
    displayOptions: DisplayOptions;
    selectedLesson?: Lesson | UnplacedLesson | null;
    onSelectLesson: (lesson: UnplacedLesson) => void;
}
