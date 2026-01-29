/**
 * TeachersPage Types
 * 
 * @module components/teachers/types
 */

import { Availability } from '@/utils/timeSlots';
import { SubjectResponse, TimeSlot } from '@/lib/teachers';

// ============================================================================
// TEACHER FORM DATA
// ============================================================================

export interface TeacherFormData {
    fullName: string;
    shortName: string;
    selectedSubjectIds: number[];
    availability: Availability;
}

export const DEFAULT_TEACHER_FORM: TeacherFormData = {
    fullName: '',
    shortName: '',
    selectedSubjectIds: [],
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
// DISPLAY DATA
// ============================================================================

export interface TeacherDisplayData {
    id: number;
    fullName: string;
    shortName: string;
    subjects: SubjectResponse[];
    availabilities: TimeSlot[] | null;
    totalAvailablePeriods: number;
}

// ============================================================================
// SUBJECT SIMPLE
// ============================================================================

export interface SubjectSimple {
    id: number;
    name: string;
    shortName: string;
    emoji?: string;
    color?: string;
}

// ============================================================================
// DIALOG PROPS
// ============================================================================

export interface TeacherFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    formData: TeacherFormData;
    onFormChange: (field: keyof TeacherFormData, value: any) => void;
    onSave: () => Promise<void>;
    onCancel: () => void;
    isEditing: boolean;
    subjects: SubjectSimple[];
    periods: number[];
    loading?: boolean;
    loadingSubjects?: boolean;
}

// ============================================================================
// TABLE PROPS
// ============================================================================

export interface TeacherTableProps {
    teachers: TeacherDisplayData[];
    loading: boolean;
    onEdit: (teacher: TeacherDisplayData) => void;
    onDelete: (teacher: TeacherDisplayData) => void;
    onClone: (teacher: TeacherDisplayData) => void;
    onViewAvailability?: (teacherId: number) => void;
    expandedAvailability?: number | null;
    periods: number[];
    emptyMessage?: string;
}
