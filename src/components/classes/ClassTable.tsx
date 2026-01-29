/**
 * ClassTable Component
 * 
 * Sinflar jadvalini ko'rsatish.
 * Edit, Delete, View Availability amallarini qo'llab-quvvatlaydi.
 * 
 * @module components/classes/ClassTable
 */

import React, { useMemo, useCallback } from 'react';
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
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Pencil,
    Trash2,
    ChevronDown,
    ChevronUp,
    Users,
    Building,
    User,
} from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { AvailabilityGrid } from './AvailabilityGrid';
import {
    ClassTableProps,
    ClassDisplayData,
    TeacherSimple,
    RoomSimple,
} from './types';
import { getTotalAvailablePeriods } from '@/utils/timeSlots';

// ============================================================================
// COMPONENT
// ============================================================================

export function ClassTable({
    classes,
    teachers,
    rooms,
    loading,
    onEdit,
    onDelete,
    onViewAvailability,
    expandedAvailability,
    periods,
}: ClassTableProps) {
    const { t } = useTranslation();

    // -------------------------------------------------------------------------
    // HELPER FUNCTIONS
    // -------------------------------------------------------------------------
    const getTeacherName = useCallback(
        (teacherId: string): string => {
            if (!teacherId) return '-';
            const teacher = teachers.find((t) => t.id === Number(teacherId));
            return teacher?.name || teacher?.fullName || '-';
        },
        [teachers]
    );

    const getRoomNames = useCallback(
        (roomIds: string[]): string[] => {
            if (!roomIds || roomIds.length === 0) return [];
            return roomIds
                .map((id) => {
                    const room = rooms.find((r) => r.id === Number(id));
                    return room?.name || room?.shortName;
                })
                .filter((name): name is string => Boolean(name));
        },
        [rooms]
    );

    // -------------------------------------------------------------------------
    // MEMOIZED DATA
    // -------------------------------------------------------------------------
    const classesWithNames = useMemo(() => {
        return classes.map((cls) => ({
            ...cls,
            classTeacherName: getTeacherName(cls.classTeacher),
            roomNames: getRoomNames(cls.roomIds),
        }));
    }, [classes, getTeacherName, getRoomNames]);

    // -------------------------------------------------------------------------
    // LOADING STATE
    // -------------------------------------------------------------------------
    if (loading) {
        return (
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">{t('common.name')}</TableHead>
                            <TableHead className="w-[100px]">{t('common.shortName')}</TableHead>
                            <TableHead>{t('classes.classTeacher')}</TableHead>
                            <TableHead>{t('common.rooms')}</TableHead>
                            <TableHead>{t('classes.groups')}</TableHead>
                            <TableHead className="w-[120px]">{t('classes.availability')}</TableHead>
                            <TableHead className="w-[100px] text-right">{t('common.actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <TableRow key={i}>
                                <TableCell>
                                    <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
                                </TableCell>
                                <TableCell>
                                    <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
                                </TableCell>
                                <TableCell>
                                    <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
                                </TableCell>
                                <TableCell>
                                    <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                                </TableCell>
                                <TableCell>
                                    <div className="h-4 bg-gray-200 rounded animate-pulse w-12" />
                                </TableCell>
                                <TableCell>
                                    <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                                </TableCell>
                                <TableCell>
                                    <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    }

    // -------------------------------------------------------------------------
    // EMPTY STATE
    // -------------------------------------------------------------------------
    if (classes.length === 0) {
        return (
            <div className="border rounded-lg p-8 text-center">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">{t('classes.noClasses')}</h3>
                <p className="mt-1 text-sm text-gray-500">{t('classes.noClassesDescription')}</p>
            </div>
        );
    }

    // -------------------------------------------------------------------------
    // TABLE RENDER
    // -------------------------------------------------------------------------
    return (
        <div className="border rounded-lg overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[200px]">{t('common.name')}</TableHead>
                        <TableHead className="w-[100px]">{t('common.shortName')}</TableHead>
                        <TableHead>{t('classes.classTeacher')}</TableHead>
                        <TableHead>{t('common.rooms')}</TableHead>
                        <TableHead>{t('classes.groups')}</TableHead>
                        <TableHead className="w-[120px]">{t('classes.availability')}</TableHead>
                        <TableHead className="w-[100px] text-right">{t('common.actions')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {classesWithNames.map((classItem) => (
                        <React.Fragment key={classItem.id}>
                            <TableRow className="hover:bg-gray-50">
                                {/* Name */}
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        {classItem.name}
                                        {!classItem.isActive && (
                                            <Badge variant="secondary" className="text-xs">
                                                {t('common.inactive')}
                                            </Badge>
                                        )}
                                    </div>
                                </TableCell>

                                {/* Short Name */}
                                <TableCell>
                                    <span className="text-gray-600">{classItem.shortName}</span>
                                </TableCell>

                                {/* Class Teacher */}
                                <TableCell>
                                    {classItem.classTeacherName !== '-' ? (
                                        <div className="flex items-center gap-1">
                                            <User className="h-3 w-3 text-gray-400" />
                                            <span>{classItem.classTeacherName}</span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">-</span>
                                    )}
                                </TableCell>

                                {/* Rooms */}
                                <TableCell>
                                    {classItem.roomNames && classItem.roomNames.length > 0 ? (
                                        <div className="flex items-center gap-1 flex-wrap">
                                            <Building className="h-3 w-3 text-gray-400" />
                                            {classItem.roomNames.slice(0, 2).map((name, idx) => (
                                                <Badge key={idx} variant="outline" className="text-xs">
                                                    {name}
                                                </Badge>
                                            ))}
                                            {classItem.roomNames.length > 2 && (
                                                <Badge variant="outline" className="text-xs">
                                                    +{classItem.roomNames.length - 2}
                                                </Badge>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">-</span>
                                    )}
                                </TableCell>

                                {/* Groups */}
                                <TableCell>
                                    {classItem.isGrouped && classItem.groups.length > 0 ? (
                                        <div className="flex items-center gap-1">
                                            <Users className="h-3 w-3 text-gray-400" />
                                            <span className="text-sm">{classItem.groups.length} {t('classes.groups')}</span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">-</span>
                                    )}
                                </TableCell>

                                {/* Availability */}
                                <TableCell>
                                    <button
                                        type="button"
                                        onClick={() => onViewAvailability(classItem.id)}
                                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                                    >
                                        <span>{getTotalAvailablePeriods(classItem.availability)} periods</span>
                                        {expandedAvailability === classItem.id ? (
                                            <ChevronUp className="h-3 w-3" />
                                        ) : (
                                            <ChevronDown className="h-3 w-3" />
                                        )}
                                    </button>
                                </TableCell>

                                {/* Actions */}
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onEdit(classItem)}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{t('common.edit')}</p>
                                            </TooltipContent>
                                        </Tooltip>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onDelete(classItem)}
                                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{t('common.delete')}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </TableCell>
                            </TableRow>

                            {/* Expanded Availability Row */}
                            {expandedAvailability === classItem.id && (
                                <TableRow>
                                    <TableCell colSpan={7} className="bg-gray-50 py-4">
                                        <div className="px-4">
                                            <h4 className="text-sm font-medium mb-2">{t('classes.availabilityGrid')}</h4>
                                            <AvailabilityGrid
                                                availability={classItem.availability}
                                                periods={periods}
                                                readOnly={true}
                                                compact={true}
                                            />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </React.Fragment>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

export default ClassTable;
