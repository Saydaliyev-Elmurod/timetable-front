import React from 'react';
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
  const sharedGridProps = {
    lessons: filteredLessons,
    onDrop,
    onEdit,
    onDelete,
    onToggleLock,
    displayOptions,
    timeSlots,
    draggedLesson,
    allLessons: scheduledLessons,
    selectedLesson,
    onManualPlace,
  };

  if (viewMode === 'classes') {
    return (
      <div className="space-y-6">
        {classesToDisplay.length > 0
          ? classesToDisplay.map((className) => (
              <ClassViewGrid key={className} className={className} {...sharedGridProps} />
            ))
          : <EmptyState message="No scheduled lessons found." />}
      </div>
    );
  }

  if (viewMode === 'teachers') {
    return (
      <div className="space-y-6">
        {teachersToDisplay.length > 0
          ? teachersToDisplay.map((teacherName) => (
              <TeacherViewGrid key={teacherName} teacherName={teacherName} {...sharedGridProps} />
            ))
          : <EmptyState message="No scheduled lessons found for this teacher." />}
      </div>
    );
  }

  if (viewMode === 'rooms') {
    return (
      <div className="space-y-6">
        {roomsToDisplay.length > 0
          ? roomsToDisplay.map((roomName) => (
              <RoomViewGrid key={roomName} roomName={roomName} {...sharedGridProps} />
            ))
          : <EmptyState message="No scheduled lessons found for this room." />}
      </div>
    );
  }

  return <CompactViewGrid classes={allClasses} {...sharedGridProps} />;
}
