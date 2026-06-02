import React, { useMemo } from 'react';
import { useDrop } from 'react-dnd';
import { cn } from '../../ui/utils';
import { DraggableLessonCard } from './DraggableLessonCard';
import { DisplayOptions, Lesson, UnplacedLesson } from './types';

// Stable empty handler — passing `() => {}` inline busts DraggableLessonCard's memo.
const noopSelect = (_lesson: Lesson | UnplacedLesson) => {};

interface DroppableTimeSlotProps {
  day: string;
  timeSlot: number;
  lessons?: Lesson[];
  onDrop: (lesson: Lesson, day: string, timeSlot: number) => void;
  onEdit: (lesson: Lesson) => void;
  onDelete: (lesson: Lesson) => void;
  onToggleLock: (lesson: Lesson) => void;
  displayOptions: DisplayOptions;
  compact?: boolean;
  showClass?: boolean;
  draggedLesson?: Lesson | null;
  allLessons?: Lesson[];
  rowClass?: string;
  selectedLesson?: Lesson | UnplacedLesson | null;
  onManualPlace?: (day: string, timeSlot: number) => void;
}

const DroppableTimeSlotImpl = ({
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
}: DroppableTimeSlotProps) => {
  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: 'lesson',
      canDrop: (item: Lesson) => {
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
    [day, timeSlot, rowClass],
  );

  const manualPlacementStatus = useMemo(() => {
    if (!selectedLesson || !allLessons) return 'none';

    if (rowClass && selectedLesson.class !== rowClass) {
      return 'invalid-target';
    }

    const teacherConflict = allLessons.some(
      (l) =>
        l.id !== selectedLesson.id &&
        l.teacherId === selectedLesson.teacherId &&
        l.day === day &&
        l.timeSlot === timeSlot,
    );
    if (teacherConflict) return 'teacher-conflict';

    if (selectedLesson.roomId) {
      const roomConflict = allLessons.some(
        (l) =>
          l.id !== selectedLesson.id &&
          l.roomId === selectedLesson.roomId &&
          l.day === day &&
          l.timeSlot === timeSlot,
      );
      if (roomConflict) return 'room-conflict';
    }

    return 'valid';
  }, [selectedLesson, allLessons, day, timeSlot, rowClass]);

  const getSlotStyle = () => {
    if (selectedLesson) {
      if (manualPlacementStatus === 'invalid-target') {
        return cn(
          'border border-gray-200 p-1 transition-colors relative opacity-40 bg-gray-50',
          compact ? 'min-h-[60px]' : 'min-h-[70px]',
        );
      }
      if (manualPlacementStatus === 'teacher-conflict') {
        return cn(
          'border border-red-300 p-0 transition-colors bg-red-50 relative cursor-pointer hover:bg-red-100',
          compact ? 'min-h-[60px]' : 'min-h-[70px]',
        );
      }
      if (manualPlacementStatus === 'room-conflict') {
        return cn(
          'border border-blue-300 p-0 transition-colors bg-blue-50 relative cursor-pointer hover:bg-blue-100',
          compact ? 'min-h-[60px]' : 'min-h-[70px]',
        );
      }
      return cn(
        'border border-green-400 p-0 transition-colors bg-green-50 relative cursor-pointer hover:bg-green-100 ring-1 ring-inset ring-green-200',
        compact ? 'min-h-[60px]' : 'min-h-[70px]',
      );
    }

    if (isOver) {
      if (!canDrop) {
        return cn(
          'border border-red-400 p-0 transition-colors bg-red-50 relative opacity-50',
          compact ? 'min-h-[60px]' : 'min-h-[70px]',
        );
      }
      return cn(
        'border border-green-400 p-0 transition-colors bg-green-50 relative cursor-pointer hover:bg-green-100 ring-1 ring-inset ring-green-200',
        compact ? 'min-h-[60px]' : 'min-h-[70px]',
      );
    }

    if (!draggedLesson || !allLessons) {
      return cn(
        'border border-gray-200 p-0 transition-colors relative',
        compact ? 'min-h-[60px]' : 'min-h-[70px]',
        isOver && canDrop && 'bg-blue-50 border-blue-300',
        lessons.length === 0 && 'hover:bg-gray-50',
      );
    }

    if (rowClass && draggedLesson.class !== rowClass) {
      return cn(
        'border border-gray-200 p-0 transition-colors relative opacity-50 bg-gray-100',
        compact ? 'min-h-[60px]' : 'min-h-[70px]',
      );
    }

    if (
      draggedLesson.day === day &&
      draggedLesson.timeSlot === timeSlot &&
      draggedLesson.class === rowClass
    ) {
      return cn(
        'border border-gray-200 p-0 transition-colors relative',
        compact ? 'min-h-[60px]' : 'min-h-[70px]',
        'bg-gray-50',
      );
    }

    const teacherConflict = allLessons.some(
      (l) =>
        l.id !== draggedLesson.id &&
        l.teacherId === draggedLesson.teacherId &&
        l.day === day &&
        l.timeSlot === timeSlot,
    );

    if (teacherConflict) {
      return cn(
        'border border-red-300 p-0 transition-colors bg-red-100 relative',
        compact ? 'min-h-[60px]' : 'min-h-[70px]',
      );
    }

    if (draggedLesson.roomId) {
      const roomConflict = allLessons.some(
        (l) =>
          l.id !== draggedLesson.id &&
          l.roomId === draggedLesson.roomId &&
          l.day === day &&
          l.timeSlot === timeSlot,
      );

      if (roomConflict) {
        return cn(
          'border border-blue-300 p-0 transition-colors bg-blue-100 relative',
          compact ? 'min-h-[60px]' : 'min-h-[70px]',
        );
      }
    }

    return cn(
      'border border-green-300 p-0 transition-colors bg-green-100 relative',
      compact ? 'min-h-[60px]' : 'min-h-[70px]',
    );
  };

  return (
    <div
      ref={drop as any}
      className={cn(getSlotStyle(), 'min-w-0')}
      onClick={() => {
        if (selectedLesson && onManualPlace) {
          onManualPlace(day, timeSlot);
        }
      }}
    >
      {(() => {
        const checkConflict = (currentLesson: typeof lessons[0]) => {
          if (!allLessons) return false;
          return allLessons.some((l) => {
            if (l.id === currentLesson.id) return false;
            if (l.day !== day || l.timeSlot !== timeSlot) return false;
            
            if (l.teacherId && currentLesson.teacherId && l.teacherId === currentLesson.teacherId) return true;
            if (l.roomId && currentLesson.roomId && l.roomId === currentLesson.roomId) return true;
            
            if (l.classId === currentLesson.classId) {
              if (l.groupName && currentLesson.groupName && l.groupName !== currentLesson.groupName) return false;
              if (l.weekIndex !== null && currentLesson.weekIndex !== null && l.weekIndex !== currentLesson.weekIndex) return false;
              return true;
            }
            return false;
          });
        };

        const weekALesson = lessons.find((l) => l.weekIndex === 0);
        const weekBLesson = lessons.find((l) => l.weekIndex === 1);
        const hasBiWeekly = lessons.some((l) => l.isBiWeekly || l.weekIndex === 0 || l.weekIndex === 1);

        if (hasBiWeekly) {
          return (
            <div className="flex flex-col h-full w-full gap-0">
              {weekALesson && (
                <div className="relative min-h-0 flex-1 border-b border-gray-300">
                  <DraggableLessonCard
                    lesson={weekALesson}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleLock={onToggleLock}
                    displayOptions={displayOptions}
                    compact={true}
                    showClass={showClass}
                    hasConflict={checkConflict(weekALesson)}
                    isSelected={selectedLesson?.id === weekALesson.id}
                    onSelect={noopSelect}
                  />
                </div>
              )}
              {weekBLesson && (
                <div className="relative min-h-0 flex-1">
                  <DraggableLessonCard
                    lesson={weekBLesson}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleLock={onToggleLock}
                    displayOptions={displayOptions}
                    compact={true}
                    showClass={showClass}
                    hasConflict={checkConflict(weekBLesson)}
                    isSelected={selectedLesson?.id === weekBLesson.id}
                    onSelect={noopSelect}
                  />
                </div>
              )}
            </div>
          );
        }

        return (
          <div className="flex h-full w-full gap-0">
            {lessons.map((lesson) => {
              return (
                <div
                  key={lesson.id}
                  className="relative min-w-0 flex-1 border-r border-gray-300 last:border-r-0"
                >
                  <DraggableLessonCard
                    lesson={lesson}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleLock={onToggleLock}
                    displayOptions={displayOptions}
                    compact={compact || lessons.length > 1}
                    showClass={showClass}
                    hasConflict={checkConflict(lesson)}
                    isSelected={selectedLesson?.id === lesson.id}
                    onSelect={noopSelect}
                  />
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
};

export const DroppableTimeSlot = React.memo(DroppableTimeSlotImpl);
