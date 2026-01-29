/**
 * RoomsPage Types
 * 
 * @module components/rooms/types
 */

import { Availability } from '@/utils/timeSlots';
import { TimeSlot } from '@/lib/rooms';

// ============================================================================
// ROOM FORM DATA
// ============================================================================

export interface RoomFormData {
    name: string;
    shortName: string;
    capacity: number;
    availability: Availability;
}

export const DEFAULT_ROOM_FORM: RoomFormData = {
    name: '',
    shortName: '',
    capacity: 30,
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

export interface RoomDisplayData {
    id: number;
    name: string;
    shortName: string;
    capacity: number;
    availabilities: TimeSlot[] | null;
    totalAvailablePeriods: number;
}

// ============================================================================
// DIALOG PROPS
// ============================================================================

export interface RoomFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    formData: RoomFormData;
    onFormChange: (field: keyof RoomFormData, value: any) => void;
    onSave: () => Promise<void>;
    onCancel: () => void;
    isEditing: boolean;
    periods: number[];
    loading?: boolean;
}

// ============================================================================
// TABLE PROPS
// ============================================================================

export interface RoomTableProps {
    rooms: RoomDisplayData[];
    loading: boolean;
    onEdit: (room: RoomDisplayData) => void;
    onDelete: (room: RoomDisplayData) => void;
    onClone: (room: RoomDisplayData) => void;
    onViewAvailability?: (roomId: number) => void;
    expandedAvailability?: number | null;
    periods: number[];
    emptyMessage?: string;
}
