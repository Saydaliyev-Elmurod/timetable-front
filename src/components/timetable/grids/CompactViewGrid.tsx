/**
 * CompactViewGrid Component
 * 
 * Compact timetable grid showing all classes horizontally
 * 
 * @module components/timetable/grids/CompactViewGrid
 */

import React from 'react';
import { cn } from '@/components/ui/utils';
import { DroppableTimeSlot } from '../DroppableTimeSlot';
import { CompactViewGridProps, Lesson } from '../types';
import { DAYS, DAY_LABELS } from '../constants';

function CompactViewGridImpl({
    lessons,
    classes,
    onDrop,
    onEdit,
    onDelete,
    onToggleLock,
    displayOptions,
    timeSlots,
    allLessons,
    selectedLesson,
    onManualPlace,
}: CompactViewGridProps) {
    const getLessons = (className: string, day: string, timeSlot: number): Lesson[] => {
        return lessons.filter(
            (lesson) =>
                lesson.class === className &&
                lesson.day === day &&
                lesson.timeSlot === timeSlot
        );
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 overflow-x-auto">
                <div className="min-w-max">
                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                        {/* Header Row */}
                        <div
                            className="grid gap-0"
                            style={{
                                gridTemplateColumns: `100px 80px repeat(${classes.length}, 140px)`,
                            }}
                        >
                            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-3 flex items-center justify-center border-r border-indigo-500">
                                <span className="text-sm font-medium">Day</span>
                            </div>
                            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-3 flex items-center justify-center border-r border-indigo-500">
                                <span className="text-sm font-medium">Period</span>
                            </div>
                            {classes.map((className) => (
                                <div
                                    key={className}
                                    className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-3 flex items-center justify-center border-r border-indigo-500 last:border-r-0 transition-colors"
                                >
                                    <span className="text-sm font-medium">{className}</span>
                                </div>
                            ))}
                        </div>

                        {/* Body - Each day group */}
                        {DAYS.map((day, dayIndex) => (
                            <div
                                key={day}
                                className={cn(
                                    'flex border-t border-gray-200',
                                    dayIndex > 0 && 'border-t-4 border-indigo-600'
                                )}
                            >
                                {/* Day name column */}
                                <div className="bg-gray-50 p-2 flex items-center justify-center border-r border-gray-200 w-[100px] flex-shrink-0">
                                    <span className="text-sm font-medium">{DAY_LABELS[day]}</span>
                                </div>

                                {/* Periods and lessons */}
                                <div className="flex-1">
                                    {timeSlots.map((slotId) => (
                                        <div
                                            key={`${day}-${slotId}`}
                                            className="grid gap-0 border-t first:border-t-0 border-gray-200"
                                            style={{
                                                gridTemplateColumns: `80px repeat(${classes.length}, 140px)`,
                                            }}
                                        >
                                            {/* Period number */}
                                            <div className="bg-gray-50 p-2 flex items-center justify-center border-r border-gray-200">
                                                <span className="text-xs font-medium">Period {slotId}</span>
                                            </div>

                                            {/* Lesson cells */}
                                            {classes.map((className) => (
                                                <DroppableTimeSlot
                                                    key={`${className}-${day}-${slotId}`}
                                                    day={day}
                                                    timeSlot={slotId}
                                                    lessons={getLessons(className, day, slotId)}
                                                    onDrop={onDrop}
                                                    onEdit={onEdit}
                                                    onDelete={onDelete}
                                                    onToggleLock={onToggleLock}
                                                    displayOptions={displayOptions}
                                                    compact={true}
                                                    allLessons={allLessons}
                                                    rowClass={className}
                                                    entityKey={className}
                                                    selectedLesson={selectedLesson}
                                                    onManualPlace={onManualPlace}
                                                />
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export const CompactViewGrid = React.memo(CompactViewGridImpl);

export default CompactViewGrid;
