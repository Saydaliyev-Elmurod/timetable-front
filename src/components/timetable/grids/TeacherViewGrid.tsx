/**
 * TeacherViewGrid Component
 * 
 * Timetable grid showing schedule for a specific teacher
 * 
 * @module components/timetable/grids/TeacherViewGrid
 */

import React from 'react';
import { User } from 'lucide-react';
import { DroppableTimeSlot } from '../DroppableTimeSlot';
import { TeacherViewGridProps, Lesson } from '../types';
import { DAYS, DAY_LABELS } from '../constants';

export function TeacherViewGrid({
    teacherName,
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
}: TeacherViewGridProps) {
    const getLessons = (day: string, timeSlot: number): Lesson[] => {
        return lessons.filter(
            (lesson) =>
                lesson.teacher === teacherName &&
                lesson.day === day &&
                lesson.timeSlot === timeSlot
        );
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-3">
                <div className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    <h3 className="font-semibold">{teacherName}</h3>
                </div>
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
                                        key={`${teacherName}-${day}-${slotId}`}
                                        day={day}
                                        timeSlot={slotId}
                                        lessons={getLessons(day, slotId)}
                                        onDrop={onDrop}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                        onToggleLock={onToggleLock}
                                        displayOptions={displayOptions}
                                        compact={true}
                                        showClass={true}
                                        draggedLesson={draggedLesson}
                                        allLessons={allLessons}
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

export default TeacherViewGrid;
