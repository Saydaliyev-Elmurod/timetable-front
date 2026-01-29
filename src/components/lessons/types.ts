/**
 * LessonsPage Types
 * 
 * @module components/lessons/types
 */

// ============================================================================
// VIEW TYPES
// ============================================================================

export type ViewType = 'classes' | 'teachers' | 'subjects' | 'rooms';

// ============================================================================
// GROUPED DATA
// ============================================================================

export interface GroupedLessonData {
    id: string;
    name: string;
    totalLessons: number;
    totalPeriods?: number;
    teachers?: number;
    subjects?: number;
    classes?: number;
    lessons: InternalLesson[];
}

export interface InternalLesson {
    id: number;
    raw: any;
    subject: string;
    teacher: string;
    className: string;
    classId: number;
    teacherId: number;
    subjectId: number;
    day: string | null;
    startTime: string;
    endTime: string;
    period: number;
    frequency: string;
    rooms: any[];
    roomNames: string;
    duration: string;
    lessonCount?: number;
}

export interface LessonsState {
    classes: GroupedLessonData[];
    teachers: GroupedLessonData[];
    subjects: GroupedLessonData[];
    rooms: GroupedLessonData[];
}

// ============================================================================
// ENTITY EDIT
// ============================================================================

export type EntityType = 'class' | 'teacher' | 'subject';

export interface EntityEditState {
    open: boolean;
    type: EntityType | null;
    id: number | null;
    data: EntityEditData | null;
    loading: boolean;
    saving: boolean;
}

export interface EntityEditData {
    // Common
    name?: string;
    fullName?: string;
    shortName?: string;
    availability?: Record<string, number[]>;
    isActive?: boolean;
    raw?: any;

    // Teacher specific
    selectedSubjectIds?: number[];

    // Class specific
    classTeacher?: string;
    roomIds?: string[];
}

// ============================================================================
// OPTIMIZE CONFIG
// ============================================================================

export interface OptimizeConfig {
    timetableId: string;
    applySoftConstraint: boolean;
    applyUnScheduledLessons: boolean;
    applyUnScheduledLessonsPenalty: number;
    applyContinuityPenaltyTeacher: boolean;
    applyContinuityPenaltyTeacherPenalty: number;
    applyContinuityPenaltyClass: boolean;
    applyContinuityPenaltyClassPenalty: number;
    applyBalancedLoad: boolean;
    applyBalancedLoadPenalty: number;
    applyDailySubjectDistribution: boolean;
    applyDailySubjectDistributionPenalty: number;
}

export const DEFAULT_OPTIMIZE_CONFIG: OptimizeConfig = {
    timetableId: '',
    applySoftConstraint: true,
    applyUnScheduledLessons: true,
    applyUnScheduledLessonsPenalty: 100,
    applyContinuityPenaltyTeacher: true,
    applyContinuityPenaltyTeacherPenalty: 20,
    applyContinuityPenaltyClass: true,
    applyContinuityPenaltyClassPenalty: 50,
    applyBalancedLoad: true,
    applyBalancedLoadPenalty: 30,
    applyDailySubjectDistribution: true,
    applyDailySubjectDistributionPenalty: 30,
};

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface LessonGroupCardProps {
    item: GroupedLessonData;
    type: ViewType;
    isExpanded: boolean;
    onToggleExpand: (id: string) => void;
    onAddLesson: (data?: { className?: string; teacherName?: string; subjectId?: string }) => void;
    onEditLesson: (lesson: InternalLesson) => void;
    onDeleteLesson: (id: number) => void;
    onEditEntity: (type: EntityType, id: number) => void;
}

export interface EntityEditDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: EntityType | null;
    data: EntityEditData | null;
    loading: boolean;
    saving: boolean;
    onUpdateField: (field: string, value: any) => void;
    onSave: () => Promise<void>;
    // Entity lists for selectors
    teachers?: any[];
    subjects?: any[];
    rooms?: any[];
    // Availability handlers
    onToggleAvailability: (day: string, period: number) => void;
    onToggleDay: (day: string) => void;
    onTogglePeriod: (period: number) => void;
    onSelectAllAvailability: () => void;
    onClearAllAvailability: () => void;
    // Teacher subjects handlers
    onToggleSubject?: (subjectId: number) => void;
    onRemoveSubject?: (subjectId: number) => void;
    // Class rooms handlers
    onToggleRoom?: (roomId: string) => void;
    periods?: number[];
}

export interface OptimizeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    config: OptimizeConfig;
    onConfigChange: (field: keyof OptimizeConfig, value: any) => void;
    onSubmit: () => Promise<void>;
    isOptimizing: boolean;
}

export interface LessonsToolbarProps {
    allExpanded: boolean;
    onToggleExpandAll: () => void;
    onAddLesson: () => void;
    onOpenOptimize: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const DEFAULT_PERIODS = [1, 2, 3, 4, 5, 6, 7];
