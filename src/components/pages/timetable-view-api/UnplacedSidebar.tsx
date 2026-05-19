import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { DraggableLessonCard } from '../timetable-view/DraggableLessonCard';
import { DisplayOptions, Lesson, UnplacedLesson } from '../timetable-view/types';

interface Props {
  unplacedLessons: UnplacedLesson[];
  displayOptions: DisplayOptions;
  selectedLesson: Lesson | UnplacedLesson | null;
  onEdit: (lesson: Lesson | UnplacedLesson) => void;
  onDelete: (lesson: Lesson | UnplacedLesson) => void;
  onToggleLock: (lesson: Lesson | UnplacedLesson) => void;
  onSelectLesson: (lesson: Lesson | UnplacedLesson) => void;
}

export function UnplacedSidebar({
  unplacedLessons,
  displayOptions,
  selectedLesson,
  onEdit,
  onDelete,
  onToggleLock,
  onSelectLesson,
}: Props) {
  return (
    <Card className="w-80 flex-shrink-0 shadow-sm h-fit sticky top-32 border-gray-200">
      <CardHeader className="bg-orange-50 border-b border-orange-100 p-4">
        <CardTitle className="flex items-center gap-2 text-orange-900 text-base">
          <AlertCircle className="h-5 w-5" />
          Unplaced Lessons
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">Drag to place manually</p>
      </CardHeader>
      <CardContent className="p-4 max-h-[calc(100vh-300px)] overflow-y-auto">
        {unplacedLessons.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p className="text-sm">All lessons placed!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {unplacedLessons.map((lesson) => (
              <div key={lesson.id}>
                <DraggableLessonCard
                  lesson={lesson}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggleLock={onToggleLock}
                  displayOptions={displayOptions}
                  isUnplaced
                  isSelected={selectedLesson?.id === lesson.id}
                  onSelect={onSelectLesson}
                />
                <div className="mt-1 mb-3 px-3 py-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800">
                  <span className="opacity-75">Reason:</span> {lesson.reason}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
