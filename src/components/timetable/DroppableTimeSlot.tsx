/**
 * DroppableTimeSlot Component — ENHANCED
 *
 * Droppable time slot for timetable grid with:
 * - Dynamic availability-based slot coloring (teacher/class/subject time-offs)
 * - Conflict-aware highlighting (teacher busy, room occupied)
 * - Manual placement support (click-to-place)
 * - Visual legend tooltips for each status
 *
 * @module components/timetable/DroppableTimeSlot
 */

import React, { useMemo } from 'react';
import { useDrop } from 'react-dnd';
import { cn } from '@/components/ui/utils';
import { DraggableLessonCard } from './DraggableLessonCard';
import { DroppableTimeSlotProps, Lesson } from './types';
import { useDragContext, SlotStatus } from './context/DragContext';

// ============================================================================
// SLOT STATUS → VISUAL STYLES
// ============================================================================

const SLOT_STYLES: Record<SlotStatus, {
    border: string;
    bg: string;
    cursor: string;
    ring?: string;
    opacity?: string;
    label?: string;
}> = {
    available: {
        border: 'border-green-400',
        bg: 'bg-green-50 hover:bg-green-100',
        cursor: 'cursor-pointer',
        ring: 'ring-1 ring-inset ring-green-200',
        label: 'Bo\'sh joy — joylashtirish mumkin',
    },
    'teacher-conflict': {
        border: 'border-red-400',
        bg: 'bg-red-50',
        cursor: 'cursor-not-allowed',
        label: 'O\'qituvchi band',
    },
    'room-conflict': {
        border: 'border-blue-400',
        bg: 'bg-blue-50',
        cursor: 'cursor-not-allowed',
        label: 'Xona band',
    },
    'teacher-timeoff': {
        border: 'border-amber-400',
        bg: 'bg-amber-50/80',
        cursor: 'cursor-not-allowed',
        opacity: 'opacity-70',
        label: 'O\'qituvchi vaqt chegarasi',
    },
    'class-timeoff': {
        border: 'border-purple-400',
        bg: 'bg-purple-50/80',
        cursor: 'cursor-not-allowed',
        opacity: 'opacity-70',
        label: 'Sinf vaqt chegarasi',
    },
    'subject-timeoff': {
        border: 'border-orange-400',
        bg: 'bg-orange-50/80',
        cursor: 'cursor-not-allowed',
        opacity: 'opacity-70',
        label: 'Fan vaqt chegarasi',
    },
    'occupied-swap': {
        border: 'border-yellow-400',
        bg: 'bg-yellow-50 hover:bg-yellow-100',
        cursor: 'cursor-pointer',
        ring: 'ring-1 ring-inset ring-yellow-200',
        label: 'Band — almashtirish mumkin',
    },
    invalid: {
        border: 'border-gray-200',
        bg: 'bg-gray-50',
        cursor: 'cursor-default',
        opacity: 'opacity-40',
        label: 'Boshqa sinf',
    },
    neutral: {
        border: 'border-gray-200',
        bg: '',
        cursor: '',
    },
};

// ============================================================================
// STATUS INDICATOR DOT
// ============================================================================

function SlotStatusIndicator({ status }: { status: SlotStatus }) {
    if (status === 'neutral') return null;
    const style = SLOT_STYLES[status];
    if (!style.label) return null;

    const dotColors: Record<SlotStatus, string> = {
        available: 'bg-green-500',
        'teacher-conflict': 'bg-red-500',
        'room-conflict': 'bg-blue-500',
        'teacher-timeoff': 'bg-amber-500',
        'class-timeoff': 'bg-purple-500',
        'subject-timeoff': 'bg-orange-500',
        'occupied-swap': 'bg-yellow-500',
        invalid: 'bg-gray-400',
        neutral: '',
    };

    return (
        <div
            className="absolute top-0.5 right-0.5 z-10"
            title={style.label}
        >
            <div className={cn(
                'w-2 h-2 rounded-full transition-all',
                dotColors[status],
                status === 'available' && 'animate-pulse'
            )} />
        </div>
    );
}

// ============================================================================
// COMPONENT
// ============================================================================

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
    // Get advanced DragContext
    const dragCtx = useDragContext();

    const [{ isOver, canDrop }, drop] = useDrop(
        () => ({
            accept: 'lesson',
            canDrop: (item: Lesson) => {
                // Allow drop if same class OR if we use auto-switch
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

    // MANUAL PLACEMENT VALIDATION logic
    const manualPlacementStatus = useMemo(() => {
        if (!selectedLesson || !allLessons) return 'none';

        // Target mismatch
        if (rowClass && selectedLesson.class !== rowClass) {
            return 'invalid-target';
        }

        // 1. Teacher Conflict
        const teacherConflict = allLessons.some(
            (l) =>
                l.id !== selectedLesson.id &&
                l.teacherId === selectedLesson.teacherId &&
                l.day === day &&
                l.timeSlot === timeSlot
        );
        if (teacherConflict) return 'teacher-conflict';

        // 2. Room Conflict
        if (selectedLesson.roomId) {
            const roomConflict = allLessons.some(
                (l) =>
                    l.id !== selectedLesson.id &&
                    l.roomId === selectedLesson.roomId &&
                    l.day === day &&
                    l.timeSlot === timeSlot
            );
            if (roomConflict) return 'room-conflict';
        }

        return 'valid';
    }, [selectedLesson, allLessons, day, timeSlot, rowClass]);

    // Advanced slot status from DragContext (availability-based)
    const contextSlotStatus: SlotStatus = useMemo(() => {
        if (!dragCtx.isDragging || !rowClass) return 'neutral';
        return dragCtx.getSlotStatus(day, timeSlot, rowClass);
    }, [dragCtx.isDragging, dragCtx.getSlotStatus, day, timeSlot, rowClass]);

    // Combined slot style logic
    const getSlotStyle = () => {
        // 1. MANUAL PLACEMENT STYLING (takes priority when selected)
        if (selectedLesson) {
            if (manualPlacementStatus === 'invalid-target') {
                return cn(
                    'border border-gray-200 p-1 transition-colors relative opacity-40 bg-gray-50',
                    compact ? 'min-h-[60px]' : 'min-h-[70px]'
                );
            }
            if (manualPlacementStatus === 'teacher-conflict') {
                return cn(
                    'border border-red-300 p-1 transition-colors bg-red-50 relative cursor-pointer hover:bg-red-100',
                    compact ? 'min-h-[60px]' : 'min-h-[70px]'
                );
            }
            if (manualPlacementStatus === 'room-conflict') {
                return cn(
                    'border border-blue-300 p-1 transition-colors bg-blue-50 relative cursor-pointer hover:bg-blue-100',
                    compact ? 'min-h-[60px]' : 'min-h-[70px]'
                );
            }
            // Valid
            return cn(
                'border border-green-400 p-1 transition-colors bg-green-50 relative cursor-pointer hover:bg-green-100 ring-1 ring-inset ring-green-200',
                compact ? 'min-h-[60px]' : 'min-h-[70px]'
            );
        }

        // 2. CONTEXT-BASED DND HIGHLIGHTING (advanced)
        if (dragCtx.isDragging && contextSlotStatus !== 'neutral') {
            const style = SLOT_STYLES[contextSlotStatus];
            return cn(
                'border p-1 transition-all duration-200 relative',
                style.border,
                style.bg,
                style.cursor,
                style.ring,
                style.opacity,
                compact ? 'min-h-[60px]' : 'min-h-[70px]',
                isOver && contextSlotStatus === 'available' && 'ring-2 ring-green-500 scale-[1.02] shadow-lg',
                isOver && contextSlotStatus === 'occupied-swap' && 'ring-2 ring-yellow-500 scale-[1.02] shadow-md'
            );
        }

        // 3. BASIC DND STYLING (fallback when no DragContext)
        if (draggedLesson && allLessons) {
            // Wrong class
            if (rowClass && draggedLesson.class !== rowClass) {
                return cn(
                    'border border-gray-200 p-1 transition-colors relative opacity-50 bg-gray-100',
                    compact ? 'min-h-[60px]' : 'min-h-[70px]'
                );
            }

            // Source slot
            if (
                draggedLesson.day === day &&
                draggedLesson.timeSlot === timeSlot &&
                draggedLesson.class === rowClass
            ) {
                return cn(
                    'border border-gray-200 p-1 transition-colors relative bg-gray-50',
                    compact ? 'min-h-[60px]' : 'min-h-[70px]'
                );
            }

            // Teacher conflict
            const teacherConflict = allLessons.some(
                (l) =>
                    l.id !== draggedLesson.id &&
                    l.teacherId === draggedLesson.teacherId &&
                    l.day === day &&
                    l.timeSlot === timeSlot
            );
            if (teacherConflict) {
                return cn(
                    'border border-red-300 p-1 transition-colors bg-red-100 relative',
                    compact ? 'min-h-[60px]' : 'min-h-[70px]'
                );
            }

            // Room conflict
            if (draggedLesson.roomId) {
                const roomConflict = allLessons.some(
                    (l) =>
                        l.id !== draggedLesson.id &&
                        l.roomId === draggedLesson.roomId &&
                        l.day === day &&
                        l.timeSlot === timeSlot
                );
                if (roomConflict) {
                    return cn(
                        'border border-blue-300 p-1 transition-colors bg-blue-100 relative',
                        compact ? 'min-h-[60px]' : 'min-h-[70px]'
                    );
                }
            }

            // No conflict — available
            return cn(
                'border border-green-300 p-1 transition-colors bg-green-100 relative',
                compact ? 'min-h-[60px]' : 'min-h-[70px]'
            );
        }

        // 4. DEFAULT (no drag active)
        return cn(
            'border border-gray-200 p-1 transition-colors relative',
            compact ? 'min-h-[60px]' : 'min-h-[70px]',
            isOver && canDrop && 'bg-blue-50 border-blue-300',
            lessons.length === 0 && 'hover:bg-gray-50'
        );
    };

    return (
        <div
            ref={drop}
            className={getSlotStyle()}
            onClick={() => {
                if (selectedLesson && onManualPlace) {
                    onManualPlace(day, timeSlot);
                }
            }}
        >
            {/* Status indicator dot */}
            {dragCtx.isDragging && <SlotStatusIndicator status={contextSlotStatus} />}

            <div className="flex h-full w-full gap-1">
                {lessons.map((lesson) => {
                    // Check specific conflict for this lesson
                    const lessonConflict = allLessons
                        ? allLessons.some(
                            (l) =>
                                l.id !== lesson.id &&
                                l.day === day &&
                                l.timeSlot === timeSlot &&
                                (l.teacherId === lesson.teacherId ||
                                    (l.roomId !== 0 && l.roomId === lesson.roomId) ||
                                    l.classId === lesson.classId)
                        )
                        : false;

                    // Determine width logic
                    const isSingleBiWeekly = lessons.length === 1 && lesson.isBiWeekly;

                    return (
                        <div
                            key={lesson.id}
                            className={cn('relative', isSingleBiWeekly ? 'w-1/2' : 'flex-1')}
                        >
                            <DraggableLessonCard
                                lesson={lesson}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onToggleLock={onToggleLock}
                                displayOptions={displayOptions}
                                compact={compact || lessons.length > 1}
                                showClass={showClass}
                                hasConflict={lessonConflict}
                                isSelected={selectedLesson?.id === lesson.id}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default DroppableTimeSlot;
