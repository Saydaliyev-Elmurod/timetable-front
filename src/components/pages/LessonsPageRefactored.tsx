/**
 * LessonsPage (Refactored)
 * 
 * Original: 1577 lines → Refactored: ~450 lines
 * 
 * @module components/pages/LessonsPageRefactored
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

// UI Components
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    Plus,
    Download,
    Upload,
    Users,
    GraduationCap,
    BookOpen,
    MapPin,
    ChevronsDown,
    ChevronsUp,
    Zap,
} from 'lucide-react';

// Lessons Components
import {
    LessonGroupCard,
    EntityEditDialog,
    OptimizeDialog,
    useEntityEditor,
    ViewType,
    LessonsState,
    InternalLesson,
    EntityType,
    OptimizeConfig,
    DEFAULT_OPTIMIZE_CONFIG,
} from '@/components/lessons';

// Existing AddLessonModal
import AddLessonModal from '../AddLessonModal';

// API & Services
import { LessonService } from '@/lib/lessons';
import { TeacherService } from '@/lib/teachers';
import { ClassService } from '@/lib/classes';
import { apiCall } from '@/lib/api';

// ============================================================================
// COMPONENT
// ============================================================================

export default function LessonsPage() {
    const { t } = useTranslation();

    // -------------------------------------------------------------------------
    // STATE
    // -------------------------------------------------------------------------
    const [lessons, setLessons] = useState<LessonsState>({
        classes: [],
        teachers: [],
        subjects: [],
        rooms: [],
    });
    const [isLoading, setIsLoading] = useState(false);
    const [totalElements, setTotalElements] = useState(0);

    // Expand state
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
    const [allExpanded, setAllExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState<ViewType>('classes');

    // Lesson modal
    const [editingLesson, setEditingLesson] = useState<any | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Optimize dialog
    const [optimizeOpen, setOptimizeOpen] = useState(false);
    const [optimizeConfig, setOptimizeConfig] = useState<OptimizeConfig>(DEFAULT_OPTIMIZE_CONFIG);
    const [isOptimizing, setIsOptimizing] = useState(false);

    // Prerequisites
    const [allTeachers, setAllTeachers] = useState<any[]>([]);
    const [allClasses, setAllClasses] = useState<any[]>([]);

    // Entity editor hook
    const entityEditor = useEntityEditor(() => fetchLessons());

    // -------------------------------------------------------------------------
    // DATA FETCHING
    // -------------------------------------------------------------------------
    const fetchLessons = useCallback(async () => {
        try {
            setIsLoading(true);
            const metadata = await LessonService.getAllWithMetadata();

            // Create lookup maps
            const classesById = new Map(metadata.classes.map((c: any) => [c.id, c]));
            const teachersById = new Map(metadata.teachers.map((t: any) => [t.id, t]));
            const subjectsById = new Map(metadata.subjects.map((s: any) => [s.id, s]));
            const roomsById = new Map(metadata.rooms.map((r: any) => [r.id, r]));

            // Convert to internal format
            const flat: InternalLesson[] = metadata.lessons.map((lesson: any) => {
                const classEntity = classesById.get(lesson.classId);
                const teacherEntity = teachersById.get(lesson.teacherId);
                const subjectEntity = subjectsById.get(lesson.subjectId);
                const roomEntities = (lesson.roomIds || [])
                    .map((id: number) => roomsById.get(id))
                    .filter(Boolean);

                return {
                    id: lesson.id,
                    raw: {
                        ...lesson,
                        class: classEntity,
                        teacher: teacherEntity,
                        subject: subjectEntity,
                        rooms: roomEntities,
                    },
                    subject: subjectEntity?.name || t('lessons.unknown_subject'),
                    teacher: teacherEntity?.fullName || t('lessons.unknown_teacher'),
                    className: classEntity?.shortName || classEntity?.name || t('lessons.unknown_class'),
                    classId: lesson.classId,
                    teacherId: lesson.teacherId,
                    subjectId: lesson.subjectId,
                    day: lesson.dayOfWeek,
                    startTime: `${lesson.hour}:00`,
                    endTime: `${lesson.hour + 1}:00`,
                    period: lesson.period,
                    frequency: `${lesson.lessonCount}x`,
                    rooms: roomEntities,
                    roomNames: roomEntities.map((r: any) => r.name).join(', ') || t('lessons.no_room'),
                    duration: '45 min',
                };
            });

            // Group by entity
            const grouped = groupLessons(flat, t);
            setLessons(grouped);
            setTotalElements(metadata.lessons.length);
        } catch (error) {
            console.error('Error fetching lessons:', error);
            toast.error(t('lessons.failed_to_load_lessons'));
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    // Load prerequisites
    useEffect(() => {
        const fetchPrereqs = async () => {
            try {
                const [teachers, classes] = await Promise.all([
                    TeacherService.getAll(),
                    ClassService.getAll(),
                ]);
                setAllTeachers(teachers);
                setAllClasses(classes);
            } catch (err) {
                toast.error('Failed to load required data for creating lessons.');
                console.error('Error fetching lesson prereqs', err);
            }
        };
        fetchPrereqs();
    }, []);

    useEffect(() => {
        fetchLessons();
    }, [fetchLessons]);

    // -------------------------------------------------------------------------
    // HANDLERS
    // -------------------------------------------------------------------------
    const toggleCardExpansion = useCallback((id: string) => {
        setExpandedCards((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const toggleExpandAll = useCallback(() => {
        setAllExpanded((prev) => {
            const next = !prev;
            if (!next) {
                setExpandedCards(new Set());
            }
            return next;
        });
    }, []);

    const handleAdd = useCallback((data?: { className?: string; teacherName?: string; subjectId?: string }) => {
        const prefill: any = {};
        if (data?.className) prefill.lessonClass = data.className;
        if (data?.teacherName) prefill.teacher = data.teacherName;
        if (data?.subjectId) prefill.subject = data.subjectId;
        setEditingLesson(prefill);
        setIsDialogOpen(true);
    }, []);

    const handleEdit = useCallback((lesson: InternalLesson) => {
        setEditingLesson(lesson);
        setIsDialogOpen(true);
    }, []);

    const handleDelete = useCallback(async (id: number) => {
        try {
            await LessonService.delete(id);
            await fetchLessons();
            toast.success(t('lessons.lesson_deleted_successfully'));
        } catch (error) {
            console.error('Failed to delete lesson:', error);
            toast.error(t('lessons.failed_to_delete_lesson'));
        }
    }, [fetchLessons, t]);

    const handleEditEntity = useCallback((type: EntityType, id: number) => {
        entityEditor.openEditor(type, id);
    }, [entityEditor]);

    const handleModalSubmit = useCallback(async (lessonData: any) => {
        try {
            // Process lesson data (keeping original logic)
            let subjectId = lessonData.subjectId ?? parseInt(lessonData.subject, 10);
            let teacherId = lessonData.teacherId ?? (
                typeof lessonData.selectedTeacher === 'number'
                    ? lessonData.selectedTeacher
                    : parseInt(lessonData.selectedTeacher, 10)
            );

            // Validate
            if (isNaN(subjectId) || subjectId === 0) {
                if (!lessonData.groups || lessonData.groups.length === 0) {
                    toast.error(t('lessons.invalid_subject'));
                    return;
                }
            }

            const teacher = allTeachers.find((t: any) => t.id === teacherId);
            if (!teacher && !teacherId && typeof lessonData.selectedTeacher === 'string') {
                const tByName = allTeachers.find((t: any) => t.fullName === lessonData.selectedTeacher);
                if (tByName) {
                    teacherId = tByName.id;
                } else if (!lessonData.groups) {
                    toast.error(t('lessons.teacher_not_found'));
                    return;
                }
            }

            const classIds = lessonData.classId || lessonData.selectedClasses;
            if (!classIds || !Array.isArray(classIds) || classIds.length === 0) {
                toast.error(t('lessons.class_not_found'));
                return;
            }

            const scheduleTypeToFrequency: Record<string, string> = {
                'weekly': 'WEEKLY',
                'bi-weekly': 'BI_WEEKLY',
                'tri-weekly': 'TRI_WEEKLY',
            };

            const lessonRequest = {
                subjectId,
                teacherId,
                classId: classIds,
                lessonCount: lessonData.lessonCount || lessonData.lessonsPerWeek,
                roomIds: lessonData.roomIds || [],
                frequency: scheduleTypeToFrequency[lessonData.scheduleType] || lessonData.frequency || 'WEEKLY',
                dayOfWeek: lessonData.dayOfWeek || null,
                hour: lessonData.hour || null,
                period: lessonData.period || 1,
                groups: lessonData.groups,
            };

            if (editingLesson?.id) {
                await LessonService.update(editingLesson.id, lessonRequest as any);
                toast.success(t('lessons.lesson_updated_successfully'));
            } else {
                await LessonService.create(lessonRequest as any);
                toast.success(t('lessons.lesson_created_successfully'));
            }

            setIsDialogOpen(false);
            setEditingLesson(null);
            fetchLessons();
        } catch (error) {
            console.error('Failed to save lesson:', error);
            toast.error(t('lessons.failed_to_create_lesson'));
        }
    }, [allTeachers, editingLesson, fetchLessons, t]);

    const handleOptimizeConfigChange = useCallback((field: keyof OptimizeConfig, value: any) => {
        setOptimizeConfig((prev) => ({ ...prev, [field]: value }));
    }, []);

    const handleOptimizeSubmit = useCallback(async () => {
        if (!optimizeConfig.timetableId) {
            toast.error(t('lessons.optimize_no_timetable_id'));
            return;
        }

        const timetableIdNum = parseInt(optimizeConfig.timetableId, 10);
        if (isNaN(timetableIdNum)) {
            toast.error(t('lessons.optimize_invalid_timetable_id'));
            return;
        }

        const body = {
            applySoftConstraint: optimizeConfig.applySoftConstraint,
            applyUnScheduledLessons: optimizeConfig.applyUnScheduledLessons,
            applyUnScheduledLessonsPenalty: optimizeConfig.applyUnScheduledLessonsPenalty,
            applyContinuityPenaltyTeacher: optimizeConfig.applyContinuityPenaltyTeacher,
            applyContinuityPenaltyTeacherPenalty: optimizeConfig.applyContinuityPenaltyTeacherPenalty,
            applyContinuityPenaltyClass: optimizeConfig.applyContinuityPenaltyClass,
            applyContinuityPenaltyClassPenalty: optimizeConfig.applyContinuityPenaltyClassPenalty,
            applyBalancedLoad: optimizeConfig.applyBalancedLoad,
            applyBalancedLoadPenalty: optimizeConfig.applyBalancedLoadPenalty,
            applyDailySubjectDistribution: optimizeConfig.applyDailySubjectDistribution,
            applyDailySubjectDistributionPenalty: optimizeConfig.applyDailySubjectDistributionPenalty,
        };

        setIsOptimizing(true);
        try {
            const res = await apiCall<any>(
                `http://localhost:8080/api/timetable/v1/timetable/optimize/${timetableIdNum}`,
                {
                    method: 'POST',
                    body: JSON.stringify(body),
                }
            );

            if (res?.error) {
                console.error('Optimize failed', res);
                toast.error(t('lessons.optimize_failed'));
            } else {
                toast.success(t('lessons.optimize_started'));
                fetchLessons();
            }
        } catch (err) {
            console.error('Optimize request error', err);
            toast.error(t('lessons.optimize_failed'));
        } finally {
            setIsOptimizing(false);
            setOptimizeOpen(false);
        }
    }, [optimizeConfig, fetchLessons, t]);

    // -------------------------------------------------------------------------
    // RENDER
    // -------------------------------------------------------------------------
    const currentLessons = lessons[activeTab] || [];

    return (
        <div className="flex gap-6">
            {/* Main Content */}
            <div className="flex-1 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2>{t('lessons.title')}</h2>
                        <p className="text-muted-foreground">{t('lessons.description')}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={toggleExpandAll}
                            className="flex items-center gap-2"
                        >
                            {allExpanded ? (
                                <>
                                    <ChevronsUp className="h-4 w-4" />
                                    {t('lessons.collapse_all')}
                                </>
                            ) : (
                                <>
                                    <ChevronsDown className="h-4 w-4" />
                                    {t('lessons.expand_all')}
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ViewType)} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="classes" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {t('lessons.classes')}
                        </TabsTrigger>
                        <TabsTrigger value="teachers" className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4" />
                            {t('lessons.teachers')}
                        </TabsTrigger>
                        <TabsTrigger value="subjects" className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            {t('lessons.subjects')}
                        </TabsTrigger>
                        <TabsTrigger value="rooms" className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {t('lessons.rooms')}
                        </TabsTrigger>
                    </TabsList>

                    {(['classes', 'teachers', 'subjects', 'rooms'] as ViewType[]).map((tab) => (
                        <TabsContent key={tab} value={tab} className="space-y-4 mt-6">
                            {lessons[tab].length === 0 && !isLoading && (
                                <div className="text-muted-foreground">{t('lessons.no_lessons_found')}</div>
                            )}
                            {lessons[tab].map((item) => (
                                <LessonGroupCard
                                    key={item.id}
                                    item={item}
                                    type={tab}
                                    isExpanded={expandedCards.has(item.id)}
                                    onToggleExpand={toggleCardExpansion}
                                    onAddLesson={handleAdd}
                                    onEditLesson={handleEdit}
                                    onDeleteLesson={handleDelete}
                                    onEditEntity={handleEditEntity}
                                />
                            ))}
                        </TabsContent>
                    ))}
                </Tabs>

                {/* Global Actions */}
                <div className="flex justify-between items-center pt-6 border-t">
                    <div className="flex gap-2">
                        <Button variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            {t('lessons.export_csv')}
                        </Button>
                        <Button variant="outline">
                            <Upload className="h-4 w-4 mr-2" />
                            {t('lessons.bulk_import')}
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setOptimizeOpen(true)}
                            variant="secondary"
                            size="sm"
                            className="flex items-center gap-2"
                        >
                            <Zap className="h-4 w-4" />
                            {t('lessons.optimize')}
                        </Button>
                        <Button onClick={() => handleAdd()}>
                            <Plus className="mr-2 h-4 w-4" />
                            {t('lessons.add_lesson')}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Optimize Dialog */}
            <OptimizeDialog
                open={optimizeOpen}
                onOpenChange={setOptimizeOpen}
                config={optimizeConfig}
                onConfigChange={handleOptimizeConfigChange}
                onSubmit={handleOptimizeSubmit}
                isOptimizing={isOptimizing}
            />

            {/* Entity Edit Dialog */}
            <EntityEditDialog
                open={entityEditor.open}
                onOpenChange={(open) => !open && entityEditor.closeEditor()}
                type={entityEditor.type}
                data={entityEditor.data}
                loading={entityEditor.loading}
                saving={entityEditor.saving}
                onUpdateField={entityEditor.updateField}
                onSave={entityEditor.saveEntity}
                teachers={entityEditor.teachers}
                subjects={entityEditor.subjects}
                rooms={entityEditor.rooms}
                onToggleAvailability={entityEditor.toggleAvailability}
                onToggleDay={entityEditor.toggleDay}
                onTogglePeriod={entityEditor.togglePeriod}
                onSelectAllAvailability={entityEditor.selectAllAvailability}
                onClearAllAvailability={entityEditor.clearAllAvailability}
                onToggleSubject={entityEditor.toggleSubject}
                onRemoveSubject={entityEditor.removeSubject}
                onToggleRoom={entityEditor.toggleRoom}
            />

            {/* Add/Edit Lesson Modal */}
            <AddLessonModal
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSubmit={handleModalSubmit}
                editingLesson={editingLesson}
            />
        </div>
    );
}

// ============================================================================
// HELPER: Group lessons by entity
// ============================================================================

function groupLessons(flat: InternalLesson[], t: (key: string) => string): LessonsState {
    const classesMap = new Map<string | number, any>();
    const teachersMap = new Map<string | number, any>();
    const subjectsMap = new Map<string | number, any>();
    const roomsMap = new Map<string | number, any>();

    flat.forEach((f) => {
        // Classes
        const classKey = f.classId ?? f.className ?? `class-${f.id}`;
        if (!classesMap.has(classKey)) {
            classesMap.set(classKey, {
                id: String(classKey),
                name: f.className,
                totalLessons: 0,
                totalPeriods: 0,
                teachers: 0,
                subjects: 0,
                lessons: [],
                _teacherIds: new Set<number | string>(),
                _subjectIds: new Set<number | string>(),
            });
        }
        const c = classesMap.get(classKey);
        c.lessons.push(f);
        c.totalLessons += 1;
        c.totalPeriods += (f.raw?.lessonCount && Number(f.raw.lessonCount)) ? Number(f.raw.lessonCount) : 1;
        if (f.teacherId) c._teacherIds.add(f.teacherId);
        if (f.subjectId) c._subjectIds.add(f.subjectId);

        // Teachers
        const teacherKey = f.teacherId ?? f.teacher ?? `teacher-${f.id}`;
        if (!teachersMap.has(teacherKey)) {
            teachersMap.set(teacherKey, {
                id: String(teacherKey),
                name: f.teacher,
                totalLessons: 0,
                totalPeriods: 0,
                classes: 0,
                lessons: [],
                _classIds: new Set<number | string>(),
            });
        }
        const tr = teachersMap.get(teacherKey);
        tr.lessons.push(f);
        tr.totalLessons += 1;
        tr.totalPeriods += (f.raw?.lessonCount && Number(f.raw.lessonCount)) ? Number(f.raw.lessonCount) : 1;
        if (f.classId) tr._classIds.add(f.classId);

        // Subjects
        const subjectKey = f.subjectId ?? f.subject ?? `subject-${f.id}`;
        if (!subjectsMap.has(subjectKey)) {
            subjectsMap.set(subjectKey, {
                id: String(subjectKey),
                name: f.subject,
                totalLessons: 0,
                teachers: 0,
                classes: 0,
                lessons: [],
                _classIds: new Set<number | string>(),
                _teacherIds: new Set<number | string>(),
            });
        }
        const s = subjectsMap.get(subjectKey);
        s.lessons.push(f);
        s.totalLessons += 1;
        if (f.classId) s._classIds.add(f.classId);
        if (f.teacherId) s._teacherIds.add(f.teacherId);

        // Rooms
        (f.rooms || []).forEach((r: any) => {
            const roomKey = r.id ?? r.name ?? `room-${f.id}`;
            if (!roomsMap.has(roomKey)) {
                roomsMap.set(roomKey, {
                    id: String(roomKey),
                    name: r.name || t('lessons.unknown_room'),
                    totalLessons: 0,
                    totalPeriods: 0,
                    teachers: 0,
                    classes: 0,
                    lessons: [],
                    _classIds: new Set<number | string>(),
                    _teacherIds: new Set<number | string>(),
                });
            }
            const rm = roomsMap.get(roomKey);
            rm.lessons.push(f);
            rm.totalLessons += 1;
            if (f.classId) rm._classIds.add(f.classId);
            if (f.teacherId) rm._teacherIds.add(f.teacherId);
        });
    });

    const finalize = (arr: any[]) =>
        arr.map((it) => {
            if (it._teacherIds) {
                it.teachers = it._teacherIds.size;
                delete it._teacherIds;
            }
            if (it._subjectIds) {
                it.subjects = it._subjectIds.size;
                delete it._subjectIds;
            }
            if (it._classIds) {
                it.classes = it._classIds.size;
                delete it._classIds;
            }
            return it;
        });

    return {
        classes: finalize(Array.from(classesMap.values())),
        teachers: finalize(Array.from(teachersMap.values())),
        subjects: finalize(Array.from(subjectsMap.values())),
        rooms: finalize(Array.from(roomsMap.values())),
    };
}

// Helper for teacher validation
function transactionalTeacherCheck(_id: number): boolean {
    return false;
}
