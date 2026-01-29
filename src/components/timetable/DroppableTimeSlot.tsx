/**
 * DroppableTimeSlot Component
 * 
 * Droppable time slot for timetable grid
 * 
 * @module components/timetable/DroppableTimeSlot
 */

import React, { useMemo } from 'react';
import { useDrop } from 'react-dnd';
import { cn } from '@/components/ui/utils';
import { DraggableLessonCard } from './DraggableLessonCard';
import { DroppableTimeSlotProps, Lesson } from './types';

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

    // Conflict Detection Logic for DRAGGED lesson & MANUAL placement
    const getSlotStyle = () => {
        // 1. MANUAL PLACEMENT STYLING
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

        // 2. DRAG AND DROP STYLING (Existing)
        if (!draggedLesson || !allLessons) {
            return cn(
                'border border-gray-200 p-1 transition-colors relative',
                compact ? 'min-h-[60px]' : 'min-h-[70px]',
                isOver && canDrop && 'bg-blue-50 border-blue-300',
                lessons.length === 0 && 'hover:bg-gray-50'
            );
        }

        // If we are dragging, but this slot is not a valid target (wrong class)
        if (rowClass && draggedLesson.class !== rowClass) {
            return cn(
                'border border-gray-200 p-1 transition-colors relative opacity-50 bg-gray-100',
                compact ? 'min-h-[60px]' : 'min-h-[70px]'
            );
        }

        // If this is the source slot of the dragged lesson, keep it neutral
        if (
            draggedLesson.day === day &&
            draggedLesson.timeSlot === timeSlot &&
            draggedLesson.class === rowClass
        ) {
            return cn(
                'border border-gray-200 p-1 transition-colors relative',
                compact ? 'min-h-[60px]' : 'min-h-[70px]',
                'bg-gray-50'
            );
        }

        // 1. Teacher Conflict (Red)
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

        // 2. Room Conflict (Blue)
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

        // 3. No Conflict (Green)
        return cn(
            'border border-green-300 p-1 transition-colors bg-green-100 relative',
            compact ? 'min-h-[60px]' : 'min-h-[70px]'
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
