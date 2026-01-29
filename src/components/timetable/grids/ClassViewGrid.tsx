/**
 * ClassViewGrid Component
 * 
 * Timetable grid showing schedule for a specific class
 * 
 * @module components/timetable/grids/ClassViewGrid
 */

import React from 'react';
import { cn } from '@/components/ui/utils';
import { DroppableTimeSlot } from '../DroppableTimeSlot';
import { ClassViewGridProps, Lesson } from '../types';
import { DAYS, DAY_LABELS } from '../constants';

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
    const getLessons = (day: string, timeSlot: number): Lesson[] => {
        return lessons.filter(
            (lesson) =>
                lesson.class === className &&
                lesson.day === day &&
                lesson.timeSlot === timeSlot
        );
    };

    const isTargetClass = draggedLesson?.class === className;

    return (
        <div
            className={cn(
                'bg-white rounded-lg border border-gray-200 overflow-hidden mb-6 transition-all',
                isTargetClass && 'ring-4 ring-green-400 border-green-500 shadow-lg'
            )}
        >
            <div
                className={cn(
                    'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-3',
                    isTargetClass && 'from-green-600 to-green-700'
                )}
            >
                <h3 className="font-semibold">Class {className}</h3>
            </div>

            <div className="p-4 overflow-x-auto">
                <div className="min-w-[900px]">
                    <div className="grid grid-cols-[100px_repeat(6,1fr)] gap-0 border border-gray-300 rounded-lg overflow-hidden">
                        <div className="bg-gray-100 p-2 flex items-center justify-center border-r border-gray-300">
                            <span className="text-sm font-medium">Time</span>
                        </div>
                        {DAYS.map((day) => (
                            <div
                                key={day}
                                className="bg-gray-100 p-2 flex items-center justify-center border-r border-gray-300 last:border-r-0"
                            >
                                <span className="text-sm font-medium">{DAY_LABELS[day]}</span>
                            </div>
                        ))}

                        {timeSlots.map((slotId) => (
                            <React.Fragment key={slotId}>
                                <div className="bg-gray-50 p-2 flex flex-col items-center justify-center border-r border-t border-gray-200">
                                    <span className="text-xs">Period {slotId}</span>
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
