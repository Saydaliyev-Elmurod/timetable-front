/**
 * RoomsPage (Refactored)
 * 
 * Original: 914 lines → Refactored: ~300 lines
 * 
 * @module components/pages/RoomsPageRefactored
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

// Shared Components
import {
    PageHeader,
    SearchBar,
    TablePagination,
    DeleteConfirmDialog,
    PageHeaderAction,
} from '@/components/shared';

// Rooms Components
import {
    RoomTable,
    RoomFormDialog,
    RoomDisplayData,
    RoomFormData,
    DEFAULT_ROOM_FORM,
} from '@/components/rooms';

// Icons
import { Plus, Upload } from 'lucide-react';

// API & Services
import {
    RoomService,
    RoomRequest,
    RoomResponse,
    RoomType,
} from '@/lib/rooms';
import { TimeSlot } from '@/lib/teachers';
import { organizationApi } from '@/api/organizationApi';

// Utils
import { convertToTimeSlots, convertFromTimeSlots } from '@/utils/timeSlots';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getTotalAvailablePeriods = (availabilities: TimeSlot[] | null | undefined): number => {
    if (!availabilities) return 0;
    return availabilities.reduce((total, slot) => total + slot.lessons.length, 0);
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function RoomsPage() {
    const { t } = useTranslation();

    // -------------------------------------------------------------------------
    // STATE
    // -------------------------------------------------------------------------
    // Data
    const [rooms, setRooms] = useState<RoomResponse[]>([]);
    const [periods, setPeriods] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);

    // Loading
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    // Search
    const [searchQuery, setSearchQuery] = useState('');

    // Form Dialog
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<RoomFormData>(DEFAULT_ROOM_FORM);

    // Delete Dialog
    const [deleteTarget, setDeleteTarget] = useState<RoomDisplayData | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Expanded Availability
    const [expandedAvailability, setExpandedAvailability] = useState<number | null>(null);

    // -------------------------------------------------------------------------
    // DATA FETCHING
    // -------------------------------------------------------------------------
    const fetchRooms = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await RoomService.getPaginated(currentPage - 1, itemsPerPage);
            setRooms(data.content || []);
            setTotalPages(data.totalPages || 1);
            setTotalElements(data.totalElements || data.content?.length || 0);
        } catch (error) {
            console.error('Error fetching rooms:', error);
            toast.error(t('rooms.fetch_error'));
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, itemsPerPage, t]);

    const fetchPeriods = useCallback(async () => {
        try {
            const org = await organizationApi.get();
            if (org?.periods) {
                const nonBreakCount = org.periods.filter((p: any) => !p.isBreak).length;
                const newPeriods = Array.from({ length: nonBreakCount }, (_, i) => i + 1);
                if (newPeriods.length > 0) {
                    setPeriods(newPeriods);
                }
            }
        } catch (error) {
            console.error('Failed to fetch organization settings:', error);
        }
    }, []);

    useEffect(() => {
        fetchRooms();
    }, [fetchRooms]);

    useEffect(() => {
        fetchPeriods();
    }, [fetchPeriods]);

    // -------------------------------------------------------------------------
    // COMPUTED
    // -------------------------------------------------------------------------
    const displayRooms: RoomDisplayData[] = useMemo(() => {
        return rooms.map((r) => ({
            id: r.id,
            name: r.name,
            shortName: r.shortName,
            capacity: 30, // Default capacity since API doesn't return it
            availabilities: r.availabilities || null,
            totalAvailablePeriods: getTotalAvailablePeriods(r.availabilities),
        }));
    }, [rooms]);

    const filteredRooms = useMemo(() => {
        if (!searchQuery.trim()) return displayRooms;
        const query = searchQuery.toLowerCase();
        return displayRooms.filter(
            (r) =>
                r.name.toLowerCase().includes(query) ||
                r.shortName.toLowerCase().includes(query)
        );
    }, [displayRooms, searchQuery]);

    // -------------------------------------------------------------------------
    // HANDLERS - Form
    // -------------------------------------------------------------------------
    const handleAdd = useCallback(() => {
        setEditingId(null);
        setFormData({
            ...DEFAULT_ROOM_FORM,
            availability: {
                monday: periods,
                tuesday: periods,
                wednesday: periods,
                thursday: periods,
                friday: periods,
                saturday: [],
                sunday: [],
            },
        });
        setIsFormOpen(true);
    }, [periods]);

    const handleEdit = useCallback((room: RoomDisplayData) => {
        setEditingId(room.id);
        setFormData({
            name: room.name,
            shortName: room.shortName,
            capacity: 30, // Default
            availability: room.availabilities
                ? convertFromTimeSlots(room.availabilities)
                : DEFAULT_ROOM_FORM.availability,
        });
        setIsFormOpen(true);
    }, []);

    const handleClone = useCallback((room: RoomDisplayData) => {
        setEditingId(null);
        setFormData({
            name: `${room.name} (Copy)`,
            shortName: `${room.shortName}-C`,
            capacity: 30, // Default
            availability: room.availabilities
                ? convertFromTimeSlots(room.availabilities)
                : DEFAULT_ROOM_FORM.availability,
        });
        setIsFormOpen(true);
    }, []);

    const handleFormChange = useCallback(
        (field: keyof RoomFormData, value: any) => {
            setFormData((prev) => ({ ...prev, [field]: value }));
        },
        []
    );

    const handleSave = useCallback(async () => {
        if (!formData.name.trim()) {
            toast.error(t('rooms.name_required'));
            return;
        }

        setIsSaving(true);
        try {
            const requestData: RoomRequest = {
                name: formData.name.trim(),
                shortName: formData.shortName.trim() || formData.name.substring(0, 8),
                type: RoomType.SHARED,
                availabilities: convertToTimeSlots(formData.availability),
            };

            if (editingId) {
                await RoomService.update(editingId, requestData);
                toast.success(t('rooms.updated'));
            } else {
                await RoomService.create(requestData);
                toast.success(t('rooms.created'));
            }

            setIsFormOpen(false);
            setEditingId(null);
            fetchRooms();
        } catch (error) {
            console.error('Error saving room:', error);
            toast.error(t('rooms.save_error'));
        } finally {
            setIsSaving(false);
        }
    }, [formData, editingId, fetchRooms, t]);

    const handleCancel = useCallback(() => {
        setIsFormOpen(false);
        setEditingId(null);
    }, []);

    // -------------------------------------------------------------------------
    // HANDLERS - Delete
    // -------------------------------------------------------------------------
    const handleDelete = useCallback((room: RoomDisplayData) => {
        setDeleteTarget(room);
    }, []);

    const confirmDelete = useCallback(async () => {
        if (!deleteTarget) return;

        setIsDeleting(true);
        try {
            await RoomService.delete(deleteTarget.id);
            toast.success(t('rooms.deleted'));
            setDeleteTarget(null);
            fetchRooms();
        } catch (error) {
            console.error('Error deleting room:', error);
            toast.error(t('rooms.delete_error'));
        } finally {
            setIsDeleting(false);
        }
    }, [deleteTarget, fetchRooms, t]);

    // -------------------------------------------------------------------------
    // HANDLERS - Other
    // -------------------------------------------------------------------------
    const handleViewAvailability = useCallback((roomId: number) => {
        setExpandedAvailability((prev) => (prev === roomId ? null : roomId));
    }, []);

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
    }, []);

    const handleItemsPerPageChange = useCallback((count: number) => {
        setItemsPerPage(count);
        setCurrentPage(1);
    }, []);

    // -------------------------------------------------------------------------
    // HEADER ACTIONS
    // -------------------------------------------------------------------------
    const headerActions: PageHeaderAction[] = [
        {
            id: 'import',
            label: t('rooms.import'),
            icon: Upload,
            onClick: () => toast.info('Import coming soon'),
            variant: 'outline',
        },
        {
            id: 'add',
            label: t('rooms.add_room'),
            icon: Plus,
            onClick: handleAdd,
            primary: true,
        },
    ];

    // -------------------------------------------------------------------------
    // RENDER
    // -------------------------------------------------------------------------
    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <PageHeader
                title={t('rooms.title')}
                description={t('rooms.description')}
                actions={headerActions}
            />

            {/* Search */}
            <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={t('rooms.search_placeholder')}
                className="max-w-sm"
            />

            {/* Table */}
            <RoomTable
                rooms={filteredRooms}
                loading={isLoading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onClone={handleClone}
                onViewAvailability={handleViewAvailability}
                expandedAvailability={expandedAvailability}
                periods={periods}
            />

            {/* Pagination */}
            <TablePagination
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                totalPages={totalPages}
                totalElements={totalElements}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
            />

            {/* Form Dialog */}
            <RoomFormDialog
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                formData={formData}
                onFormChange={handleFormChange}
                onSave={handleSave}
                onCancel={handleCancel}
                isEditing={editingId !== null}
                periods={periods}
                loading={isSaving}
            />

            {/* Delete Confirmation */}
            <DeleteConfirmDialog
                open={deleteTarget !== null}
                onOpenChange={() => setDeleteTarget(null)}
                title={t('rooms.delete_confirm_title')}
                description={t('rooms.delete_confirm_description')}
                itemName={deleteTarget?.name}
                onConfirm={confirmDelete}
                loading={isDeleting}
            />
        </div>
    );
}
