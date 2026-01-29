/**
 * ClassesPage (Refactored)
 * 
 * This is the refactored version of ClassesPage.
 * Original: 2578 lines → Refactored: ~400 lines
 * 
 * Key improvements:
 * - Uses custom hooks for data fetching
 * - Uses decomposed components
 * - Proper TypeScript types
 * - Clean separation of concerns
 * 
 * @module components/pages/ClassesPage
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TooltipProvider } from '@/components/ui/tooltip';

// Icons
import {
    Plus,
    Search,
    Upload,
    Download,
    Layers,
    ChevronLeft,
    ChevronRight,
    Loader2,
} from 'lucide-react';

// Custom Hooks
import { useClasses, useTeachers, useRooms } from '@/hooks';

// Decomposed Components
import {
    ClassTable,
    ClassFormDialog,
    ClassBatchCreateDialog,
    ClassDisplayData,
    ClassFormData,
    TeacherSimple,
    RoomSimple,
    GradeQuantities,
    BatchMode,
    CharacterSet,
    GeneratedClassPreview,
    DEFAULT_FORM_DATA,
    LATIN_LETTERS,
    CYRILLIC_LETTERS,
} from '@/components/classes';

// Utils
import { convertToTimeSlots, convertFromTimeSlots, Availability } from '@/utils/timeSlots';
import { generateClassShortName } from '@/utils/formatters';

// API
import { apiCall, getApiUrl } from '@/lib/api';
import { organizationApi } from '@/api/organizationApi';

// ============================================================================
// TYPES
// ============================================================================

interface ClassesPageProps {
    onNavigate?: (page: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ClassesPage({ onNavigate: _onNavigate }: ClassesPageProps) {
    const { t } = useTranslation();

    // -------------------------------------------------------------------------
    // CUSTOM HOOKS - Data Fetching
    // -------------------------------------------------------------------------
    const {
        classes: rawClasses,
        loading: classesLoading,
        fetchClasses,
        pagination,
    } = useClasses({ autoFetch: true });

    const { teachers: rawTeachers } = useTeachers({ simplified: true });
    const { rooms: rawRooms } = useRooms({ simplified: true });

    // -------------------------------------------------------------------------
    // LOCAL STATE
    // -------------------------------------------------------------------------
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Search
    const [searchQuery, setSearchQuery] = useState('');

    // Periods (from organization settings)
    const [periods, setPeriods] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);

    // Form Dialog
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingClassId, setEditingClassId] = useState<number | null>(null);
    const [formData, setFormData] = useState<ClassFormData>(DEFAULT_FORM_DATA);
    const [formLoading, setFormLoading] = useState(false);

    // Batch Create Dialog
    const [isBatchOpen, setIsBatchOpen] = useState(false);
    const [batchMode, setBatchMode] = useState<BatchMode>('simple');
    const [characterSet, setCharacterSet] = useState<CharacterSet>('latin');
    const [gradeQuantities, setGradeQuantities] = useState<GradeQuantities>({
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0
    });
    const [generatedClasses, setGeneratedClasses] = useState<GeneratedClassPreview[]>([]);
    const [batchLoading, setBatchLoading] = useState(false);

    // Delete Dialog
    const [deleteDialog, setDeleteDialog] = useState<ClassDisplayData | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Expanded Availability
    const [expandedAvailability, setExpandedAvailability] = useState<number | null>(null);

    // -------------------------------------------------------------------------
    // FETCH ORGANIZATION SETTINGS
    // -------------------------------------------------------------------------
    useEffect(() => {
        const fetchOrgSettings = async () => {
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
        };
        fetchOrgSettings();
    }, []);

    // -------------------------------------------------------------------------
    // COMPUTED VALUES
    // -------------------------------------------------------------------------
    const teachers: TeacherSimple[] = useMemo(() => {
        return rawTeachers.map((t: any) => ({
            id: t.id,
            name: t.name || t.fullName || 'Unknown',
            fullName: t.fullName,
        }));
    }, [rawTeachers]);

    const rooms: RoomSimple[] = useMemo(() => {
        return rawRooms.map((r: any) => ({
            id: r.id,
            name: r.name || 'Unknown',
            shortName: r.shortName,
        }));
    }, [rawRooms]);

    const classes: ClassDisplayData[] = useMemo(() => {
        return rawClasses.map((cls: any) => ({
            id: cls.id,
            name: cls.name || 'Unnamed',
            shortName: cls.shortName || '',
            isActive: cls.isActive ?? true,
            classTeacher: cls.classTeacherId || cls.teacher?.id?.toString() || '',
            roomIds: cls.roomIds || cls.rooms?.map((r: any) => String(r.id)) || [],
            isGrouped: cls.isGrouped ?? false,
            groups: cls.groups || [],
            availability: cls.availability || convertFromTimeSlots(cls.availabilities),
        }));
    }, [rawClasses]);

    const filteredClasses = useMemo(() => {
        if (!searchQuery.trim()) return classes;
        const query = searchQuery.toLowerCase();
        return classes.filter(
            (cls) =>
                cls.name.toLowerCase().includes(query) ||
                cls.shortName.toLowerCase().includes(query)
        );
    }, [classes, searchQuery]);

    const totalPages = pagination?.totalPages || Math.ceil(filteredClasses.length / itemsPerPage);
    const totalElements = pagination?.totalElements || filteredClasses.length;

    // -------------------------------------------------------------------------
    // HANDLERS - Form
    // -------------------------------------------------------------------------
    const handleAddClass = useCallback(() => {
        setEditingClassId(null);
        setFormData({
            ...DEFAULT_FORM_DATA,
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

    const handleEdit = useCallback((classItem: ClassDisplayData) => {
        setEditingClassId(classItem.id);
        setFormData({
            name: classItem.name,
            shortName: classItem.shortName,
            classTeacher: classItem.classTeacher,
            roomIds: classItem.roomIds,
            isGrouped: classItem.isGrouped,
            groups: classItem.groups.map(g => ({ ...g, isNew: false })),
            originalGroups: classItem.groups.map(g => ({ ...g })),
            availability: classItem.availability,
        });
        setIsFormOpen(true);
    }, []);

    const handleFormChange = useCallback((field: keyof ClassFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleSaveForm = useCallback(async () => {
        if (!formData.name.trim()) {
            toast.error(t('classes.nameRequired'));
            return;
        }

        setFormLoading(true);
        try {
            const isEdit = editingClassId !== null;

            const baseData = {
                name: formData.name.trim(),
                shortName: formData.shortName.trim() || generateClassShortName(formData.name.trim()),
                availabilities: convertToTimeSlots(formData.availability),
                teacherId: formData.classTeacher ? parseInt(formData.classTeacher, 10) : null,
                rooms: formData.roomIds.map(id => parseInt(id, 10)),
                groups: formData.groups.map(g => ({ name: g.name })),
            };

            let requestData: any = baseData;

            if (isEdit) {
                const newGroups = formData.groups.filter(g => !g.id || g.isNew).map(g => ({ name: g.name }));
                const updatedGroups = formData.groups.filter(g => g.id && !g.isNew).map(g => ({ id: g.id, name: g.name }));

                requestData = {
                    ...baseData,
                    deletedRooms: [],
                    newGroups,
                    updatedGroups,
                    deletedGroupIds: [],
                };
            }

            const url = isEdit ? `${getApiUrl('CLASSES')}/${editingClassId}` : getApiUrl('CLASSES');
            const method = isEdit ? 'PUT' : 'POST';

            const response = await apiCall(url, {
                method,
                body: JSON.stringify(requestData),
            });

            if (response.error) {
                throw new Error(`Failed to ${isEdit ? 'update' : 'create'} class`);
            }

            toast.success(t(isEdit ? 'classes.updated' : 'classes.created'));
            setIsFormOpen(false);
            setEditingClassId(null);
            fetchClasses();
        } catch (error) {
            console.error('Error saving class:', error);
            toast.error(t('classes.saveFailed'));
        } finally {
            setFormLoading(false);
        }
    }, [formData, editingClassId, fetchClasses, t]);

    const handleCancelForm = useCallback(() => {
        setIsFormOpen(false);
        setEditingClassId(null);
    }, []);

    // -------------------------------------------------------------------------
    // HANDLERS - Delete
    // -------------------------------------------------------------------------
    const handleDelete = useCallback((classItem: ClassDisplayData) => {
        setDeleteDialog(classItem);
    }, []);

    const confirmDelete = useCallback(async () => {
        if (!deleteDialog) return;

        setDeleteLoading(true);
        try {
            const response = await apiCall(`${getApiUrl('CLASSES')}/${deleteDialog.id}`, {
                method: 'DELETE',
            });

            if (response.error) {
                throw new Error('Failed to delete class');
            }

            toast.success(t('classes.deleted'));
            setDeleteDialog(null);
            fetchClasses();
        } catch (error) {
            console.error('Error deleting class:', error);
            toast.error(t('classes.deleteFailed'));
        } finally {
            setDeleteLoading(false);
        }
    }, [deleteDialog, fetchClasses, t]);

    // -------------------------------------------------------------------------
    // HANDLERS - Batch Create
    // -------------------------------------------------------------------------
    const handleGradeQuantityChange = useCallback((grade: number, quantity: number) => {
        setGradeQuantities(prev => ({ ...prev, [grade]: quantity }));
    }, []);

    const handleGenerateClasses = useCallback(() => {
        const letters = characterSet === 'latin' ? LATIN_LETTERS : CYRILLIC_LETTERS;
        const generated: GeneratedClassPreview[] = [];
        let id = 1;

        Object.entries(gradeQuantities).forEach(([grade, quantity]) => {
            for (let i = 0; i < quantity; i++) {
                const letter = letters[i] || String(i + 1);
                generated.push({
                    id: id++,
                    name: `${grade}${letter}`,
                    shortName: `${grade}${letter}`,
                });
            }
        });

        setGeneratedClasses(generated);
    }, [gradeQuantities, characterSet]);

    const handleSaveBatch = useCallback(async () => {
        if (generatedClasses.length === 0) return;

        setBatchLoading(true);
        try {
            // Create classes one by one (or use batch API if available)
            for (const cls of generatedClasses) {
                await apiCall(getApiUrl('CLASSES'), {
                    method: 'POST',
                    body: JSON.stringify({
                        name: cls.name,
                        shortName: cls.shortName,
                        availabilities: convertToTimeSlots({
                            monday: periods,
                            tuesday: periods,
                            wednesday: periods,
                            thursday: periods,
                            friday: periods,
                            saturday: [],
                            sunday: [],
                        }),
                        rooms: [],
                        groups: [],
                    }),
                });
            }

            toast.success(t('classes.batchCreated', { count: generatedClasses.length }));
            setIsBatchOpen(false);
            setGeneratedClasses([]);
            setGradeQuantities({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0 });
            fetchClasses();
        } catch (error) {
            console.error('Error creating batch:', error);
            toast.error(t('classes.batchFailed'));
        } finally {
            setBatchLoading(false);
        }
    }, [generatedClasses, periods, fetchClasses, t]);

    const handleCancelBatch = useCallback(() => {
        setIsBatchOpen(false);
        setGeneratedClasses([]);
    }, []);

    // -------------------------------------------------------------------------
    // HANDLERS - Availability
    // -------------------------------------------------------------------------
    const handleViewAvailability = useCallback((classId: number) => {
        setExpandedAvailability(prev => prev === classId ? null : classId);
    }, []);

    // -------------------------------------------------------------------------
    // HANDLERS - Pagination
    // -------------------------------------------------------------------------
    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
    }, []);

    // -------------------------------------------------------------------------
    // RENDER
    // -------------------------------------------------------------------------
    return (
        <TooltipProvider>
            <div className="container mx-auto py-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{t('classes.title')}</h1>
                        <p className="text-sm text-gray-500">{t('classes.subtitle')}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsBatchOpen(true)}>
                            <Layers className="h-4 w-4 mr-2" />
                            {t('classes.batchCreate')}
                        </Button>
                        <Button onClick={handleAddClass}>
                            <Plus className="h-4 w-4 mr-2" />
                            {t('classes.addNew')}
                        </Button>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder={t('classes.searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={String(itemsPerPage)} onValueChange={(v) => setItemsPerPage(Number(v))}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5">5 / page</SelectItem>
                            <SelectItem value="10">10 / page</SelectItem>
                            <SelectItem value="25">25 / page</SelectItem>
                            <SelectItem value="50">50 / page</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <ClassTable
                    classes={filteredClasses}
                    teachers={teachers}
                    rooms={rooms}
                    loading={classesLoading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onViewAvailability={handleViewAvailability}
                    expandedAvailability={expandedAvailability}
                    periods={periods}
                />

                {/* Pagination */}
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        {t('common.showing')} {filteredClasses.length} {t('common.of')} {totalElements} {t('classes.classes')}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage <= 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm">
                            {t('common.page')} {currentPage} {t('common.of')} {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Form Dialog */}
                <ClassFormDialog
                    open={isFormOpen}
                    onOpenChange={setIsFormOpen}
                    formData={formData}
                    onFormChange={handleFormChange}
                    onSave={handleSaveForm}
                    onCancel={handleCancelForm}
                    isEditing={editingClassId !== null}
                    teachers={teachers}
                    rooms={rooms}
                    periods={periods}
                    loading={formLoading}
                />

                {/* Batch Create Dialog */}
                <ClassBatchCreateDialog
                    open={isBatchOpen}
                    onOpenChange={setIsBatchOpen}
                    gradeList={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]}
                    gradeQuantities={gradeQuantities}
                    onGradeQuantityChange={handleGradeQuantityChange}
                    characterSet={characterSet}
                    onCharacterSetChange={setCharacterSet}
                    mode={batchMode}
                    onModeChange={setBatchMode}
                    generatedClasses={generatedClasses}
                    onGenerate={handleGenerateClasses}
                    onSave={handleSaveBatch}
                    onCancel={handleCancelBatch}
                    loading={batchLoading}
                />

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={deleteDialog !== null} onOpenChange={() => setDeleteDialog(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t('classes.confirmDelete')}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t('classes.deleteWarning', { name: deleteDialog?.name })}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={deleteLoading}>
                                {t('common.cancel')}
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={confirmDelete}
                                disabled={deleteLoading}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                {deleteLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                {t('common.delete')}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </TooltipProvider>
    );
}
