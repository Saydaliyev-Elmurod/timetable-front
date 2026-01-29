/**
 * RoomTable Component
 * 
 * @module components/rooms/RoomTable
 */

import React from 'react';
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
import { Edit, Trash2, Copy, Calendar, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { RoomTableProps, RoomDisplayData } from './types';
import { AvailabilityGrid } from '@/components/classes/AvailabilityGrid';
import { convertFromTimeSlots } from '@/utils/timeSlots';

function TableSkeleton() {
    return (
        <>
            {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
            ))}
        </>
    );
}

export function RoomTable({
    rooms,
    loading,
    onEdit,
    onDelete,
    onClone,
    onViewAvailability,
    expandedAvailability,
    periods,
    emptyMessage,
}: RoomTableProps) {
    const { t } = useTranslation();
    const isEmpty = !loading && rooms.length === 0;

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        <TableHead>{t('rooms.table.name')}</TableHead>
                        <TableHead>{t('rooms.table.short_name')}</TableHead>
                        <TableHead>{t('rooms.table.capacity')}</TableHead>
                        <TableHead className="text-center">{t('rooms.table.availability')}</TableHead>
                        <TableHead className="text-right">{t('rooms.table.actions')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableSkeleton />
                    ) : isEmpty ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                {emptyMessage || t('rooms.no_rooms_found')}
                            </TableCell>
                        </TableRow>
                    ) : (
                        rooms.map((room) => (
                            <React.Fragment key={room.id}>
                                <TableRow className="hover:bg-muted/50">
                                    <TableCell className="font-medium">{room.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{room.shortName}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Users className="h-3 w-3 text-muted-foreground" />
                                            <span>{room.capacity}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onViewAvailability?.(room.id)}
                                            className="h-8 gap-1"
                                        >
                                            <Calendar className="h-3 w-3" />
                                            <span>{room.totalAvailablePeriods}</span>
                                            {expandedAvailability === room.id ? (
                                                <ChevronUp className="h-3 w-3" />
                                            ) : (
                                                <ChevronDown className="h-3 w-3" />
                                            )}
                                        </Button>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="sm" onClick={() => onEdit(room)} className="h-8 w-8 p-0">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => onClone(room)} className="h-8 w-8 p-0">
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => onDelete(room)} className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                                {expandedAvailability === room.id && room.availabilities && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="bg-muted/30 p-4">
                                            <div className="max-w-2xl mx-auto">
                                                <AvailabilityGrid
                                                    availability={convertFromTimeSlots(room.availabilities)}
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

export default RoomTable;
