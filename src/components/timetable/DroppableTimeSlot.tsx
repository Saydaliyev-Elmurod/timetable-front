/**
 * DroppableTimeSlot Component
 *
 * Droppable time slot for timetable grid.
 *
 * Slice 1 of the Smart DnD Feedback system: the visual layer is unified
 * between drag (hover) and manual-placement (click-to-place) gestures via
 * `detectSlotConflict`. The underlying `react-dnd` drop mechanics are
 * unchanged — this file only reworks the *visual feedback* path.
 *
 * @module components/timetable/DroppableTimeSlot
 */

import React, { useMemo } from 'react';
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
    type ConflictStatus,
} from './utils/conflictDetection';

// Static lookup to avoid Tailwind JIT interpolation (grid-cols-${N} won't purge-safe).
const GRID_COLS_LOOKUP: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
};

/**
 * Resolves the slot background/border palette for a given conflict status
 * and gesture mode. Drag palettes are slightly more saturated than manual
 * palettes so the user perceives drag hover as the "stronger" interaction.
 *
 * Returns only color-related classes; sizing and transitions are applied
 * separately to keep the final class string easy to reason about.
 */
function resolveSlotPalette(
    status: ConflictStatus,
    isManual: boolean,
    isDrag: boolean
): string {
    // When no gesture is active, we keep the neutral default and let the
    // caller layer a hover rule on top.
    if (!isManual && !isDrag) {
        return 'border-gray-200';
    }

    switch (status) {
        case 'teacher-conflict':
            return isDrag
                ? 'bg-red-100 border-red-400 text-red-900'
                : 'bg-red-50 border-red-300 text-red-800';
        case 'room-conflict':
            // SLOT bg is dark slate; cards inside keep their own palette.
            return isDrag
                ? 'bg-slate-800 border-slate-900 text-slate-50'
                : 'bg-slate-700 border-slate-800 text-slate-50';
        case 'class-conflict':
            return isDrag
                ? 'bg-amber-200 border-amber-500 text-amber-950'
                : 'bg-amber-100 border-amber-400 text-amber-900';
        case 'valid':
            return isDrag
                ? 'bg-emerald-100 border-emerald-400'
                : 'bg-emerald-50 border-emerald-300 ring-1 ring-inset ring-emerald-200';
        case 'invalid-target-class':
            return 'bg-gray-100 border-gray-300 opacity-60';
        case 'none':
        default:
            return 'border-gray-200';
    }
}

export function DroppableTimeSlot({
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
    draggedLesson,
    allLessons,
    rowClass,
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

    // Unified gesture target. Manual selection takes precedence because
    // it is the more explicit user intent (a click, not a transient hover).
    const gestureTarget = selectedLesson ?? draggedLesson ?? null;

    const conflict = useMemo<ConflictResult>(
        () =>
            detectSlotConflict(gestureTarget, {
                day,
                timeSlot,
                rowClass,
                allLessons: allLessons ?? [],
            }),
        [gestureTarget, day, timeSlot, rowClass, allLessons]
    );

    const isManual = Boolean(selectedLesson);
    const isDrag = !isManual && Boolean(draggedLesson);
    const isGestureActive = isManual || isDrag;

    // Per-lesson conflict flags hoisted out of the render loop.
    // Keyed by lesson.id -> boolean. This is the "red strip" indicator shown
    // on each card; it only depends on the lessons currently in this slot
    // plus the global `allLessons` snapshot. Hoisting prevents an O(L*A)
    // recomputation on every render when many cards share a slot.
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

    // Cursor semantics: during a gesture, broadcast actionability.
    let cursorClass = '';
    if (isGestureActive) {
        if (
            conflict.status === 'teacher-conflict' ||
            conflict.status === 'room-conflict' ||
            conflict.status === 'class-conflict' ||
            conflict.status === 'invalid-target-class'
        ) {
            cursorClass = 'cursor-not-allowed';
        } else if (conflict.status === 'valid') {
            cursorClass = 'cursor-copy';
        }
    } else if (lessons.length === 0) {
        // Keep a subtle affordance for empty idle slots.
        cursorClass = '';
    }

    const palette = resolveSlotPalette(conflict.status, isManual, isDrag);

    // Idle hover affordance: only applied when no gesture is active and the
    // slot is empty, matching the pre-slice-1 behaviour.
    const idleHoverClass =
        !isGestureActive && lessons.length === 0 ? 'hover:bg-gray-50' : '';

    // Legacy react-dnd over/canDrop visual (kept so `useDrop` state still
    // reflects in the UI when `draggedLesson` prop isn't being threaded in).
    // When a gesture is active via props, `palette` wins and this is a no-op.
    const legacyDropHover =
        !isGestureActive && isOver && canDrop ? 'bg-blue-50 border-blue-300' : '';

    const slotClass = cn(
        'border p-1 relative',
        // Only animate colors — avoid `transition-colors` because it animates
        // text color too, causing a flicker when palette text classes change.
        'transition-[background-color,border-color] duration-200 ease-out',
        compact ? 'min-h-[60px]' : 'min-h-[70px]',
        palette,
        idleHoverClass,
        legacyDropHover,
        cursorClass
    );

    // Tooltip: only show on real conflicts during an active gesture. Valid
    // and "none" (origin) slots should not emit tooltips — they'd be noise.
    const showTooltip =
        Boolean(gestureTarget) &&
        conflict.status !== 'valid' &&
        conflict.status !== 'none';

    const slotInner = (
        <div
            ref={drop}
            className={slotClass}
            onClick={() => {
                if (selectedLesson && onManualPlace) {
                    onManualPlace(day, timeSlot);
                }
            }}
        >
            {(() => {
                const count = lessons.length;
                if (count === 0) return null;

                // Vertical fallback for >4 sub-cards (rare, but CSS grid would squish them).
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
                                    // min-w-0 / min-h-0 prevent grid blow-out when cards contain long text.
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

    // Always mount the Tooltip wrapper so the slot's React tree shape stays
    // stable across renders. Conditionally swapping between a bare div and a
    // <Tooltip>-wrapped div would unmount/remount the nested DraggableLessonCard
    // — and with it its @dnd-kit useDraggable hook — the instant a drag begins
    // over the slot, breaking the in-flight gesture. Radix no-ops when
    // `open={false}`, so the idle cost is limited to a portal subscription.
    return (
        <Tooltip open={showTooltip}>
            <TooltipTrigger asChild>{slotInner}</TooltipTrigger>
            <TooltipContent
                side="top"
                sideOffset={6}
                collisionPadding={8}
                className="text-xs font-medium leading-snug px-2 py-1.5 rounded-md max-w-[220px] whitespace-normal break-words"
            >
                {conflict.reason?.message}
            </TooltipContent>
        </Tooltip>
    );
}

export default DroppableTimeSlot;
