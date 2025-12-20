import React from 'react';
import { useDrag } from 'react-dnd';
import { ScheduledLessonDto } from '@/types/advancedTimetable';
import { cn } from '../ui/utils';
import { GripVertical } from 'lucide-react';

interface LessonCardProps {
    lesson: ScheduledLessonDto;
    isDraggable?: boolean;
    shape?: 'full' | 'triangle-top-left' | 'triangle-bottom-right';
    onClick?: () => void;
}

export const LessonCard: React.FC<LessonCardProps> = ({
    lesson,
    isDraggable = true,
    shape = 'full',
    onClick
}) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'lesson',
        item: lesson,
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }), [lesson]);

    const bgColors = [
        'bg-blue-100 border-blue-300 text-blue-900',
        'bg-purple-100 border-purple-300 text-purple-900',
        'bg-emerald-100 border-emerald-300 text-emerald-900',
        'bg-amber-100 border-amber-300 text-amber-900',
        'bg-rose-100 border-rose-300 text-rose-900',
    ];

    // Deterministic color based on subject name
    const colorIndex = Math.abs(lesson.subjectName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % bgColors.length;
    const colorClass = bgColors[colorIndex];

    const shapeStyles = {
        'full': '',
        'triangle-top-left': 'clip-path-triangle-tl',
        'triangle-bottom-right': 'clip-path-triangle-br',
    };

    return (
        <div
            ref={isDraggable ? (drag as any) : undefined}
            onClick={onClick}
            className={cn(
                "relative p-2 border text-xs font-medium cursor-pointer transition-all hover:brightness-95 hover:z-50 overflow-hidden",
                "flex flex-col gap-0.5",
                colorClass,
                shape === 'triangle-top-left' && "absolute inset-0 z-20 shadow-none border-b-0 border-r-0 rounded-tl-lg",
                shape === 'triangle-bottom-right' && "absolute inset-0 z-10 shadow-none border-t-0 border-l-0 rounded-br-lg justify-end items-end text-right",
                shape === 'full' && "h-full w-full rounded-lg shadow-sm",
                isDragging && "opacity-50",
                // Custom clip paths if we use CSS classes, but here we might need inline styles or specific utility classes
                // Note: Tailwind doesn't have default polygon clip-paths. We'll handle visual splitting via layout if possible, 
                // or standard CSS. "triangle-top-left" implies we want the content in top-left.
            )}
            style={{
                // If we strictly want diagonal cut:
                clipPath: shape === 'triangle-top-left' ? 'polygon(0 0, 100% 0, 0 100%)' :
                    shape === 'triangle-bottom-right' ? 'polygon(100% 0, 100% 100%, 0 100%)' : undefined
            }}
        >
            <div className={cn("flex items-center gap-1", shape === 'triangle-bottom-right' && "flex-row-reverse")}>
                {isDraggable && shape === 'full' && <GripVertical className="h-3 w-3 opacity-50" />}
                <span className="font-bold truncate">{lesson.subjectName}</span>
            </div>

            <div className={cn("flex flex-col", shape === 'triangle-bottom-right' && "items-end")}>
                <span className="truncate opacity-90">{lesson.groupNames}</span>
                {lesson.roomName && (
                    <span className="inline-flex items-center px-1 py-0.5 rounded bg-white/50 text-[10px] mt-0.5 w-fit">
                        {lesson.roomName}
                    </span>
                )}
            </div>

            {shape === 'full' && lesson.weekIndex !== null && (
                <div className="absolute top-1 right-1">
                    <span className={cn(
                        "text-[10px] px-1 py-0.5 rounded-full font-bold",
                        lesson.weekIndex === 0 ? "bg-indigo-200 text-indigo-800" : "bg-orange-200 text-orange-800"
                    )}>
                        {lesson.weekIndex === 0 ? 'A' : 'B'}
                    </span>
                </div>
            )}
        </div>
    );
};
