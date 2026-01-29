/**
 * Shared Types for Entity CRUD Pages
 * 
 * Umumiy types: Teachers, Rooms, Subjects, Classes
 * 
 * @module components/shared/types
 */

import { Availability } from '@/utils/timeSlots';

// ============================================================================
// BASE ENTITY
// ============================================================================

/**
 * Base entity interface
 */
export interface BaseEntity {
    id: number;
    name: string;
    shortName?: string;
    createdDate?: string;
    updatedDate?: string;
}

// ============================================================================
// PAGINATION
// ============================================================================

/**
 * Pagination state
 */
export interface PaginationState {
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
    totalElements: number;
}

/**
 * Pagination props for components
 */
export interface PaginationProps extends PaginationState {
    onPageChange: (page: number) => void;
    onItemsPerPageChange?: (count: number) => void;
}

// ============================================================================
// TABLE COLUMN
// ============================================================================

/**
 * Generic table column definition
 */
export interface TableColumn<T> {
    key: keyof T | string;
    header: string;
    width?: string;
    align?: 'left' | 'center' | 'right';
    sortable?: boolean;
    render?: (item: T, index: number) => React.ReactNode;
}

/**
 * Table action for each row
 */
export interface TableAction<T> {
    id: string;
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: (item: T) => void;
    variant?: 'default' | 'destructive' | 'outline' | 'ghost';
    disabled?: (item: T) => boolean;
    hidden?: (item: T) => boolean;
}

// ============================================================================
// DATA TABLE PROPS
// ============================================================================

/**
 * Generic DataTable props
 */
export interface DataTableProps<T extends BaseEntity> {
    data: T[];
    columns: TableColumn<T>[];
    actions?: TableAction<T>[];
    loading?: boolean;
    emptyMessage?: string;
    onRowClick?: (item: T) => void;
    selectedId?: number | null;
    className?: string;
}

// ============================================================================
// FORM DIALOG
// ============================================================================

/**
 * Form field definition
 */
export interface FormField {
    key: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'multiselect' | 'availability' | 'color' | 'textarea';
    placeholder?: string;
    required?: boolean;
    options?: Array<{ value: string | number; label: string }>;
    disabled?: boolean;
    autoGenerate?: (formData: Record<string, any>) => string;
}

/**
 * Form dialog props
 */
export interface EntityFormDialogProps<T> {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    fields: FormField[];
    formData: Partial<T>;
    onFormChange: (field: string, value: any) => void;
    onSave: () => Promise<void>;
    onCancel: () => void;
    isEditing: boolean;
    loading?: boolean;
}

// ============================================================================
// DELETE DIALOG
// ============================================================================

/**
 * Delete confirmation dialog props
 */
export interface DeleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    itemName?: string;
    onConfirm: () => Promise<void>;
    loading?: boolean;
}

// ============================================================================
// SEARCH & FILTER
// ============================================================================

/**
 * Search bar props
 */
export interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

/**
 * Filter option
 */
export interface FilterOption {
    id: string;
    label: string;
    value: string | number | boolean;
}

/**
 * Filter props
 */
export interface FilterProps {
    filters: Record<string, FilterOption[]>;
    activeFilters: Record<string, string | number | boolean>;
    onFilterChange: (key: string, value: string | number | boolean) => void;
    onClearFilters?: () => void;
}

// ============================================================================
// AVAILABILITY GRID
// ============================================================================

/**
 * Availability grid props (general)
 */
export interface AvailabilityGridBaseProps {
    availability: Availability;
    onChange?: (availability: Availability) => void;
    periods: number[];
    readOnly?: boolean;
    compact?: boolean;
    colorScheme?: 'green' | 'blue' | 'purple';
}

// ============================================================================
// PAGE HEADER
// ============================================================================

/**
 * Page header action
 */
export interface PageHeaderAction {
    id: string;
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost';
    primary?: boolean;
}

/**
 * Page header props
 */
export interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: PageHeaderAction[];
    className?: string;
}

// ============================================================================
// ENTITY CRUD HOOK RETURN
// ============================================================================

/**
 * Generic CRUD hook return type
 */
export interface UseEntityReturn<T extends BaseEntity, C = Partial<T>, U = Partial<T>> {
    // Data
    items: T[];
    loading: boolean;
    error: Error | null;

    // Pagination
    pagination: PaginationState;

    // Actions
    create: (data: C) => Promise<T | null>;
    update: (id: number, data: U) => Promise<T | null>;
    remove: (id: number) => Promise<boolean>;
    refetch: () => Promise<void>;

    // Page control
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
export const DAY_LABELS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export const DAY_LABELS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

export const ITEMS_PER_PAGE_OPTIONS = [5, 10, 25, 50, 100];
