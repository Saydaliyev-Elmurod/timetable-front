/**
 * TablePagination Component
 * 
 * Reusable pagination component for tables
 * 
 * @module components/shared/TablePagination
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { PaginationProps, ITEMS_PER_PAGE_OPTIONS } from './types';

// ============================================================================
// COMPONENT
// ============================================================================

interface TablePaginationProps extends PaginationProps {
    showInfo?: boolean;
    showPerPage?: boolean;
    className?: string;
}

export function TablePagination({
    currentPage,
    itemsPerPage,
    totalPages,
    totalElements,
    onPageChange,
    onItemsPerPageChange,
    showInfo = true,
    showPerPage = true,
    className,
}: TablePaginationProps) {
    const { t } = useTranslation();

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalElements);

    const handleFirst = () => onPageChange(1);
    const handlePrev = () => onPageChange(Math.max(1, currentPage - 1));
    const handleNext = () => onPageChange(Math.min(totalPages, currentPage + 1));
    const handleLast = () => onPageChange(totalPages);

    return (
        <div className={cn('flex items-center justify-between py-4', className)}>
            {/* Info */}
            {showInfo && (
                <div className="text-sm text-muted-foreground">
                    {totalElements > 0 ? (
                        <>
                            {t('common.showing')} {startItem}-{endItem} {t('common.of')} {totalElements}
                        </>
                    ) : (
                        <>{t('common.noResults')}</>
                    )}
                </div>
            )}

            <div className="flex items-center gap-4">
                {/* Items per page */}
                {showPerPage && onItemsPerPageChange && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            {t('common.rowsPerPage')}
                        </span>
                        <Select
                            value={String(itemsPerPage)}
                            onValueChange={(value) => onItemsPerPageChange(Number(value))}
                        >
                            <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                                    <SelectItem key={option} value={String(option)}>
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Page navigation */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleFirst}
                        disabled={currentPage <= 1}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronsLeft className="h-4 w-4" />
                        <span className="sr-only">{t('common.firstPage')}</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrev}
                        disabled={currentPage <= 1}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">{t('common.previousPage')}</span>
                    </Button>

                    <span className="px-3 text-sm">
                        {t('common.page')} {currentPage} {t('common.of')} {totalPages || 1}
                    </span>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNext}
                        disabled={currentPage >= totalPages}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">{t('common.nextPage')}</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLast}
                        disabled={currentPage >= totalPages}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronsRight className="h-4 w-4" />
                        <span className="sr-only">{t('common.lastPage')}</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default TablePagination;
