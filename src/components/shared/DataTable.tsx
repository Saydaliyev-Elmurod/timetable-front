/**
 * DataTable Component
 * 
 * Generic reusable table component for CRUD pages
 * 
 * @module components/shared/DataTable
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
import { Skeleton } from '@/components/ui/skeleton';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Copy, Eye } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { DataTableProps, BaseEntity, TableColumn, TableAction } from './types';

// ============================================================================
// LOADING SKELETON
// ============================================================================

interface TableSkeletonProps {
    columns: number;
    rows?: number;
}

function TableSkeleton({ columns, rows = 5 }: TableSkeletonProps) {
    return (
        <>
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <TableCell key={colIndex}>
                            <Skeleton className="h-4 w-full" />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

interface EmptyStateProps {
    message: string;
    colSpan: number;
}

function EmptyState({ message, colSpan }: EmptyStateProps) {
    return (
        <TableRow>
            <TableCell
                colSpan={colSpan}
                className="h-24 text-center text-muted-foreground"
            >
                {message}
            </TableCell>
        </TableRow>
    );
}

// ============================================================================
// ACTION CELL
// ============================================================================

interface ActionCellProps<T extends BaseEntity> {
    item: T;
    actions: TableAction<T>[];
}

function ActionCell<T extends BaseEntity>({ item, actions }: ActionCellProps<T>) {
    const { t } = useTranslation();

    const visibleActions = actions.filter(action => !action.hidden?.(item));

    if (visibleActions.length === 0) return null;

    // Show inline buttons for up to 3 actions
    if (visibleActions.length <= 3) {
        return (
            <div className="flex items-center justify-end gap-1">
                {visibleActions.map((action) => {
                    const Icon = action.icon;
                    return (
                        <Button
                            key={action.id}
                            variant={action.variant || 'ghost'}
                            size="sm"
                            onClick={() => action.onClick(item)}
                            disabled={action.disabled?.(item)}
                            className="h-8 w-8 p-0"
                            title={action.label}
                        >
                            {Icon && <Icon className="h-4 w-4" />}
                        </Button>
                    );
                })}
            </div>
        );
    }

    // Show dropdown for more than 3 actions
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">{t('common.openMenu')}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {visibleActions.map((action) => {
                    const Icon = action.icon;
                    return (
                        <DropdownMenuItem
                            key={action.id}
                            onClick={() => action.onClick(item)}
                            disabled={action.disabled?.(item)}
                            className={cn(
                                action.variant === 'destructive' && 'text-red-600 focus:text-red-600'
                            )}
                        >
                            {Icon && <Icon className="mr-2 h-4 w-4" />}
                            {action.label}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DataTable<T extends BaseEntity>({
    data,
    columns,
    actions = [],
    loading = false,
    emptyMessage = 'No data found',
    onRowClick,
    selectedId,
    className,
}: DataTableProps<T>) {
    const { t } = useTranslation();

    const hasActions = actions.length > 0;
    const totalColumns = columns.length + (hasActions ? 1 : 0);

    // Render cell content
    const renderCell = (item: T, column: TableColumn<T>, index: number) => {
        if (column.render) {
            return column.render(item, index);
        }

        const value = item[column.key as keyof T];
        if (value === null || value === undefined) return '-';
        if (typeof value === 'boolean') return value ? '✓' : '✗';
        return String(value);
    };

    return (
        <div className={cn('rounded-md border', className)}>
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        {columns.map((column) => (
                            <TableHead
                                key={String(column.key)}
                                style={{ width: column.width }}
                                className={cn(
                                    column.align === 'center' && 'text-center',
                                    column.align === 'right' && 'text-right'
                                )}
                            >
                                {column.header}
                            </TableHead>
                        ))}
                        {hasActions && (
                            <TableHead className="text-right w-[100px]">
                                {t('common.actions')}
                            </TableHead>
                        )}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableSkeleton columns={totalColumns} rows={5} />
                    ) : data.length === 0 ? (
                        <EmptyState message={emptyMessage} colSpan={totalColumns} />
                    ) : (
                        data.map((item, index) => (
                            <TableRow
                                key={item.id}
                                onClick={() => onRowClick?.(item)}
                                className={cn(
                                    onRowClick && 'cursor-pointer',
                                    selectedId === item.id && 'bg-muted'
                                )}
                            >
                                {columns.map((column) => (
                                    <TableCell
                                        key={String(column.key)}
                                        className={cn(
                                            column.align === 'center' && 'text-center',
                                            column.align === 'right' && 'text-right'
                                        )}
                                    >
                                        {renderCell(item, column, index)}
                                    </TableCell>
                                ))}
                                {hasActions && (
                                    <TableCell className="text-right">
                                        <ActionCell item={item} actions={actions} />
                                    </TableCell>
                                )}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

// ============================================================================
// COMMON TABLE ACTIONS
// ============================================================================

/**
 * Create common edit action
 */
export function createEditAction<T extends BaseEntity>(
    onClick: (item: T) => void,
    label = 'Edit'
): TableAction<T> {
    return {
        id: 'edit',
        label,
        icon: Edit,
        onClick,
        variant: 'ghost',
    };
}

/**
 * Create common delete action
 */
export function createDeleteAction<T extends BaseEntity>(
    onClick: (item: T) => void,
    label = 'Delete'
): TableAction<T> {
    return {
        id: 'delete',
        label,
        icon: Trash2,
        onClick,
        variant: 'destructive',
    };
}

/**
 * Create common clone action
 */
export function createCloneAction<T extends BaseEntity>(
    onClick: (item: T) => void,
    label = 'Clone'
): TableAction<T> {
    return {
        id: 'clone',
        label,
        icon: Copy,
        onClick,
        variant: 'ghost',
    };
}

/**
 * Create common view action
 */
export function createViewAction<T extends BaseEntity>(
    onClick: (item: T) => void,
    label = 'View'
): TableAction<T> {
    return {
        id: 'view',
        label,
        icon: Eye,
        onClick,
        variant: 'ghost',
    };
}

export default DataTable;
