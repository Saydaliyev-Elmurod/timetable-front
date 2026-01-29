/**
 * DraggableLessonCard Component
 * 
 * Draggable lesson card for timetable with popover actions
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
import { DraggableLessonCardProps, Lesson, UnplacedLesson } from './types';
import { SUBJECT_COLORS } from './constants';

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
    const [{ opacity }, drag] = useDrag(
        () => ({
            type: 'lesson',
            item: lesson,
            collect: (monitor) => ({
                opacity: monitor.isDragging() ? 0.4 : 1,
            }),
        }),
        [lesson]
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
                ref={drag}
                style={{ opacity }}
                className={cn(
                    'p-3 rounded-lg border-2 cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden',
                    isSelected ? 'ring-2 ring-blue-500 border-blue-500 shadow-lg' : subjectColor,
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
                    style={{ opacity }}
                    className={cn(
                        'p-2 rounded-lg border-2 cursor-pointer hover:shadow-md transition-all h-full relative overflow-hidden',
                        subjectColor,
                        lesson.isLocked && 'ring-2 ring-yellow-500',
                        isSelected && 'ring-2 ring-blue-500 border-blue-500 shadow-lg',
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

                            {/* Group Name & Bi-Weekly Info */}
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
