import React, { useMemo, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { DisplayOptions, Lesson, UnplacedLesson } from '../timetable-view/types';
import {
  ClassViewGrid,
  CompactViewGrid,
  RoomViewGrid,
  TeacherViewGrid,
} from '../timetable-view/grids';
import { ViewMode } from './TimetableHeader';

interface Props {
  viewMode: ViewMode;
  filteredLessons: Lesson[];
  scheduledLessons: Lesson[];
  classesToDisplay: string[];
  teachersToDisplay: string[];
  roomsToDisplay: string[];
  allClasses: string[];
  timeSlots: number[];
  displayOptions: DisplayOptions;
  draggedLesson: Lesson | null;
  selectedLesson: Lesson | UnplacedLesson | null;
  onDrop: (lesson: Lesson, day: string, timeSlot: number) => void;
  onEdit: (lesson: Lesson | UnplacedLesson) => void;
  onDelete: (lesson: Lesson | UnplacedLesson) => void;
  onToggleLock: (lesson: Lesson | UnplacedLesson) => void;
  onManualPlace: (day: string, timeSlot: number) => void;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
      <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

export function MainGrid({
  viewMode,
  filteredLessons,
  scheduledLessons,
  classesToDisplay,
  teachersToDisplay,
  roomsToDisplay,
  allClasses,
  timeSlots,
  displayOptions,
  draggedLesson,
  selectedLesson,
  onDrop,
  onEdit,
  onDelete,
  onToggleLock,
  onManualPlace,
}: Props) {
  // Lazy-mount + cache: a view is built on first visit and kept mounted (hidden
  // via .cv-view-cached) so re-switching is instant with no remount cost.
  const visited = useRef<Set<ViewMode>>(new Set()).current;
  visited.add(viewMode);

  // Props every grid shares (data + handlers). Drag-only props are threaded
  // separately so inactive views can be frozen from drag updates.
  const shared = {
    lessons: filteredLessons,
    onDrop,
    onEdit,
    onDelete,
    onToggleLock,
    displayOptions,
    timeSlots,
    allLessons: scheduledLessons,
    onManualPlace,
  };

  // Freeze: inactive views receive null drag props, AND their useMemo dep on the
  // drag value collapses to null — so during a drag (viewMode stable) only the
  // active view recomputes. Switching views recomputes the now-active view once
  // (viewMode is in the deps), so it picks up the live drag state on activation.
  const classesEl = useMemo(() => {
    if (!visited.has('classes')) return null;
    const isActive = viewMode === 'classes';
    const dl = isActive ? draggedLesson : null;
    const sl = isActive ? selectedLesson : null;
    return classesToDisplay.length > 0 ? (
      <div className="space-y-6">
        {classesToDisplay.map((className) => (
          <ClassViewGrid
            key={className}
            className={className}
            {...shared}
            draggedLesson={dl}
            selectedLesson={sl}
          />
        ))}
      </div>
    ) : (
      <EmptyState message="No scheduled lessons found." />
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    viewMode,
    classesToDisplay,
    filteredLessons,
    scheduledLessons,
    displayOptions,
    timeSlots,
    onDrop,
    onEdit,
    onDelete,
    onToggleLock,
    onManualPlace,
    viewMode === 'classes' ? draggedLesson : null,
    viewMode === 'classes' ? selectedLesson : null,
  ]);

  const teachersEl = useMemo(() => {
    if (!visited.has('teachers')) return null;
    const isActive = viewMode === 'teachers';
    const dl = isActive ? draggedLesson : null;
    const sl = isActive ? selectedLesson : null;
    return teachersToDisplay.length > 0 ? (
      <div className="space-y-6">
        {teachersToDisplay.map((teacherName) => (
          <TeacherViewGrid
            key={teacherName}
            teacherName={teacherName}
            {...shared}
            draggedLesson={dl}
            selectedLesson={sl}
          />
        ))}
      </div>
    ) : (
      <EmptyState message="No scheduled lessons found for this teacher." />
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    viewMode,
    teachersToDisplay,
    filteredLessons,
    scheduledLessons,
    displayOptions,
    timeSlots,
    onDrop,
    onEdit,
    onDelete,
    onToggleLock,
    onManualPlace,
    viewMode === 'teachers' ? draggedLesson : null,
    viewMode === 'teachers' ? selectedLesson : null,
  ]);

  const roomsEl = useMemo(() => {
    if (!visited.has('rooms')) return null;
    const isActive = viewMode === 'rooms';
    const dl = isActive ? draggedLesson : null;
    const sl = isActive ? selectedLesson : null;
    return roomsToDisplay.length > 0 ? (
      <div className="space-y-6">
        {roomsToDisplay.map((roomName) => (
          <RoomViewGrid
            key={roomName}
            roomName={roomName}
            {...shared}
            draggedLesson={dl}
            selectedLesson={sl}
          />
        ))}
      </div>
    ) : (
      <EmptyState message="No scheduled lessons found for this room." />
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    viewMode,
    roomsToDisplay,
    filteredLessons,
    scheduledLessons,
    displayOptions,
    timeSlots,
    onDrop,
    onEdit,
    onDelete,
    onToggleLock,
    onManualPlace,
    viewMode === 'rooms' ? draggedLesson : null,
    viewMode === 'rooms' ? selectedLesson : null,
  ]);

  const compactEl = useMemo(() => {
    if (!visited.has('compact')) return null;
    const isActive = viewMode === 'compact';
    const dl = isActive ? draggedLesson : null;
    const sl = isActive ? selectedLesson : null;
    return (
      <CompactViewGrid classes={allClasses} {...shared} draggedLesson={dl} selectedLesson={sl} />
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    viewMode,
    allClasses,
    filteredLessons,
    scheduledLessons,
    displayOptions,
    timeSlots,
    onDrop,
    onEdit,
    onDelete,
    onToggleLock,
    onManualPlace,
    viewMode === 'compact' ? draggedLesson : null,
    viewMode === 'compact' ? selectedLesson : null,
  ]);

  const views: Array<{ mode: ViewMode; el: React.ReactNode }> = [
    { mode: 'classes', el: classesEl },
    { mode: 'teachers', el: teachersEl },
    { mode: 'rooms', el: roomsEl },
    { mode: 'compact', el: compactEl },
  ];

  return (
    <div className="relative">
      {views.map(({ mode, el }) =>
        el == null ? null : (
          // content-visibility:hidden also removes the cached view's contents
          // from the tab order and a11y tree, so no inert needed.
          <div
            key={mode}
            className={mode === viewMode ? undefined : 'cv-view-cached'}
            aria-hidden={mode !== viewMode}
          >
            {el}
          </div>
        ),
      )}
    </div>
  );
}
