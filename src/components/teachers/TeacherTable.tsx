/**
 * TeacherTable Component
 * 
 * Teachers list table with actions
 * 
 * @module components/teachers/TeacherTable
 */

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit, Trash2, Copy, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { TeacherTableProps, TeacherDisplayData } from './types';
import { AvailabilityGrid } from '@/components/classes/AvailabilityGrid';
import { convertFromTimeSlots } from '@/utils/timeSlots';

// ============================================================================
// LOADING SKELETON
// ============================================================================

function TableSkeleton() {
    return (
        <>
            {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
            ))}
        </>
    );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TeacherTable({
    teachers,
    loading,
    onEdit,
    onDelete,
    onClone,
    onViewAvailability,
    expandedAvailability,
    periods,
    emptyMessage,
}: TeacherTableProps) {
    const { t } = useTranslation();

    const isEmpty = !loading && teachers.length === 0;

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        <TableHead>{t('teachers.table.name')}</TableHead>
                        <TableHead>{t('teachers.table.short_name')}</TableHead>
                        <TableHead>{t('teachers.table.subjects')}</TableHead>
                        <TableHead className="text-center">{t('teachers.table.availability')}</TableHead>
                        <TableHead className="text-right">{t('teachers.table.actions')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableSkeleton />
                    ) : isEmpty ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                {emptyMessage || t('teachers.no_teachers_found')}
                            </TableCell>
                        </TableRow>
                    ) : (
                        teachers.map((teacher) => (
                            <React.Fragment key={teacher.id}>
                                <TableRow className="hover:bg-muted/50">
                                    {/* Name */}
                                    <TableCell className="font-medium">
                                        {teacher.fullName}
                                    </TableCell>

                                    {/* Short Name */}
                                    <TableCell>
                                        <Badge variant="outline">{teacher.shortName}</Badge>
                                    </TableCell>

                                    {/* Subjects */}
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {teacher.subjects.slice(0, 3).map((subject) => (
                                                <Badge
                                                    key={subject.id}
                                                    variant="secondary"
                                                    className="text-xs"
                                                    style={{
                                                        backgroundColor: subject.color ? `${subject.color}15` : undefined,
                                                        color: subject.color,
                                                        borderColor: subject.color ? `${subject.color}40` : undefined,
                                                    }}
                                                >
                                                    {subject.emoji && <span className="mr-1">{subject.emoji}</span>}
                                                    {subject.shortName || subject.name}
                                                </Badge>
                                            ))}
                                            {teacher.subjects.length > 3 && (
                                                <Badge variant="outline" className="text-xs">
                                                    +{teacher.subjects.length - 3}
                                                </Badge>
                                            )}
                                            {teacher.subjects.length === 0 && (
                                                <span className="text-muted-foreground text-sm">-</span>
                                            )}
                                        </div>
                                    </TableCell>

                                    {/* Availability */}
                                    <TableCell className="text-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onViewAvailability?.(teacher.id)}
                                            className="h-8 gap-1"
                                        >
                                            <Calendar className="h-3 w-3" />
                                            <span>{teacher.totalAvailablePeriods}</span>
                                            {expandedAvailability === teacher.id ? (
                                                <ChevronUp className="h-3 w-3" />
                                            ) : (
                                                <ChevronDown className="h-3 w-3" />
                                            )}
                                        </Button>
                                    </TableCell>

                                    {/* Actions */}
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onEdit(teacher)}
                                                className="h-8 w-8 p-0"
                                                title={t('common.edit')}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onClone(teacher)}
                                                className="h-8 w-8 p-0"
                                                title={t('common.clone')}
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onDelete(teacher)}
                                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                title={t('common.delete')}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>

                                {/* Expanded Availability */}
                                {expandedAvailability === teacher.id && teacher.availabilities && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="bg-muted/30 p-4">
                                            <div className="max-w-2xl mx-auto">
                                                <AvailabilityGrid
                                                    availability={convertFromTimeSlots(teacher.availabilities)}
                                                    periods={periods}
                                                    readOnly
                                                    compact
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </React.Fragment>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

export default TeacherTable;
