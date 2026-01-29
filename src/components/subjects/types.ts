/**
 * SubjectsPage Types
 * 
 * @module components/subjects/types
 */

// ============================================================================
// SUBJECT FORM DATA
// ============================================================================

export interface SubjectFormData {
    name: string;
    shortName: string;
    color: string;
    emoji: string;
}

export const DEFAULT_SUBJECT_FORM: SubjectFormData = {
    name: '',
    shortName: '',
    color: '#3B82F6',
    emoji: '📖',
};

// ============================================================================
// DISPLAY DATA
// ============================================================================

export interface SubjectDisplayData {
    id: number;
    name: string;
    shortName: string;
    color: string;
    emoji: string;
    teacherCount?: number;
    lessonCount?: number;
}

// ============================================================================
// DIALOG PROPS
// ============================================================================

export interface SubjectFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    formData: SubjectFormData;
    onFormChange: (field: keyof SubjectFormData, value: any) => void;
    onSave: () => Promise<void>;
    onCancel: () => void;
    isEditing: boolean;
    loading?: boolean;
}

// ============================================================================
// TABLE PROPS
// ============================================================================

export interface SubjectTableProps {
    subjects: SubjectDisplayData[];
    loading: boolean;
    onEdit: (subject: SubjectDisplayData) => void;
    onDelete: (subject: SubjectDisplayData) => void;
    onClone: (subject: SubjectDisplayData) => void;
    emptyMessage?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const DEFAULT_COLORS = [
    '#EF4444', // Red
    '#F97316', // Orange
    '#F59E0B', // Amber
    '#EAB308', // Yellow
    '#84CC16', // Lime
    '#22C55E', // Green
    '#10B981', // Emerald
    '#14B8A6', // Teal
    '#06B6D4', // Cyan
    '#0EA5E9', // Sky
    '#3B82F6', // Blue
    '#6366F1', // Indigo
    '#8B5CF6', // Violet
    '#A855F7', // Purple
    '#D946EF', // Fuchsia
    '#EC4899', // Pink
];

export const DEFAULT_EMOJIS = [
    '📖', '📚', '📐', '🔬', '🧪', '🌍', '🗺️', '🎨', '🎵', '🎭',
    '💻', '🧮', '📝', '✍️', '🏃', '⚽', '🏀', '🎯', '🧠', '💡',
];
