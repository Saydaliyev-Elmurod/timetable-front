/**
 * ClassViewGrid Component — ENHANCED
 *
 * Timetable grid for a specific class with:
 * - Auto-scroll when DragContext signals this class as auto-switch target
 * - Visual emphasis (ring/glow) for the target class during drag
 * - Availability-based slot highlighting via DroppableTimeSlot + DragContext
 *
 * @module components/timetable/grids/ClassViewGrid
 */

import React, { useRef, useEffect } from 'react';
import { cn } from '@/components/ui/utils';
import { DroppableTimeSlot } from '../DroppableTimeSlot';
import { ClassViewGridProps, Lesson } from '../types';
import { DAYS, DAY_LABELS } from '../constants';
import { useDragContext } from '../context/DragContext';

export function ClassViewGrid({
    className,
    lessons,
    onDrop,
    onEdit,
    onDelete,
    onToggleLock,
    displayOptions,
    timeSlots,
    draggedLesson,
    allLessons,
    selectedLesson,
    onManualPlace,
}: ClassViewGridProps) {
    const gridRef = useRef<HTMLDivElement>(null);
    const dragCtx = useDragContext();

    const getLessons = (day: string, timeSlot: number): Lesson[] => {
        return lessons.filter(
            (lesson) =>
                lesson.class === className &&
                lesson.day === day &&
                lesson.timeSlot === timeSlot
        );
    };

    // Is this the target class for the current drag?
    const isAutoSwitchTarget = dragCtx.isDragging && dragCtx.autoSwitchClassName === className;
    const isTargetClass = draggedLesson?.class === className;

    // Auto-scroll to this grid when it becomes the auto-switch target
    useEffect(() => {
        if (isAutoSwitchTarget && gridRef.current) {
            gridRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }
    }, [isAutoSwitchTarget]);

    return (
        <div
            ref={gridRef}
            className={cn(
                'bg-white rounded-xl border overflow-hidden mb-6 transition-all duration-300',
                isAutoSwitchTarget || isTargetClass
                    ? 'ring-4 ring-green-400 border-green-500 shadow-xl shadow-green-100'
                    : 'border-gray-200 shadow-sm',
                // Shrink other grids during drag to focus on target
                dragCtx.isDragging && !isAutoSwitchTarget && !isTargetClass && 'opacity-60 scale-[0.99]'
            )}
        >
            {/* Header */}
            <div
                className={cn(
                    'px-6 py-3 transition-all duration-300',
                    isAutoSwitchTarget || isTargetClass
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                        : 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white'
                )}
            >
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-base">
                        Sinf: {className}
                    </h3>
                    {(isAutoSwitchTarget || isTargetClass) && (
                        <span className="text-xs font-medium bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-sm animate-pulse">
                            🎯 Tanlangan sinf
                        </span>
                    )}
                </div>
            </div>

            {/* Grid */}
            <div className="p-4 overflow-x-auto">
                <div className="min-w-[900px]">
                    <div className="grid grid-cols-[100px_repeat(6,1fr)] gap-0 border border-gray-300 rounded-lg overflow-hidden">
                        {/* Column Headers */}
                        <div className="bg-gray-100 p-2 flex items-center justify-center border-r border-gray-300">
                            <span className="text-sm font-medium text-gray-600">Soat</span>
                        </div>
                        {DAYS.map((day) => (
                            <div
                                key={day}
                                className="bg-gray-100 p-2 flex items-center justify-center border-r border-gray-300 last:border-r-0"
                            >
                                <span className="text-sm font-medium text-gray-700">{DAY_LABELS[day]}</span>
                            </div>
                        ))}

                        {/* Rows */}
                        {timeSlots.map((slotId) => (
                            <React.Fragment key={slotId}>
                                <div className="bg-gray-50 p-2 flex flex-col items-center justify-center border-r border-t border-gray-200">
                                    <span className="text-xs font-semibold text-gray-500">{slotId}</span>
                                </div>
                                {DAYS.map((day) => (
                                    <DroppableTimeSlot
                                        key={`${className}-${day}-${slotId}`}
                                        day={day}
                                        timeSlot={slotId}
                                        lessons={getLessons(day, slotId)}
                                        onDrop={onDrop}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                        onToggleLock={onToggleLock}
                                        displayOptions={displayOptions}
                                        compact={true}
                                        draggedLesson={draggedLesson}
                                        allLessons={allLessons}
                                        rowClass={className}
                                        selectedLesson={selectedLesson}
                                        onManualPlace={onManualPlace}
                                    />
                                ))}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ClassViewGrid;
