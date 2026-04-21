/**
 * DraggableLessonCard Component
 *
 * Draggable lesson card for the timetable grid with popover actions.
 *
 * Uses `react-dnd` `useDrag` to match `DroppableTimeSlot`'s `useDrop` and
 * the page-level `DndProvider`. A previous migration to `@dnd-kit/core`
 * was reverted because no `DndContext` provider was ever added, which meant
 * the draggable listeners silently consumed click events — the Popover
 * never opened and `onSelect` never fired.
 *
 * @module components/timetable/DraggableLessonCard
 */

import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Lock,
    Unlock,
    Edit,
    Trash2,
    GripVertical,
} from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { DraggableLessonCardProps } from './types';
import { SUBJECT_PALETTE } from './utils/subjectColor';

export function DraggableLessonCard({
    lesson,
    onEdit,
    onDelete,
    onToggleLock,
    displayOptions,
    isUnplaced = false,
    compact = false,
    showClass = false,
    hasConflict = false,
    isSelected = false,
    onSelect,
}: DraggableLessonCardProps) {
    const [{ isDragging }, drag] = useDrag(
        () => ({
            type: 'lesson',
            item: lesson,
            collect: (monitor) => ({
                isDragging: monitor.isDragging(),
            }),
        }),
        [lesson]
    );

    const [popoverOpen, setPopoverOpen] = useState(false);

    // Deterministic subject color by id (stable across renames/i18n).
    // Index < 0 means "no subject resolved" -> neutral palette slot 0.
    const subjectColor =
        lesson.subjectColorIndex >= 0
            ? SUBJECT_PALETTE[lesson.subjectColorIndex]
            : SUBJECT_PALETTE[0];

    const hasNoRoom = !lesson.roomId || lesson.roomId === 0;

    const dragStateClass = isDragging ? 'opacity-40' : '';
    const cursorClass = isDragging ? 'cursor-grabbing' : 'cursor-grab';

    if (isUnplaced) {
        return (
            <div
                ref={drag}
                className={cn(
                    'p-3 rounded-lg border-2 hover:shadow-md transition-shadow relative overflow-hidden',
                    cursorClass,
                    isSelected ? 'ring-2 ring-blue-500 border-blue-500 shadow-lg' : subjectColor,
                    'mb-3',
                    dragStateClass,
                )}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect?.(lesson);
                }}
            >
                {hasNoRoom && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-white border-r border-gray-200" />
                )}

                <div className={cn('flex items-start gap-2', hasNoRoom && 'pl-2')}>
                    <GripVertical className="h-4 w-4 mt-0.5 opacity-50" />
                    <div className="flex-1">
                        {displayOptions.showSubject && (
                            <div className="font-medium">{lesson.subject}</div>
                        )}
                        <div className="text-sm opacity-75">{lesson.class}</div>
                        {displayOptions.showTeacher && (
                            <div className="text-sm opacity-75">{lesson.teacher}</div>
                        )}
                        {displayOptions.showRoom && (
                            <div className="text-sm opacity-75">{lesson.room}</div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
                <div
                    ref={drag}
                    className={cn(
                        'p-2 rounded-lg border-2 hover:shadow-md transition-shadow h-full relative overflow-hidden',
                        cursorClass,
                        subjectColor,
                        lesson.isLocked && 'ring-2 ring-yellow-500',
                        isSelected && 'ring-2 ring-blue-500 border-blue-500 shadow-lg',
                        compact && 'p-1.5',
                        dragStateClass,
                    )}
                >
                    {hasNoRoom && (
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-white border-r border-gray-200" />
                    )}

                    {hasConflict && (
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-500" />
                    )}

                    <div className={cn('flex items-start justify-between gap-1', hasNoRoom && 'pl-2', hasConflict && 'pt-1')}>
                        <div className="flex-1 min-w-0">
                            {displayOptions.showSubject && (
                                <div className={cn('font-medium truncate', compact && 'text-xs')}>
                                    {lesson.subject}
                                </div>
                            )}

                            {(lesson.groupName || (lesson.isBiWeekly && lesson.weekIndex !== undefined)) && (
                                <div className="flex flex-wrap gap-1 mt-0.5 mb-0.5">
                                    {lesson.groupName && (
                                        <span className={cn('text-xs font-semibold text-indigo-700 bg-indigo-50 px-1 rounded', compact && 'text-[10px]')}>
                                            {lesson.groupName}
                                        </span>
                                    )}
                                    {lesson.isBiWeekly && lesson.weekIndex !== undefined && (
                                        <span className={cn('text-xs font-bold text-purple-700 bg-purple-50 px-1 rounded', compact && 'text-[10px]')}>
                                            {lesson.weekIndex === 0 ? 'Week A' : 'Week B'}
                                        </span>
                                    )}
                                </div>
                            )}

                            {showClass && (
                                <div className={cn('text-sm opacity-75 truncate', compact && 'text-xs')}>
                                    {lesson.class}
                                </div>
                            )}
                            {displayOptions.showTeacher && (
                                <div className={cn('text-sm opacity-75 truncate', compact && 'text-xs')}>
                                    {lesson.teacher}
                                </div>
                            )}
                            {displayOptions.showRoom && (
                                <div className={cn('text-sm opacity-75 truncate', compact && 'text-xs')}>
                                    {lesson.room}
                                </div>
                            )}
                        </div>
                        {lesson.isLocked && (
                            <Lock className="h-3 w-3 text-yellow-600 flex-shrink-0" />
                        )}
                    </div>
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="start">
                <div className="space-y-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                            onEdit(lesson);
                            setPopoverOpen(false);
                        }}
                    >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                            onToggleLock(lesson);
                            setPopoverOpen(false);
                        }}
                    >
                        {lesson.isLocked ? (
                            <>
                                <Unlock className="mr-2 h-4 w-4" />
                                Unlock
                            </>
                        ) : (
                            <>
                                <Lock className="mr-2 h-4 w-4" />
                                Lock
                            </>
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                            onDelete(lesson);
                            setPopoverOpen(false);
                        }}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

export default DraggableLessonCard;
