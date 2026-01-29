/**
 * TeachersPage (Refactored)
 * 
 * Original: 1030 lines → Refactored: ~350 lines
 * 
 * @module components/pages/TeachersPageRefactored
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

// Teachers Components
import {
    TeacherTable,
    TeacherFormDialog,
    TeacherDisplayData,
    TeacherFormData,
    SubjectSimple,
    DEFAULT_TEACHER_FORM,
} from '@/components/teachers';

// Icons
import { Plus, Upload } from 'lucide-react';

// API & Services
import {
    TeacherService,
    TeacherResponse,
    TeacherRequest,
    TeacherUpdateRequest,
    SubjectResponse,
    TimeSlot,
} from '@/lib/teachers';
import { SubjectService } from '@/lib/subjects';
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

export default function TeachersPage() {
    const { t } = useTranslation();

    // -------------------------------------------------------------------------
    // STATE
    // -------------------------------------------------------------------------
    // Data
    const [teachers, setTeachers] = useState<TeacherResponse[]>([]);
    const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
    const [periods, setPeriods] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);

    // Loading
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);

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
    const [originalSubjectIds, setOriginalSubjectIds] = useState<number[]>([]);
    const [formData, setFormData] = useState<TeacherFormData>(DEFAULT_TEACHER_FORM);

    // Delete Dialog
    const [deleteTarget, setDeleteTarget] = useState<TeacherDisplayData | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Expanded Availability
    const [expandedAvailability, setExpandedAvailability] = useState<number | null>(null);

    // -------------------------------------------------------------------------
    // DATA FETCHING
    // -------------------------------------------------------------------------
    const fetchTeachers = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await TeacherService.getPaginated(currentPage - 1, itemsPerPage);
            setTeachers(data.content || []);
            setTotalPages(data.totalPages || 1);
            setTotalElements(data.totalElements || data.content?.length || 0);
        } catch (error) {
            console.error('Error fetching teachers:', error);
            toast.error(t('teachers.fetch_error'));
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, itemsPerPage, t]);

    const fetchSubjects = useCallback(async () => {
        try {
            setIsLoadingSubjects(true);
            const data = await SubjectService.getAll();
            if (Array.isArray(data)) {
                setSubjects(data);
            } else if (Array.isArray((data as any).data)) {
                setSubjects((data as any).data);
            } else if (Array.isArray((data as any).content)) {
                setSubjects((data as any).content);
            } else {
                setSubjects([]);
            }
        } catch (error) {
            console.error('Error fetching subjects:', error);
            toast.error(t('teachers.subjects_error'));
        } finally {
            setIsLoadingSubjects(false);
        }
    }, [t]);

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
        fetchTeachers();
    }, [fetchTeachers]);

    useEffect(() => {
        fetchSubjects();
        fetchPeriods();
    }, [fetchSubjects, fetchPeriods]);

    // -------------------------------------------------------------------------
    // COMPUTED
    // -------------------------------------------------------------------------
    const displayTeachers: TeacherDisplayData[] = useMemo(() => {
        return teachers.map((t) => ({
            id: t.id,
            fullName: t.fullName,
            shortName: t.shortName,
            subjects: t.subjects || [],
            availabilities: t.availabilities || null,
            totalAvailablePeriods: getTotalAvailablePeriods(t.availabilities),
        }));
    }, [teachers]);

    const filteredTeachers = useMemo(() => {
        if (!searchQuery.trim()) return displayTeachers;
        const query = searchQuery.toLowerCase();
        return displayTeachers.filter(
            (t) =>
                t.fullName.toLowerCase().includes(query) ||
                t.shortName.toLowerCase().includes(query) ||
                t.subjects.some((s) => s.name.toLowerCase().includes(query))
        );
    }, [displayTeachers, searchQuery]);

    const subjectOptions: SubjectSimple[] = useMemo(() => {
        return subjects.map((s) => ({
            id: s.id,
            name: s.name,
            shortName: s.shortName,
            emoji: s.emoji,
            color: s.color,
        }));
    }, [subjects]);

    // -------------------------------------------------------------------------
    // HANDLERS - Form
    // -------------------------------------------------------------------------
    const handleAdd = useCallback(() => {
        setEditingId(null);
        setOriginalSubjectIds([]);
        setFormData({
            ...DEFAULT_TEACHER_FORM,
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

    const handleEdit = useCallback((teacher: TeacherDisplayData) => {
        setEditingId(teacher.id);
        setOriginalSubjectIds(teacher.subjects.map((s) => s.id));
        setFormData({
            fullName: teacher.fullName,
            shortName: teacher.shortName,
            selectedSubjectIds: teacher.subjects.map((s) => s.id),
            availability: teacher.availabilities
                ? convertFromTimeSlots(teacher.availabilities)
                : DEFAULT_TEACHER_FORM.availability,
        });
        setIsFormOpen(true);
    }, []);

    const handleClone = useCallback((teacher: TeacherDisplayData) => {
        setEditingId(null);
        setOriginalSubjectIds([]);
        setFormData({
            fullName: `${teacher.fullName} (Copy)`,
            shortName: `${teacher.shortName}-C`,
            selectedSubjectIds: teacher.subjects.map((s) => s.id),
            availability: teacher.availabilities
                ? convertFromTimeSlots(teacher.availabilities)
                : DEFAULT_TEACHER_FORM.availability,
        });
        setIsFormOpen(true);
    }, []);

    const handleFormChange = useCallback(
        (field: keyof TeacherFormData, value: any) => {
            setFormData((prev) => ({ ...prev, [field]: value }));
        },
        []
    );

    const handleSave = useCallback(async () => {
        if (!formData.fullName.trim()) {
            toast.error(t('teachers.name_required'));
            return;
        }

        setIsSaving(true);
        try {
            if (editingId) {
                // Update
                const deletedSubjects = originalSubjectIds.filter(
                    (id) => !formData.selectedSubjectIds.includes(id)
                );
                const updateData: TeacherUpdateRequest = {
                    fullName: formData.fullName.trim(),
                    shortName: formData.shortName.trim() || formData.fullName.substring(0, 8),
                    subjects: formData.selectedSubjectIds,
                    deletedSubjects,
                    availabilities: convertToTimeSlots(formData.availability),
                };
                await TeacherService.update(editingId, updateData);
                toast.success(t('teachers.updated'));
            } else {
                // Create
                const createData: TeacherRequest = {
                    fullName: formData.fullName.trim(),
                    shortName: formData.shortName.trim() || formData.fullName.substring(0, 8),
                    subjects: formData.selectedSubjectIds,
                    availabilities: convertToTimeSlots(formData.availability),
                };
                await TeacherService.create(createData);
                toast.success(t('teachers.created'));
            }

            setIsFormOpen(false);
            setEditingId(null);
            fetchTeachers();
        } catch (error) {
            console.error('Error saving teacher:', error);
            toast.error(t('teachers.save_error'));
        } finally {
            setIsSaving(false);
        }
    }, [formData, editingId, originalSubjectIds, fetchTeachers, t]);

    const handleCancel = useCallback(() => {
        setIsFormOpen(false);
        setEditingId(null);
    }, []);

    // -------------------------------------------------------------------------
    // HANDLERS - Delete
    // -------------------------------------------------------------------------
    const handleDelete = useCallback((teacher: TeacherDisplayData) => {
        setDeleteTarget(teacher);
    }, []);

    const confirmDelete = useCallback(async () => {
        if (!deleteTarget) return;

        setIsDeleting(true);
        try {
            await TeacherService.delete(deleteTarget.id);
            toast.success(t('teachers.deleted'));
            setDeleteTarget(null);
            fetchTeachers();
        } catch (error) {
            console.error('Error deleting teacher:', error);
            toast.error(t('teachers.delete_error'));
        } finally {
            setIsDeleting(false);
        }
    }, [deleteTarget, fetchTeachers, t]);

    // -------------------------------------------------------------------------
    // HANDLERS - Other
    // -------------------------------------------------------------------------
    const handleViewAvailability = useCallback((teacherId: number) => {
        setExpandedAvailability((prev) => (prev === teacherId ? null : teacherId));
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
            label: t('teachers.import'),
            icon: Upload,
            onClick: () => toast.info('Import coming soon'),
            variant: 'outline',
        },
        {
            id: 'add',
            label: t('teachers.add_teacher'),
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
                title={t('teachers.title')}
                description={t('teachers.description')}
                actions={headerActions}
            />

            {/* Search */}
            <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={t('teachers.search_placeholder')}
                className="max-w-sm"
            />

            {/* Table */}
            <TeacherTable
                teachers={filteredTeachers}
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
            <TeacherFormDialog
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                formData={formData}
                onFormChange={handleFormChange}
                onSave={handleSave}
                onCancel={handleCancel}
                isEditing={editingId !== null}
                subjects={subjectOptions}
                periods={periods}
                loading={isSaving}
                loadingSubjects={isLoadingSubjects}
            />

            {/* Delete Confirmation */}
            <DeleteConfirmDialog
                open={deleteTarget !== null}
                onOpenChange={() => setDeleteTarget(null)}
                title={t('teachers.delete_confirm_title')}
                description={t('teachers.delete_confirm_description')}
                itemName={deleteTarget?.fullName}
                onConfirm={confirmDelete}
                loading={isDeleting}
            />
        </div>
    );
}
