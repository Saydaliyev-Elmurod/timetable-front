/**
 * SubjectTable Component
 * 
 * @module components/subjects/SubjectTable
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
import { Edit, Trash2, Copy } from 'lucide-react';
import { SubjectTableProps, SubjectDisplayData } from './types';

function TableSkeleton() {
    return (
        <>
            {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-6 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
            ))}
        </>
    );
}

export function SubjectTable({
    subjects,
    loading,
    onEdit,
    onDelete,
    onClone,
    emptyMessage,
}: SubjectTableProps) {
    const { t } = useTranslation();
    const isEmpty = !loading && subjects.length === 0;

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        <TableHead>{t('subjects.table.name')}</TableHead>
                        <TableHead>{t('subjects.table.short_name')}</TableHead>
                        <TableHead>{t('subjects.table.color')}</TableHead>
                        <TableHead className="text-right">{t('subjects.table.actions')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableSkeleton />
                    ) : isEmpty ? (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                {emptyMessage || t('subjects.no_subjects_found')}
                            </TableCell>
                        </TableRow>
                    ) : (
                        subjects.map((subject) => (
                            <TableRow key={subject.id} className="hover:bg-muted/50">
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{subject.emoji}</span>
                                        <span>{subject.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant="secondary"
                                        style={{
                                            backgroundColor: `${subject.color}15`,
                                            color: subject.color,
                                            borderColor: `${subject.color}40`,
                                        }}
                                    >
                                        {subject.shortName}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div
                                        className="h-6 w-6 rounded border"
                                        style={{ backgroundColor: subject.color }}
                                        title={subject.color}
                                    />
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button variant="ghost" size="sm" onClick={() => onEdit(subject)} className="h-8 w-8 p-0">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => onClone(subject)} className="h-8 w-8 p-0">
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => onDelete(subject)} className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

export default SubjectTable;
