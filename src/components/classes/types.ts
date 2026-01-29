/**
 * ClassesPage Types
 * 
 * ClassesPage componentlari uchun type definitions
 * 
 * @module components/classes/types
 */

import { Availability } from '@/utils/timeSlots';
import { Group } from '@/types/entities';

// ============================================================================
// CLASS FORM DATA
// ============================================================================

/**
 * Inline form data interface
 */
export interface ClassFormData {
    name: string;
    shortName: string;
    classTeacher: string;
    roomIds: string[];
    isGrouped: boolean;
    groups: ClassGroup[];
    originalGroups: ClassGroup[];
    availability: Availability;
}

/**
 * Class group interface (for form)
 */
export interface ClassGroup {
    id?: number;
    name: string;
    isNew?: boolean;
}

/**
 * Default form values
 */
export const DEFAULT_FORM_DATA: ClassFormData = {
    name: '',
    shortName: '',
    classTeacher: '',
    roomIds: [],
    isGrouped: false,
    groups: [],
    originalGroups: [],
    availability: {
        monday: [1, 2, 3, 4, 5, 6, 7],
        tuesday: [1, 2, 3, 4, 5, 6, 7],
        wednesday: [1, 2, 3, 4, 5, 6, 7],
        thursday: [1, 2, 3, 4, 5, 6, 7],
        friday: [1, 2, 3, 4, 5, 6, 7],
        saturday: [],
        sunday: [],
    },
};

// ============================================================================
// CLASS DISPLAY DATA
// ============================================================================

/**
 * Class data for display in table
 */
export interface ClassDisplayData {
    id: number;
    name: string;
    shortName: string;
    isActive: boolean;
    classTeacher: string;
    classTeacherName?: string;
    roomIds: string[];
    roomNames?: string[];
    isGrouped: boolean;
    groups: ClassGroup[];
    availability: Availability;
}

// ============================================================================
// TEACHER & ROOM SIMPLE
// ============================================================================

/**
 * Simple teacher for dropdown
 */
export interface TeacherSimple {
    id: number;
    name: string;
    fullName?: string;
}

/**
 * Simple room for dropdown
 */
export interface RoomSimple {
    id: number;
    name: string;
    shortName?: string;
}

// ============================================================================
// BATCH CREATE
// ============================================================================

/**
 * Grade quantities for batch create
 */
export type GradeQuantities = Record<number, number>;

/**
 * Batch create mode
 */
export type BatchMode = 'simple' | 'quick';

/**
 * Character set for class naming
 */
export type CharacterSet = 'latin' | 'cyrillic';

/**
 * Generated class preview
 */
export interface GeneratedClassPreview {
    id: number;
    name: string;
    shortName: string;
}

// ============================================================================
// DIALOGS & MODALS
// ============================================================================

/**
 * Delete dialog state
 */
export type DeleteDialogState = {
    id: number;
    name: string;
} | null;

/**
 * Changed availability state
 */
export type ChangedAvailabilityState = {
    classId: number;
    availability: Availability;
} | null;

// ============================================================================
// TABLE PROPS
// ============================================================================

/**
 * ClassTable component props
 */
export interface ClassTableProps {
    classes: ClassDisplayData[];
    teachers: TeacherSimple[];
    rooms: RoomSimple[];
    loading: boolean;
    onEdit: (classItem: ClassDisplayData) => void;
    onDelete: (classItem: ClassDisplayData) => void;
    onViewAvailability: (classId: number) => void;
    expandedAvailability: number | null;
    periods: number[];
}

/**
 * ClassFormDialog props
 */
export interface ClassFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    formData: ClassFormData;
    onFormChange: (field: keyof ClassFormData, value: any) => void;
    onSave: () => Promise<void>;
    onCancel: () => void;
    isEditing: boolean;
    teachers: TeacherSimple[];
    rooms: RoomSimple[];
    periods: number[];
    loading?: boolean;
}

/**
 * AvailabilityGrid props
 */
export interface AvailabilityGridProps {
    availability: Availability;
    onChange?: (availability: Availability) => void;
    periods: number[];
    readOnly?: boolean;
    compact?: boolean;
}

/**
 * BatchCreateDialog props
 */
export interface BatchCreateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    gradeList: number[];
    gradeQuantities: GradeQuantities;
    onGradeQuantityChange: (grade: number, quantity: number) => void;
    characterSet: CharacterSet;
    onCharacterSetChange: (set: CharacterSet) => void;
    mode: BatchMode;
    onModeChange: (mode: BatchMode) => void;
    generatedClasses: GeneratedClassPreview[];
    onGenerate: () => void;
    onSave: () => Promise<void>;
    onCancel: () => void;
    loading?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export const LATIN_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
export const CYRILLIC_LETTERS = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'К'];
