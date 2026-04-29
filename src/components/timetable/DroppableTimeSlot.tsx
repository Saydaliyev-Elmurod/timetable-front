/**
 * DroppableTimeSlot Component
 *
 * Droppable time slot for timetable grid.
 * Reads conflict status from pre-computed Zustand map (set once at drag start, static during drag).
 * Color overlay replaces expensive per-frame re-renders of cell content.
 *
 * @module components/timetable/DroppableTimeSlot
 */

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { cn } from '@/components/ui/utils';
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from '@/components/ui/tooltip';
import { DraggableLessonCard } from './DraggableLessonCard';
import { DroppableTimeSlotProps, Lesson } from './types';
import {
    detectSlotConflict,
    type ConflictResult,
} from './utils/conflictDetection';
import { useTimetableDnd, useActiveForSlot, useSlotConflictStatus } from './store/useTimetableDnd';

// Static lookup to avoid Tailwind JIT interpolation (grid-cols-${N} won't purge-safe).
const GRID_COLS_LOOKUP: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
};

function DroppableTimeSlotComponent({
    day,
    timeSlot,
    lessons = [],
    onDrop,
    onEdit,
    onDelete,
    onToggleLock,
    displayOptions,
    compact = false,
    showClass = false,
    allLessons,
    rowClass,
    entityKey,
    selectedLesson,
    onManualPlace,
}: DroppableTimeSlotProps) {
    const [{ isOver, canDrop }, drop] = useDrop(
        () => ({
            accept: 'lesson',
            canDrop: (item: Lesson) => {
                // Only allow dropping if it's the same class
                if (rowClass && item.class !== rowClass) {
                    return false;
                }
                return true;
            },
            drop: (item: Lesson) => onDrop(item, day, timeSlot),
            collect: (monitor) => ({
                isOver: !!monitor.isOver(),
                canDrop: !!monitor.canDrop(),
            }),
        }),
        [day, timeSlot, rowClass]
    );

    // Construct grid slot key for Zustand lookup
    const gridSlotKey = entityKey
        ? `${entityKey}::${day}::${timeSlot}`
        : `${day}::${timeSlot}`;

    // Read pre-computed conflict status from Zustand (set once at drag start, stable during drag)
    const conflictEntry = useSlotConflictStatus(gridSlotKey);
    const isDraggingActive = useTimetableDnd((s) => s.activeId !== null);

    // Manual placement: detect conflict on click (click-based, acceptable cost)
    const isManual = Boolean(selectedLesson);
    const manualConflict = useMemo<ConflictResult>(
        () =>
            isManual
                ? detectSlotConflict(selectedLesson, {
                      day,
                      timeSlot,
                      rowClass,
                      allLessons: allLessons ?? [],
                  })
                : { status: 'none' },
        [isManual, selectedLesson, day, timeSlot, rowClass, allLessons]
    );

    const isGestureActive = isDraggingActive || isManual;

    // Per-lesson conflict flags (for red strip indicator on each card)
    const perLessonConflict = useMemo<Map<string, boolean>>(() => {
        const map = new Map<string, boolean>();
        if (!allLessons || lessons.length === 0) return map;
        for (const lesson of lessons) {
            const hasConflict = allLessons.some(
                (l) =>
                    l.id !== lesson.id &&
                    l.day === day &&
                    l.timeSlot === timeSlot &&
                    (l.teacherId === lesson.teacherId ||
                        (l.roomId !== 0 && l.roomId === lesson.roomId) ||
                        l.classId === lesson.classId)
            );
            map.set(lesson.id, hasConflict);
        }
        return map;
    }, [lessons, allLessons, day, timeSlot]);

    // Hover tooltip timer (600ms delay)
    const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [tooltipOpen, setTooltipOpen] = useState(false);

    const handleMouseEnter = () => {
        if (!isDraggingActive) return;
        if (!conflictEntry || conflictEntry.status === 'source') return;

        hoverTimerRef.current = setTimeout(() => {
            setTooltipOpen(true);
        }, 600);
    };

    const handleMouseLeave = () => {
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = null;
        }
        setTooltipOpen(false);
    };

    useEffect(() => {
        return () => {
            if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        };
    }, []);

    // Cursor semantics
    let cursorClass = '';
    if (isGestureActive) {
        const statusForCursor = isDraggingActive && conflictEntry ? conflictEntry.status : manualConflict.status;
        if (
            statusForCursor === 'conflict' ||
            statusForCursor === 'invalid-class'
        ) {
            cursorClass = 'cursor-not-allowed';
        } else if (statusForCursor === 'available' || statusForCursor === 'optimal') {
            cursorClass = 'cursor-copy';
        }
    }

    // Idle hover affordance
    const idleHoverClass =
        !isGestureActive && lessons.length === 0 ? 'hover:bg-gray-50' : '';

    const slotClass = cn(
        'border p-1 relative',
        'transition-[background-color,border-color] duration-200 ease-out',
        compact ? 'min-h-[60px]' : 'min-h-[70px]',
        idleHoverClass,
        cursorClass
    );

    // Tooltip visibility
    const showManualTooltip =
        isManual &&
        manualConflict.status !== 'valid' &&
        manualConflict.status !== 'none';

    const slotInner = (
        <div
            ref={drop}
            className={slotClass}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={() => {
                if (selectedLesson && onManualPlace) {
                    onManualPlace(day, timeSlot);
                }
            }}
        >
            {/* Color overlay during drag (pointer-events-none, doesn't affect interactions) */}
            {isDraggingActive && !isManual && conflictEntry && (
                <div
                    className={cn(
                        'absolute inset-0 pointer-events-none rounded',
                        conflictEntry.status === 'available' && 'bg-emerald-200/60',
                        conflictEntry.status === 'optimal' && 'bg-blue-200/60',
                        conflictEntry.status === 'conflict' && 'bg-red-200/60',
                        conflictEntry.status === 'source' && 'bg-gray-200/40 opacity-50',
                        conflictEntry.status === 'invalid-class' && 'bg-gray-100/40'
                    )}
                />
            )}

            {(() => {
                const count = lessons.length;
                if (count === 0) return null;

                // Vertical fallback for >4 sub-cards (rare)
                const useOverflow = count > 4;
                const gridClass = useOverflow
                    ? 'flex flex-col gap-1 overflow-y-auto max-h-28 h-full'
                    : cn(
                          'grid gap-1 h-full',
                          GRID_COLS_LOOKUP[Math.max(1, Math.min(count, 4))]
                      );

                return (
                    <div className={gridClass}>
                        {lessons.map((lesson) => {
                            const lessonConflict =
                                perLessonConflict.get(lesson.id) ?? false;

                            return (
                                <div
                                    key={lesson.id}
                                    className="relative min-w-0 min-h-0"
                                >
                                    <DraggableLessonCard
                                        lesson={lesson}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                        onToggleLock={onToggleLock}
                                        displayOptions={displayOptions}
                                        compact={compact || count > 1}
                                        showClass={showClass}
                                        hasConflict={lessonConflict}
                                        isSelected={
                                            selectedLesson?.id === lesson.id
                                        }
                                    />
                                </div>
                            );
                        })}
                    </div>
                );
            })()}
        </div>
    );

    return (
        <Tooltip open={tooltipOpen || showManualTooltip}>
            <TooltipTrigger asChild>{slotInner}</TooltipTrigger>
            <TooltipContent
                side="top"
                sideOffset={6}
                collisionPadding={8}
                className="text-xs font-medium leading-snug px-2 py-1.5 rounded-md max-w-[220px] whitespace-normal break-words"
            >
                {isDraggingActive && conflictEntry
                    ? conflictEntry.message
                    : manualConflict.reason?.message}
            </TooltipContent>
        </Tooltip>
    );
}

export const DroppableTimeSlot = React.memo(DroppableTimeSlotComponent);
