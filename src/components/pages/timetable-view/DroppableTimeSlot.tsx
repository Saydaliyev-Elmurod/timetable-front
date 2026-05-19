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
          'border border-red-300 p-1 transition-colors bg-red-50 relative cursor-pointer hover:bg-red-100',
          compact ? 'min-h-[60px]' : 'min-h-[70px]',
        );
      }
      if (manualPlacementStatus === 'room-conflict') {
        return cn(
          'border border-blue-300 p-1 transition-colors bg-blue-50 relative cursor-pointer hover:bg-blue-100',
          compact ? 'min-h-[60px]' : 'min-h-[70px]',
        );
      }
      return cn(
        'border border-green-400 p-1 transition-colors bg-green-50 relative cursor-pointer hover:bg-green-100 ring-1 ring-inset ring-green-200',
        compact ? 'min-h-[60px]' : 'min-h-[70px]',
      );
    }

    if (!draggedLesson || !allLessons) {
      return cn(
        'border border-gray-200 p-1 transition-colors relative',
        compact ? 'min-h-[60px]' : 'min-h-[70px]',
        isOver && canDrop && 'bg-blue-50 border-blue-300',
        lessons.length === 0 && 'hover:bg-gray-50',
      );
    }

    if (rowClass && draggedLesson.class !== rowClass) {
      return cn(
        'border border-gray-200 p-1 transition-colors relative opacity-50 bg-gray-100',
        compact ? 'min-h-[60px]' : 'min-h-[70px]',
      );
    }

    if (
      draggedLesson.day === day &&
      draggedLesson.timeSlot === timeSlot &&
      draggedLesson.class === rowClass
    ) {
      return cn(
        'border border-gray-200 p-1 transition-colors relative',
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
        'border border-red-300 p-1 transition-colors bg-red-100 relative',
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
          'border border-blue-300 p-1 transition-colors bg-blue-100 relative',
          compact ? 'min-h-[60px]' : 'min-h-[70px]',
        );
      }
    }

    return cn(
      'border border-green-300 p-1 transition-colors bg-green-100 relative',
      compact ? 'min-h-[60px]' : 'min-h-[70px]',
    );
  };

  return (
    <div
      ref={drop as any}
      className={getSlotStyle()}
      onClick={() => {
        if (selectedLesson && onManualPlace) {
          onManualPlace(day, timeSlot);
        }
      }}
    >
      {(() => {
        const weekALesson = lessons.find((l) => l.weekIndex === 0);
        const weekBLesson = lessons.find((l) => l.weekIndex === 1);
        const isWeekABPair = lessons.length === 2 && !!weekALesson && !!weekBLesson;

        if (isWeekABPair) {
          return (
            <div className="relative w-full h-full">
              <div
                className="absolute inset-0"
                style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)', zIndex: 10 }}
              >
                <div className="h-full w-full pr-[50%] pb-[50%]">
                  <DraggableLessonCard
                    lesson={weekALesson!}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleLock={onToggleLock}
                    displayOptions={displayOptions}
                    compact={true}
                    showClass={showClass}
                    hasConflict={
                      allLessons
                        ? allLessons.some(
                            (l) =>
                              l.id !== weekALesson!.id &&
                              l.day === day &&
                              l.timeSlot === timeSlot &&
                              (l.teacherId === weekALesson!.teacherId ||
                                (l.roomId !== 0 && l.roomId === weekALesson!.roomId) ||
                                l.classId === weekALesson!.classId),
                          )
                        : false
                    }
                    isSelected={selectedLesson?.id === weekALesson!.id}
                    onSelect={noopSelect}
                  />
                </div>
              </div>

              <div
                className="absolute inset-0"
                style={{ clipPath: 'polygon(100% 100%, 0 100%, 100% 0)', zIndex: 10 }}
              >
                <div className="h-full w-full pl-[50%] pt-[50%]">
                  <DraggableLessonCard
                    lesson={weekBLesson!}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleLock={onToggleLock}
                    displayOptions={displayOptions}
                    compact={true}
                    showClass={showClass}
                    hasConflict={
                      allLessons
                        ? allLessons.some(
                            (l) =>
                              l.id !== weekBLesson!.id &&
                              l.day === day &&
                              l.timeSlot === timeSlot &&
                              (l.teacherId === weekBLesson!.teacherId ||
                                (l.roomId !== 0 && l.roomId === weekBLesson!.roomId) ||
                                l.classId === weekBLesson!.classId),
                          )
                        : false
                    }
                    isSelected={selectedLesson?.id === weekBLesson!.id}
                    onSelect={noopSelect}
                  />
                </div>
              </div>
            </div>
          );
        }

        return (
          <div className="flex h-full w-full gap-1">
            {lessons.map((lesson) => {
              const lessonConflict = allLessons
                ? allLessons.some(
                    (l) =>
                      l.id !== lesson.id &&
                      l.day === day &&
                      l.timeSlot === timeSlot &&
                      (l.teacherId === lesson.teacherId ||
                        (l.roomId !== 0 && l.roomId === lesson.roomId) ||
                        l.classId === lesson.classId),
                  )
                : false;

              const isSingleBiWeekly = lessons.length === 1 && lesson.isBiWeekly;

              return (
                <div
                  key={lesson.id}
                  className={cn('relative', isSingleBiWeekly ? 'w-1/2' : 'flex-1')}
                >
                  <DraggableLessonCard
                    lesson={lesson}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleLock={onToggleLock}
                    displayOptions={displayOptions}
                    compact={compact || lessons.length > 1}
                    showClass={showClass}
                    hasConflict={lessonConflict}
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
