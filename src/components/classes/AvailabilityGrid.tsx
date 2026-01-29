/**
 * AvailabilityGrid Component
 * 
 * Reusable availability calendar grid.
 * Used for teachers, classes, rooms, subjects.
 * 
 * @module components/classes/AvailabilityGrid
 */

import React, { useCallback, useMemo } from 'react';
import { Availability } from '@/utils/timeSlots';
import { cn } from '@/components/ui/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AvailabilityGridProps, DAYS, DAY_LABELS } from './types';

// ============================================================================
// COMPONENT
// ============================================================================

export function AvailabilityGrid({
    availability,
    onChange,
    periods,
    readOnly = false,
    compact = false,
}: AvailabilityGridProps) {
    // -------------------------------------------------------------------------
    // TOGGLE HANDLERS
    // -------------------------------------------------------------------------
    const handleTogglePeriod = useCallback(
        (day: keyof Availability, period: number) => {
            if (readOnly || !onChange) return;

            const currentPeriods = availability[day] || [];
            const newPeriods = currentPeriods.includes(period)
                ? currentPeriods.filter((p) => p !== period)
                : [...currentPeriods, period].sort((a, b) => a - b);

            onChange({
                ...availability,
                [day]: newPeriods,
            });
        },
        [availability, onChange, readOnly]
    );

    const handleToggleDay = useCallback(
        (day: keyof Availability) => {
            if (readOnly || !onChange) return;

            const currentPeriods = availability[day] || [];
            const allSelected = periods.every((p) => currentPeriods.includes(p));

            onChange({
                ...availability,
                [day]: allSelected ? [] : [...periods],
            });
        },
        [availability, onChange, periods, readOnly]
    );

    const handleTogglePeriodForAllDays = useCallback(
        (period: number) => {
            if (readOnly || !onChange) return;

            const weekdays = DAYS.slice(0, 5) as (keyof Availability)[];
            const isSelected = weekdays.some((day) => (availability[day] || []).includes(period));

            const newAvailability = { ...availability };
            weekdays.forEach((day) => {
                const currentPeriods = newAvailability[day] || [];
                if (isSelected) {
                    newAvailability[day] = currentPeriods.filter((p) => p !== period);
                } else {
                    if (!currentPeriods.includes(period)) {
                        newAvailability[day] = [...currentPeriods, period].sort((a, b) => a - b);
                    }
                }
            });

            onChange(newAvailability);
        },
        [availability, onChange, readOnly]
    );

    // -------------------------------------------------------------------------
    // COMPUTED VALUES
    // -------------------------------------------------------------------------
    const totalSelected = useMemo(() => {
        return Object.values(availability).reduce(
            (sum, periods) => sum + (Array.isArray(periods) ? periods.length : 0),
            0
        );
    }, [availability]);

    const totalPossible = useMemo(() => {
        return DAYS.length * periods.length;
    }, [periods]);

    // -------------------------------------------------------------------------
    // CELL RENDER
    // -------------------------------------------------------------------------
    const renderCell = useCallback(
        (day: keyof Availability, period: number, dayIndex: number) => {
            const isSelected = (availability[day] || []).includes(period);
            const cellSize = compact ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm';

            return (
                <button
                    key={`${day}-${period}`}
                    type="button"
                    onClick={() => handleTogglePeriod(day, period)}
                    disabled={readOnly}
                    className={cn(
                        cellSize,
                        'rounded border transition-colors duration-150',
                        isSelected
                            ? 'bg-green-500 border-green-600 text-white'
                            : 'bg-gray-100 border-gray-200 text-gray-400 hover:bg-gray-200',
                        readOnly && 'cursor-default',
                        !readOnly && 'cursor-pointer hover:scale-105'
                    )}
                    title={`${DAY_LABELS[dayIndex]} Period ${period}`}
                >
                    {compact ? (isSelected ? '✓' : '') : period}
                </button>
            );
        },
        [availability, compact, handleTogglePeriod, readOnly]
    );

    // -------------------------------------------------------------------------
    // RENDER
    // -------------------------------------------------------------------------
    return (
        <div className="space-y-2">
            {/* Header with periods */}
            <div className="flex items-center gap-1">
                <div className={cn(compact ? 'w-8' : 'w-10', 'text-xs font-medium text-gray-500')}>
                    {/* Empty corner */}
                </div>
                {periods.map((period) => (
                    <Tooltip key={period}>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                onClick={() => handleTogglePeriodForAllDays(period)}
                                disabled={readOnly}
                                className={cn(
                                    compact ? 'w-6 h-6 text-xs' : 'w-8 h-6 text-xs',
                                    'font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors',
                                    readOnly && 'cursor-default hover:bg-transparent'
                                )}
                            >
                                P{period}
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Click to toggle Period {period} for weekdays</p>
                        </TooltipContent>
                    </Tooltip>
                ))}
            </div>

            {/* Grid rows */}
            {DAYS.map((day, dayIndex) => (
                <div key={day} className="flex items-center gap-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                onClick={() => handleToggleDay(day as keyof Availability)}
                                disabled={readOnly}
                                className={cn(
                                    compact ? 'w-8' : 'w-10',
                                    'text-xs font-medium text-gray-600 hover:text-gray-900 text-left hover:bg-gray-100 rounded px-1 py-0.5 transition-colors',
                                    readOnly && 'cursor-default hover:bg-transparent'
                                )}
                            >
                                {DAY_LABELS[dayIndex]}
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Click to toggle all periods for {DAY_LABELS[dayIndex]}</p>
                        </TooltipContent>
                    </Tooltip>

                    {periods.map((period) =>
                        renderCell(day as keyof Availability, period, dayIndex)
                    )}
                </div>
            ))}

            {/* Summary */}
            {!compact && (
                <div className="text-xs text-gray-500 mt-2">
                    {totalSelected} / {totalPossible} periods selected
                </div>
            )}
        </div>
    );
}

export default AvailabilityGrid;
