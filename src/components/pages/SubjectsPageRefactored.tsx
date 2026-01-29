/**
 * SubjectsPage (Refactored)
 * 
 * Original: 1045 lines → Refactored: ~350 lines
 * 
 * @module components/pages/SubjectsPageRefactored
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

// Subjects Components
import {
    SubjectTable,
    SubjectFormDialog,
    SubjectDisplayData,
    SubjectFormData,
    DEFAULT_SUBJECT_FORM,
} from '@/components/subjects';

// Icons
import { Plus, Upload } from 'lucide-react';

// API & Services
import { SubjectService } from '@/lib/subjects';
import { organizationApi } from '@/api/organizationApi';

// Utils
import { convertToTimeSlots, convertFromTimeSlots, Availability } from '@/utils/timeSlots';

// ============================================================================
// TYPES
// ============================================================================

interface TimeSlot {
    dayOfWeek: string;
    lessons: number[];
}

interface SubjectResponse {
    id: number;
    shortName: string;
    name: string;
    availabilities: TimeSlot[];
    emoji?: string;
    color?: string;
    weight?: number;
}

interface SubjectRequest {
    shortName: string;
    name: string;
    availabilities: TimeSlot[];
    emoji: string;
    color: string;
    weight: number;
}

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

export default function SubjectsPage() {
    const { t } = useTranslation();

    // -------------------------------------------------------------------------
    // STATE
    // -------------------------------------------------------------------------
    // Data
    const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
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
    const [formData, setFormData] = useState<SubjectFormData>(DEFAULT_SUBJECT_FORM);
    const [availability, setAvailability] = useState<Availability>({
        monday: [1, 2, 3, 4, 5, 6, 7],
        tuesday: [1, 2, 3, 4, 5, 6, 7],
        wednesday: [1, 2, 3, 4, 5, 6, 7],
        thursday: [1, 2, 3, 4, 5, 6, 7],
        friday: [1, 2, 3, 4, 5, 6, 7],
        saturday: [],
        sunday: [],
    });

    // Delete Dialog
    const [deleteTarget, setDeleteTarget] = useState<SubjectDisplayData | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // -------------------------------------------------------------------------
    // DATA FETCHING
    // -------------------------------------------------------------------------
    const fetchSubjects = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await SubjectService.getPaginated(currentPage - 1, itemsPerPage);
            setSubjects(data.content || []);
            setTotalPages(data.totalPages || 1);
            setTotalElements(data.totalElements || data.content?.length || 0);
        } catch (error) {
            console.error('Error fetching subjects:', error);
            toast.error(t('subjects.fetch_error'));
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
        fetchSubjects();
    }, [fetchSubjects]);

    useEffect(() => {
        fetchPeriods();
    }, [fetchPeriods]);

    // -------------------------------------------------------------------------
    // COMPUTED
    // -------------------------------------------------------------------------
    const displaySubjects: SubjectDisplayData[] = useMemo(() => {
        return subjects.map((s) => ({
            id: s.id,
            name: s.name,
            shortName: s.shortName,
            color: s.color || '#3B82F6',
            emoji: s.emoji || '📖',
        }));
    }, [subjects]);

    const filteredSubjects = useMemo(() => {
        if (!searchQuery.trim()) return displaySubjects;
        const query = searchQuery.toLowerCase();
        return displaySubjects.filter(
            (s) =>
                s.name.toLowerCase().includes(query) ||
                s.shortName.toLowerCase().includes(query)
        );
    }, [displaySubjects, searchQuery]);

    // -------------------------------------------------------------------------
    // HANDLERS - Form
    // -------------------------------------------------------------------------
    const handleAdd = useCallback(() => {
        setEditingId(null);
        setFormData(DEFAULT_SUBJECT_FORM);
        setAvailability({
            monday: periods,
            tuesday: periods,
            wednesday: periods,
            thursday: periods,
            friday: periods,
            saturday: [],
            sunday: [],
        });
        setIsFormOpen(true);
    }, [periods]);

    const handleEdit = useCallback((subject: SubjectDisplayData) => {
        const fullSubject = subjects.find((s) => s.id === subject.id);
        setEditingId(subject.id);
        setFormData({
            name: subject.name,
            shortName: subject.shortName,
            color: subject.color,
            emoji: subject.emoji,
        });
        if (fullSubject?.availabilities) {
            setAvailability(convertFromTimeSlots(fullSubject.availabilities));
        }
        setIsFormOpen(true);
    }, [subjects]);

    const handleClone = useCallback((subject: SubjectDisplayData) => {
        const fullSubject = subjects.find((s) => s.id === subject.id);
        setEditingId(null);
        setFormData({
            name: `${subject.name} (Copy)`,
            shortName: `${subject.shortName}-C`,
            color: subject.color,
            emoji: subject.emoji,
        });
        if (fullSubject?.availabilities) {
            setAvailability(convertFromTimeSlots(fullSubject.availabilities));
        }
        setIsFormOpen(true);
    }, [subjects]);

    const handleFormChange = useCallback(
        (field: keyof SubjectFormData, value: any) => {
            setFormData((prev) => ({ ...prev, [field]: value }));
        },
        []
    );

    const handleSave = useCallback(async () => {
        if (!formData.name.trim()) {
            toast.error(t('subjects.name_required'));
            return;
        }

        setIsSaving(true);
        try {
            const requestData: SubjectRequest = {
                name: formData.name.trim(),
                shortName: formData.shortName.trim() || formData.name.substring(0, 8),
                color: formData.color,
                emoji: formData.emoji,
                weight: 1,
                availabilities: convertToTimeSlots(availability),
            };

            if (editingId) {
                await SubjectService.update(editingId, requestData);
                toast.success(t('subjects.updated'));
            } else {
                await SubjectService.create(requestData);
                toast.success(t('subjects.created'));
            }

            setIsFormOpen(false);
            setEditingId(null);
            fetchSubjects();
        } catch (error) {
            console.error('Error saving subject:', error);
            toast.error(t('subjects.save_error'));
        } finally {
            setIsSaving(false);
        }
    }, [formData, editingId, availability, fetchSubjects, t]);

    const handleCancel = useCallback(() => {
        setIsFormOpen(false);
        setEditingId(null);
    }, []);

    // -------------------------------------------------------------------------
    // HANDLERS - Delete
    // -------------------------------------------------------------------------
    const handleDelete = useCallback((subject: SubjectDisplayData) => {
        setDeleteTarget(subject);
    }, []);

    const confirmDelete = useCallback(async () => {
        if (!deleteTarget) return;

        setIsDeleting(true);
        try {
            await SubjectService.delete(deleteTarget.id);
            toast.success(t('subjects.deleted'));
            setDeleteTarget(null);
            fetchSubjects();
        } catch (error) {
            console.error('Error deleting subject:', error);
            toast.error(t('subjects.delete_error'));
        } finally {
            setIsDeleting(false);
        }
    }, [deleteTarget, fetchSubjects, t]);

    // -------------------------------------------------------------------------
    // HANDLERS - Other
    // -------------------------------------------------------------------------
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
            label: t('subjects.import'),
            icon: Upload,
            onClick: () => toast.info('Import coming soon'),
            variant: 'outline',
        },
        {
            id: 'add',
            label: t('subjects.add_subject'),
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
                title={t('subjects.title')}
                description={t('subjects.description')}
                actions={headerActions}
            />

            {/* Search */}
            <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={t('subjects.search_placeholder')}
                className="max-w-sm"
            />

            {/* Table */}
            <SubjectTable
                subjects={filteredSubjects}
                loading={isLoading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onClone={handleClone}
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
            <SubjectFormDialog
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                formData={formData}
                onFormChange={handleFormChange}
                onSave={handleSave}
                onCancel={handleCancel}
                isEditing={editingId !== null}
                loading={isSaving}
                periods={periods}
                showAvailability={true}
                availability={availability}
                onAvailabilityChange={setAvailability}
            />

            {/* Delete Confirmation */}
            <DeleteConfirmDialog
                open={deleteTarget !== null}
                onOpenChange={() => setDeleteTarget(null)}
                title={t('subjects.delete_confirm_title')}
                description={t('subjects.delete_confirm_description')}
                itemName={deleteTarget?.name}
                onConfirm={confirmDelete}
                loading={isDeleting}
            />
        </div>
    );
}
