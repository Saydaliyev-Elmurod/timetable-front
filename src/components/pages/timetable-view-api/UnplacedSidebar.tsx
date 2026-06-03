import React from 'react';
import { AlertCircle, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
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
  /** Panel yopiq holatda — faqat tor bar ko'rinadi. */
  collapsed: boolean;
  /** > / < tugma bosilganda yopish/ochish. */
  onToggleCollapse: () => void;
}

export function UnplacedSidebar({
  unplacedLessons,
  displayOptions,
  selectedLesson,
  onEdit,
  onDelete,
  onToggleLock,
  onSelectLesson,
  collapsed,
  onToggleCollapse,
}: Props) {
  // Yopiq: tor vertikal bar, gorizontal scrollda ham doim ko'rinadi (pin).
  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onToggleCollapse}
        title="Joylashtirilmagan darslarni ochish"
        className="w-10 flex-shrink-0 sticky top-32 self-start flex flex-col items-center gap-2 py-3 rounded-lg border border-orange-200 bg-orange-50 hover:bg-orange-100 transition-colors"
      >
        <ChevronLeft className="h-5 w-5 text-orange-700" />
        <AlertCircle className="h-5 w-5 text-orange-700" />
        {unplacedLessons.length > 0 && (
          <span className="text-xs font-semibold text-white bg-orange-500 rounded-full w-6 h-6 flex items-center justify-center">
            {unplacedLessons.length}
          </span>
        )}
        <span
          className="text-xs font-medium text-orange-800 mt-1"
          style={{ writingMode: 'vertical-rl' }}
        >
          Unplaced
        </span>
      </button>
    );
  }

  // Ochiq: to'liq sidebar (sticky, pin).
  return (
    <Card className="w-80 flex-shrink-0 shadow-sm h-fit sticky top-32 self-start border-gray-200">
      <CardHeader className="bg-orange-50 border-b border-orange-100 p-4">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-orange-900 text-base">
            <AlertCircle className="h-5 w-5" />
            Unplaced Lessons
          </CardTitle>
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Yopish"
            className="flex-shrink-0 p-1 rounded hover:bg-orange-100 text-orange-700 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
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
              <div key={lesson.id} className="cv-list-item">

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
