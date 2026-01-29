/**
 * LessonGroupCard Component
 * 
 * Displays a collapsible card for a group of lessons (by class, teacher, subject, or room)
 * 
 * @module components/lessons/LessonGroupCard
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Collapsible,
    CollapsibleTrigger,
    CollapsibleContent,
} from '@/components/ui/collapsible';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
    Plus,
    Download,
    Upload,
    Pencil,
    Trash2,
    BookOpen,
    Clock,
    GraduationCap,
    FileText,
    Users,
    ChevronDown,
    ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { LessonGroupCardProps, InternalLesson, ViewType, EntityType } from './types';

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

interface CardStatsProps {
    type: ViewType;
    totalLessons: number;
    totalPeriods?: number;
    teachers?: number;
    subjects?: number;
    classes?: number;
}

function CardStats({ type, totalLessons, totalPeriods = 0, teachers = 0, subjects = 0, classes = 0 }: CardStatsProps) {
    const { t } = useTranslation();

    if (type === 'classes') {
        return (
            <>
                <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {t('lessons.lessons_count').replace('{{count}}', String(totalLessons))}
                </span>
                <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {t('lessons.total_periods').replace('{{count}}', String(totalPeriods))}
                </span>
                <span className="flex items-center gap-1">
                    <GraduationCap className="h-4 w-4" />
                    {t('lessons.teachers_count').replace('{{count}}', String(teachers))}
                </span>
                <span className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {t('lessons.subjects_count').replace('{{count}}', String(subjects))}
                </span>
            </>
        );
    }

    if (type === 'teachers') {
        return (
            <>
                <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {t('lessons.classes_count').replace('{{count}}', String(classes))}
                </span>
                <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {t('lessons.lessons_count').replace('{{count}}', String(totalLessons))}
                </span>
                <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {t('lessons.total_periods').replace('{{count}}', String(totalPeriods))}
                </span>
            </>
        );
    }

    if (type === 'subjects') {
        return (
            <>
                <span className="flex items-center gap-1">
                    <GraduationCap className="h-4 w-4" />
                    {t('lessons.teachers_count').replace('{{count}}', String(teachers))}
                </span>
                <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {t('lessons.classes_count').replace('{{count}}', String(classes))}
                </span>
                <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {t('lessons.lessons_count').replace('{{count}}', String(totalLessons))}
                </span>
            </>
        );
    }

    // rooms
    return (
        <>
            <span className="flex items-center gap-1">
                <GraduationCap className="h-4 w-4" />
                {t('lessons.teachers_count').replace('{{count}}', String(teachers))}
            </span>
            <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {t('lessons.classes_count').replace('{{count}}', String(classes))}
            </span>
            <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {t('lessons.total_periods').replace('{{count}}', String(totalPeriods))}
            </span>
        </>
    );
}

// ============================================================================
// TABLE HEADERS
// ============================================================================

function TableHeaders({ type }: { type: ViewType }) {
    const { t } = useTranslation();

    if (type === 'classes') {
        return (
            <>
                <TableHead>{t('lessons.subject')}</TableHead>
                <TableHead>{t('lessons.teacher')}</TableHead>
                <TableHead>{t('lessons.frequency')}</TableHead>
                <TableHead>{t('lessons.room')}</TableHead>
                <TableHead>{t('lessons.duration')}</TableHead>
                <TableHead className="text-right">{t('lessons.actions')}</TableHead>
            </>
        );
    }

    if (type === 'teachers') {
        return (
            <>
                <TableHead>{t('lessons.class')}</TableHead>
                <TableHead>{t('lessons.subject')}</TableHead>
                <TableHead>{t('lessons.frequency')}</TableHead>
                <TableHead>{t('lessons.room')}</TableHead>
                <TableHead>{t('lessons.duration')}</TableHead>
                <TableHead className="text-right">{t('lessons.actions')}</TableHead>
            </>
        );
    }

    if (type === 'subjects') {
        return (
            <>
                <TableHead>{t('lessons.teacher')}</TableHead>
                <TableHead>{t('lessons.class')}</TableHead>
                <TableHead>{t('lessons.frequency')}</TableHead>
                <TableHead>{t('lessons.room')}</TableHead>
                <TableHead>{t('lessons.duration')}</TableHead>
                <TableHead className="text-right">{t('lessons.actions')}</TableHead>
            </>
        );
    }

    // rooms
    return (
        <>
            <TableHead>{t('lessons.class')}</TableHead>
            <TableHead>{t('lessons.subject')}</TableHead>
            <TableHead>{t('lessons.teacher')}</TableHead>
            <TableHead>{t('lessons.frequency')}</TableHead>
            <TableHead>{t('lessons.duration')}</TableHead>
            <TableHead className="text-right">{t('lessons.actions')}</TableHead>
        </>
    );
}

// ============================================================================
// TABLE ROW
// ============================================================================

interface LessonRowProps {
    lesson: InternalLesson;
    type: ViewType;
    onEdit: (lesson: InternalLesson) => void;
    onDelete: (id: number) => void;
}

function LessonRow({ lesson, type, onEdit, onDelete }: LessonRowProps) {
    const { t } = useTranslation();
    const frequency = lesson.frequency || (lesson.lessonCount ? `${lesson.lessonCount}x` : '-');
    const roomDisplay = lesson.roomNames ||
        (lesson.rooms?.length ? lesson.rooms.map((r: any) => r.name).join(', ') : t('lessons.no_room'));
    const duration = lesson.duration || `${lesson.raw?.duration || '45'} min`;

    return (
        <TableRow>
            {type === 'classes' && (
                <>
                    <TableCell>{lesson.subject || lesson.raw?.subject?.name || t('lessons.unknown_subject')}</TableCell>
                    <TableCell>{lesson.teacher || lesson.raw?.teacher?.fullName || t('lessons.unknown_teacher')}</TableCell>
                    <TableCell>{frequency}</TableCell>
                    <TableCell>{roomDisplay}</TableCell>
                    <TableCell>{duration}</TableCell>
                </>
            )}

            {type === 'teachers' && (
                <>
                    <TableCell>{lesson.className || lesson.raw?.class?.shortName || t('lessons.unknown_class')}</TableCell>
                    <TableCell>{lesson.subject || lesson.raw?.subject?.name || t('lessons.unknown_subject')}</TableCell>
                    <TableCell>{frequency}</TableCell>
                    <TableCell>{roomDisplay}</TableCell>
                    <TableCell>{duration}</TableCell>
                </>
            )}

            {type === 'subjects' && (
                <>
                    <TableCell>{lesson.teacher || lesson.raw?.teacher?.fullName || t('lessons.unknown_teacher')}</TableCell>
                    <TableCell>{lesson.className || lesson.raw?.class?.shortName || t('lessons.unknown_class')}</TableCell>
                    <TableCell>{frequency}</TableCell>
                    <TableCell>{roomDisplay}</TableCell>
                    <TableCell>{duration}</TableCell>
                </>
            )}

            {type === 'rooms' && (
                <>
                    <TableCell>{lesson.className || lesson.raw?.class?.shortName || t('lessons.unknown_class')}</TableCell>
                    <TableCell>{lesson.subject || lesson.raw?.subject?.name || t('lessons.unknown_subject')}</TableCell>
                    <TableCell>{lesson.teacher || lesson.raw?.teacher?.fullName || t('lessons.unknown_teacher')}</TableCell>
                    <TableCell>{frequency}</TableCell>
                    <TableCell>{duration}</TableCell>
                </>
            )}

            <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(lesson)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(lesson.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function LessonGroupCard({
    item,
    type,
    isExpanded,
    onToggleExpand,
    onAddLesson,
    onEditLesson,
    onDeleteLesson,
    onEditEntity,
}: LessonGroupCardProps) {
    const { t } = useTranslation();

    const getAddData = () => {
        if (type === 'classes') return { className: item.name };
        if (type === 'teachers') return { teacherName: item.name };
        if (type === 'subjects') return { subjectId: item.id };
        return undefined;
    };

    const getEntityType = (): EntityType | null => {
        if (type === 'classes') return 'class';
        if (type === 'teachers') return 'teacher';
        if (type === 'subjects') return 'subject';
        return null;
    };

    const handleEditEntity = (e: React.MouseEvent) => {
        e.stopPropagation();
        const entityType = getEntityType();
        const idNum = Number(item.id);

        if (!entityType) return;

        if (isNaN(idNum)) {
            toast.error(t(`lessons.cannot_edit_unknown_${entityType}`));
            return;
        }

        onEditEntity(entityType, idNum);
    };

    const canEditEntity = type !== 'rooms';
    const entityType = getEntityType();

    return (
        <Card className="mb-4">
            <Collapsible open={isExpanded} onOpenChange={() => onToggleExpand(item.id)}>
                <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    {isExpanded ? (
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <CardTitle className="text-lg">{item.name}</CardTitle>
                                </div>
                                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                    <CardStats
                                        type={type}
                                        totalLessons={item.totalLessons}
                                        totalPeriods={item.totalPeriods}
                                        teachers={item.teachers}
                                        subjects={item.subjects}
                                        classes={item.classes}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        onAddLesson(getAddData());
                                    }}
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    {t(`lessons.add_lesson_for_${type.slice(0, -1)}`)}
                                </Button>

                                {canEditEntity && entityType && (
                                    <Button size="sm" variant="outline" onClick={handleEditEntity}>
                                        <Pencil className="h-4 w-4 mr-1" />
                                        {t(`lessons.edit_${entityType}`)}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHeaders type={type} />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {item.lessons.map((lesson) => (
                                    <LessonRow
                                        key={lesson.id}
                                        lesson={lesson}
                                        type={type}
                                        onEdit={onEditLesson}
                                        onDelete={onDeleteLesson}
                                    />
                                ))}
                            </TableBody>
                        </Table>

                        <div className="flex justify-between items-center mt-4 pt-4 border-t">
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                    <Download className="h-4 w-4 mr-2" />
                                    {t('lessons.export_csv')}
                                </Button>
                                <Button variant="outline" size="sm">
                                    <Upload className="h-4 w-4 mr-2" />
                                    {t('lessons.bulk_import')}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}

export default LessonGroupCard;
