/**
 * DraggableLessonCard Component — ENHANCED
 *
 * Draggable lesson card that:
 * - Triggers auto-switch context on dragStart
 * - Notifies DragContext of drag lifecycle
 * - Shows popover actions (edit, lock, delete)
 * - Displays group/bi-weekly badges
 *
 * @module components/timetable/DraggableLessonCard
 */

import React, { useState, useEffect } from 'react';
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
import { DraggableLessonCardProps, Lesson, UnplacedLesson } from './types';
import { SUBJECT_COLORS } from './constants';
import { useDragContext } from './context/DragContext';

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
    const dragCtx = useDragContext();

    const [{ opacity, isDragging: isThisDragging }, drag] = useDrag(
        () => ({
            type: 'lesson',
            item: () => {
                // On drag start → notify context for auto-switch + availability computation
                dragCtx.onDragStart({
                    id: lesson.id,
                    classId: lesson.classId,
                    className: lesson.class,
                    teacherId: lesson.teacherId,
                    roomId: lesson.roomId,
                    subjectId: lesson.subjectId,
                    day: (lesson as Lesson).day,
                    timeSlot: (lesson as Lesson).timeSlot,
                });
                return lesson;
            },
            end: () => {
                // On drag end → clear context
                dragCtx.onDragEnd();
            },
            collect: (monitor) => ({
                opacity: monitor.isDragging() ? 0.4 : 1,
                isDragging: monitor.isDragging(),
            }),
        }),
        [lesson, dragCtx.onDragStart, dragCtx.onDragEnd]
    );

    const [popoverOpen, setPopoverOpen] = useState(false);

    const subjectColor =
        SUBJECT_COLORS[lesson.subject as keyof typeof SUBJECT_COLORS] ||
        'bg-gray-100 border-gray-300 text-gray-900';

    // Visual strips logic
    const hasNoRoom = !lesson.roomId || lesson.roomId === 0;

    if (isUnplaced) {
        return (
            <div
                ref={drag as any}
                style={{ opacity }}
                className={cn(
                    'p-3 rounded-xl border border-gray-200/50 cursor-grab active:cursor-grabbing backdrop-blur-md transition-all duration-300 relative overflow-hidden',
                    'hover:shadow-lg hover:-translate-y-0.5 hover:shadow-gray-200',
                    isSelected ? 'ring-2 ring-blue-500 border-blue-500 shadow-blue-500/20' : subjectColor.replace('bg-', 'bg-opacity-80 bg-'),
                    isThisDragging && 'shadow-2xl scale-95 z-50',
                    'mb-3'
                )}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect?.(lesson);
                }}
            >
                {/* White strip for no room */}
                {hasNoRoom && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-white border-r border-gray-200" />
                )}

                {/* Drag handle indicator */}
                <div className={cn('flex items-start gap-2', hasNoRoom && 'pl-2')}>
                    <GripVertical className="h-4 w-4 mt-0.5 opacity-40 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        {displayOptions.showSubject && (
                            <div className="font-medium truncate">{lesson.subject}</div>
                        )}
                        <div className="text-sm opacity-75 truncate">{lesson.class}</div>
                        {displayOptions.showTeacher && (
                            <div className="text-sm opacity-75 truncate">{lesson.teacher}</div>
                        )}
                        {displayOptions.showRoom && (
                            <div className="text-sm opacity-75 truncate">{lesson.room}</div>
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
                    ref={drag as any}
                    style={{ opacity }}
                    className={cn(
                        'p-2 rounded-xl border border-gray-200/50 cursor-grab active:cursor-grabbing backdrop-blur-md transition-all duration-300 h-full relative overflow-hidden',
                        'hover:shadow-lg hover:-translate-y-0.5 group',
                        subjectColor.replace('bg-', 'bg-opacity-80 bg-').concat(' shadow-[0_4px_12px_rgba(0,0,0,0.05)]'), // pseudo glassmorphism based on subject color
                        lesson.isLocked && 'ring-2 ring-yellow-400 outline-none',
                        isSelected && 'ring-2 ring-blue-500 border-blue-500 shadow-blue-500/20',
                        isThisDragging && 'shadow-2xl scale-95 ring-2 ring-indigo-400 z-50',
                        compact && 'p-1.5'
                    )}
                    onClick={(e) => {
                        if (onSelect) {
                            e.stopPropagation();
                            onSelect(lesson);
                        }
                    }}
                >
                    {/* White strip for no room */}
                    {hasNoRoom && (
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-white border-r border-gray-200" />
                    )}

                    {/* Red strip for conflict/warning */}
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

                            {/* Group Name Info */}
                            {lesson.groupName && (
                                <div className="flex flex-wrap gap-1 mt-0.5 mb-0.5">
                                    <span className={cn('text-xs font-semibold text-indigo-700 bg-indigo-50 px-1 rounded', compact && 'text-[10px]')}>
                                        {lesson.groupName}
                                    </span>
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
                        Tahrirlash
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
                                Qulfni ochish
                            </>
                        ) : (
                            <>
                                <Lock className="mr-2 h-4 w-4" />
                                Qulflash
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
                        O'chirish
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

export default DraggableLessonCard;
