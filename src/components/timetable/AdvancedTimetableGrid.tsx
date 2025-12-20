import React, { useMemo } from 'react';
import { ScheduledLessonDto } from '@/types/advancedTimetable';
import { LessonCard } from './LessonCard';
import { TimetableDropZone } from './TimetableDropZone';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { cn } from '../ui/utils'; // Assuming this exists, based on previous file usage

interface AdvancedTimetableGridProps {
    schedule: ScheduledLessonDto[];
    onLessonMove: (lessonId: string, newDay: number, newHour: number) => void;
    onLessonClick?: (lesson: ScheduledLessonDto) => void;
    maxDailyHours?: number;
    days?: string[];
}

export const AdvancedTimetableGrid: React.FC<AdvancedTimetableGridProps> = ({
    schedule,
    onLessonMove,
    onLessonClick,
    maxDailyHours = 7,  // Default max hours
    days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
}) => {

    // 1. Process Lessons to identify Week A/B overlaps
    const processedLessons = useMemo(() => {
        // Map of "day-hour" -> lessons[]
        const slotMap = new Map<string, ScheduledLessonDto[]>();

        schedule.forEach(l => {
            // Use the starting slot key
            const key = `${l.dayIndex}-${l.hourIndex}`;
            if (!slotMap.has(key)) slotMap.set(key, []);
            slotMap.get(key)?.push(l);
        });

        return schedule.map(lesson => {
            const key = `${lesson.dayIndex}-${lesson.hourIndex}`;
            const neighbors = slotMap.get(key) || [];

            // Check for A/B Split Condition
            // Condition: Same start slot, one is Week A (0), one is Week B (1)
            const hasWeekAPartner = neighbors.some(n => n.id !== lesson.id && n.weekIndex === 0);
            const hasWeekBPartner = neighbors.some(n => n.id !== lesson.id && n.weekIndex === 1);

            let shape: 'full' | 'triangle-top-left' | 'triangle-bottom-right' = 'full';

            if (lesson.weekIndex === 0 && hasWeekBPartner) {
                shape = 'triangle-top-left';
            } else if (lesson.weekIndex === 1 && hasWeekAPartner) {
                shape = 'triangle-bottom-right';
            }

            return { ...lesson, shape };
        });
    }, [schedule]);

    const handleDrop = (lesson: ScheduledLessonDto, day: number, hour: number) => {
        onLessonMove(lesson.id, day, hour);
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">Weekly Schedule</h2>
                <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-indigo-200 rounded-sm"></div>
                        <span>Week A</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-200 rounded-sm"></div>
                        <span>Week B</span>
                    </div>
                </div>
            </div>

            {/* Grid Container */}
            <div
                className="grid flex-1 overflow-auto p-4 gap-1"
                style={{
                    // Grid Template: Time Column + N columns for days
                    gridTemplateColumns: `80px repeat(${days.length}, minmax(140px, 1fr))`,
                    // Rows: Header + Max Hours
                    gridTemplateRows: `40px repeat(${maxDailyHours}, 100px)`
                }}
            >
                {/* 1. Header Row */}
                <div className="font-bold text-gray-400 flex items-center justify-center">Time</div>
                {days.map((day) => (
                    <div key={day} className="font-bold text-gray-700 flex items-center justify-center uppercase tracking-wide text-sm bg-gray-50 rounded">
                        {day}
                    </div>
                ))}

                {/* 2. Time Labels (Side Column) and Drop Zones */}
                {Array.from({ length: maxDailyHours }).map((_, hIdx) => {
                    const hour = hIdx + 1;
                    return (
                        <React.Fragment key={`row-${hour}`}>
                            {/* Time Label */}
                            <div
                                className="flex flex-col items-center justify-center text-gray-400 text-xs font-medium border-t border-gray-50"
                                style={{ gridRow: hour + 1, gridColumn: 1 }}
                            >
                                <span>{hour}:00</span>
                                <span className="opacity-50">period {hour}</span>
                            </div>

                            {/* Drop Zones for each day in this hour */}
                            {days.map((_, dIdx) => (
                                <TimetableDropZone
                                    key={`zone-${dIdx}-${hour}`}
                                    dayIndex={dIdx}
                                    hourIndex={hour}
                                    currentSchedule={schedule}
                                    onDrop={handleDrop}
                                />
                            ))}
                        </React.Fragment>
                    );
                })}

                {/* 3. Render Lessons (Layered on top via Grid Positioning) */}
                {processedLessons.map((lesson) => (
                    <div
                        key={lesson.id}
                        style={{
                            gridColumn: lesson.dayIndex + 2, // +1 for time col, +1 for 1-based index
                            gridRow: `${lesson.hourIndex + 1} / span ${lesson.period}`, // +1 for header row
                            zIndex: 10
                        }}
                        className="p-1 h-full w-full pointer-events-none" // pointer-events-none wrapper so clicks pass through to dropzone "behind" if needed? 
                    // No, LessonCard needs pointer-events-auto.
                    >
                        <div className="h-full w-full pointer-events-auto relative">
                            <LessonCard
                                lesson={lesson}
                                shape={lesson.shape}
                                onClick={() => onLessonClick?.(lesson)}
                            />
                        </div>
                    </div>
                ))}

            </div>
        </div>
    );
};
