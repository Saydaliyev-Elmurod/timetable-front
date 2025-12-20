import React from 'react';
import { useDrop } from 'react-dnd';
import { ScheduledLessonDto } from '@/types/advancedTimetable';
import { cn } from '../ui/utils';
import { validateMove } from '@/utils/timetableValidation';

interface TimetableDropZoneProps {
    dayIndex: number;
    hourIndex: number; // 1-based usually, or 0-based. Let's stick to 0-based internally if easier, but DTO says 1, 2, 3...
    // DTO: hourIndex: number; // 1, 2, 3...
    currentSchedule: ScheduledLessonDto[];
    onDrop: (lesson: ScheduledLessonDto, day: number, hour: number) => void;
}

export const TimetableDropZone: React.FC<TimetableDropZoneProps> = ({
    dayIndex,
    hourIndex,
    currentSchedule,
    onDrop
}) => {
    const [{ isOver, canDrop }, drop] = useDrop(() => ({
        accept: 'lesson',
        canDrop: (item: ScheduledLessonDto) => {
            // Validate the move using our helper
            const result = validateMove(item, dayIndex, hourIndex, currentSchedule);
            return result.valid;
        },
        drop: (item: ScheduledLessonDto) => {
            onDrop(item, dayIndex, hourIndex);
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
        }),
    }), [dayIndex, hourIndex, currentSchedule, onDrop]);

    return (
        <div
            ref={drop as any}
            style={{
                gridColumn: dayIndex + 2, // +1 for time column, +1 because grid starts at 1
                gridRow: hourIndex + 1    // +1 because grid starts at 1 (header is row 1 usually)
            }}
            className={cn(
                "relative w-full h-full min-h-[80px] border-r border-b border-gray-100 transition-colors",
                isOver && canDrop && "bg-green-50/80",
                isOver && !canDrop && "bg-red-50/80",
                !isOver && "hover:bg-gray-50/50"
            )}
        >
            {/* Visual aid for dropping */}
            {isOver && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {canDrop ? (
                        <span className="text-green-600 font-bold text-xs uppercase tracking-wider">Drop Here</span>
                    ) : (
                        <span className="text-red-500 font-bold text-xs uppercase tracking-wider">Blocked</span>
                    )}
                </div>
            )}
        </div>
    );
};
