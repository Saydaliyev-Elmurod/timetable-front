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

export interface TimetableGroupDetail {
    lessonId: number;
    subject: SubjectResponse;
    teacher: TeacherResponse;
    room: RoomResponse;
    group: GroupResponse | null;
    originalLessonData: any;
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
}

export interface UnplacedLesson extends Lesson {
    reason: string;
    requiredCount?: number;
    scheduledCount?: number;
    missingCount?: number;
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
    draggedLesson?: Lesson | null;
    allLessons?: Lesson[];
    rowClass?: string;
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
    draggedLesson?: Lesson | null;
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
