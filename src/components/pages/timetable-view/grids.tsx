import React, { useMemo } from 'react';
import { User, DoorOpen, Edit } from 'lucide-react';
import { cn } from '../../ui/utils';
import { DroppableTimeSlot } from './DroppableTimeSlot';
import { DAYS, DAY_LABELS_SHORT } from './constants';
import { DisplayOptions, Lesson, UnplacedLesson } from './types';
import { useEntityEdit } from './EntityEditContext';

// Helpers — build a `${day}-${period}` (or `${className}-${day}-${period}`) →
// Lesson[] index in one pass, so each grid cell does an O(1) lookup instead of
// `lessons.filter(...)` per cell. With 56 cells per class × 10 classes, this
// cuts 560 filter passes per render down to a single map build.

const cellKey = (day: string, period: number) => `${day}-${period}`;

function indexLessonsByCell(
  lessons: Lesson[],
  filter: (l: Lesson) => boolean,
): Map<string, Lesson[]> {
  const idx = new Map<string, Lesson[]>();
  for (const l of lessons) {
    if (!l.day || !l.timeSlot || !filter(l)) continue;
    const k = cellKey(l.day, l.timeSlot);
    const bucket = idx.get(k);
    if (bucket) bucket.push(l);
    else idx.set(k, [l]);
  }
  return idx;
}

const EMPTY_LESSONS: Lesson[] = [];

interface ViewGridBaseProps {
  lessons: Lesson[];
  onDrop: (lesson: Lesson, day: string, timeSlot: number) => void;
  onEdit: (lesson: Lesson) => void;
  onDelete: (lesson: Lesson) => void;
  onToggleLock: (lesson: Lesson) => void;
  displayOptions: DisplayOptions;
  timeSlots: number[];
  draggedLesson?: Lesson | null;
  allLessons?: Lesson[];
  selectedLesson?: Lesson | UnplacedLesson | null;
  onManualPlace?: (day: string, timeSlot: number) => void;
}

interface ClassViewGridProps extends ViewGridBaseProps {
  className: string;
  onSelectLesson?: (lesson: Lesson | UnplacedLesson) => void;
}

export const ClassViewGrid = ({
  className,
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
}: ClassViewGridProps) => {
  const { openEditor } = useEntityEdit();
  const classId = useMemo(
    () => (allLessons ?? lessons).find((l) => l.class === className)?.classId,
    [allLessons, lessons, className],
  );
  const cellIndex = useMemo(
    () => indexLessonsByCell(lessons, (l) => l.class === className),
    [lessons, className],
  );
  const getLessons = (day: string, timeSlot: number) =>
    cellIndex.get(cellKey(day, timeSlot)) ?? EMPTY_LESSONS;

  const isTargetClass = draggedLesson?.class === className;

  return (
    <div
      className={cn(
        'cv-grid-isolate bg-white rounded-lg border border-gray-200 overflow-hidden mb-6 transition-all',
        isTargetClass && 'ring-4 ring-green-400 border-green-500 shadow-lg',
      )}
    >
      <div
        className={cn(
          'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-3 flex items-center justify-between gap-2',
          isTargetClass && 'from-green-600 to-green-700',
        )}
      >
        <h3 className="font-semibold truncate">Class {className}</h3>
        {classId ? (
          <button
            type="button"
            onClick={() => openEditor('class', classId)}
            title="Sinfni tahrirlash"
            className="shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors"
          >
            <Edit className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      <div className="p-4 overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-[44px_repeat(6,minmax(0,1fr))] gap-0 border border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-gray-100 p-1 flex items-center justify-center border-r border-gray-300 min-w-0">
              <span className="text-xs font-semibold text-gray-500">#</span>
            </div>
            {DAYS.map((day) => (
              <div
                key={day}
                className="bg-gray-100 p-1.5 flex items-center justify-center border-r border-gray-300 last:border-r-0 min-w-0"
              >
                <span className="text-sm font-semibold text-gray-600 truncate">{DAY_LABELS_SHORT[day]}</span>
              </div>
            ))}

            {timeSlots.map((slotId) => (
              <React.Fragment key={slotId}>
                <div className="bg-gray-50 p-1 flex flex-col items-center justify-center border-r border-t border-gray-200">
                  <span className="text-sm font-semibold text-gray-600">{slotId}</span>
                </div>
                {DAYS.map((day) => (
                  <DroppableTimeSlot
                    key={`${className}-${day}-${slotId}`}
                    day={day}
                    timeSlot={slotId}
                    lessons={getLessons(day, slotId)}
                    onDrop={onDrop}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleLock={onToggleLock}
                    displayOptions={displayOptions}
                    compact={true}
                    draggedLesson={draggedLesson}
                    allLessons={allLessons}
                    rowClass={className}
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
};

interface TeacherViewGridProps extends ViewGridBaseProps {
  teacherName: string;
}

export const TeacherViewGrid = ({
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
}: TeacherViewGridProps) => {
  const { openEditor } = useEntityEdit();
  const teacherId = useMemo(
    () => (allLessons ?? lessons).find((l) => l.teacher === teacherName)?.teacherId,
    [allLessons, lessons, teacherName],
  );
  const cellIndex = useMemo(
    () => indexLessonsByCell(lessons, (l) => l.teacher === teacherName),
    [lessons, teacherName],
  );
  const getLessons = (day: string, timeSlot: number) =>
    cellIndex.get(cellKey(day, timeSlot)) ?? EMPTY_LESSONS;

  return (
    <div className="cv-grid-isolate bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <User className="h-5 w-5 shrink-0" />
          <h3 className="font-semibold truncate">{teacherName}</h3>
        </div>
        {teacherId ? (
          <button
            type="button"
            onClick={() => openEditor('teacher', teacherId)}
            title="O'qituvchini tahrirlash"
            className="shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors"
          >
            <Edit className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      <div className="p-4 overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-[44px_repeat(6,minmax(0,1fr))] gap-0 border border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-gray-100 p-1 flex items-center justify-center border-r border-gray-300 min-w-0">
              <span className="text-xs font-semibold text-gray-500">#</span>
            </div>
            {DAYS.map((day) => (
              <div
                key={day}
                className="bg-gray-100 p-1.5 flex items-center justify-center border-r border-gray-300 last:border-r-0 min-w-0"
              >
                <span className="text-sm font-semibold text-gray-600 truncate">{DAY_LABELS_SHORT[day]}</span>
              </div>
            ))}

            {timeSlots.map((slotId) => (
              <React.Fragment key={slotId}>
                <div className="bg-gray-50 p-1 flex flex-col items-center justify-center border-r border-t border-gray-200">
                  <span className="text-sm font-semibold text-gray-600">{slotId}</span>
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
};

interface RoomViewGridProps extends ViewGridBaseProps {
  roomName: string;
}

export const RoomViewGrid = ({
  roomName,
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
}: RoomViewGridProps) => {
  const { openEditor } = useEntityEdit();
  const roomId = useMemo(
    () => (allLessons ?? lessons).find((l) => l.room === roomName)?.roomId,
    [allLessons, lessons, roomName],
  );
  const cellIndex = useMemo(
    () => indexLessonsByCell(lessons, (l) => l.room === roomName),
    [lessons, roomName],
  );
  const getLessons = (day: string, timeSlot: number) =>
    cellIndex.get(cellKey(day, timeSlot)) ?? EMPTY_LESSONS;

  return (
    <div className="cv-grid-isolate bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-6 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <DoorOpen className="h-5 w-5 shrink-0" />
          <h3 className="font-semibold truncate">{roomName}</h3>
        </div>
        {roomId ? (
          <button
            type="button"
            onClick={() => openEditor('room', roomId)}
            title="Xonani tahrirlash"
            className="shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors"
          >
            <Edit className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      <div className="p-4 overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-[44px_repeat(6,minmax(0,1fr))] gap-0 border border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-gray-100 p-1 flex items-center justify-center border-r border-gray-300 min-w-0">
              <span className="text-xs font-semibold text-gray-500">#</span>
            </div>
            {DAYS.map((day) => (
              <div
                key={day}
                className="bg-gray-100 p-1.5 flex items-center justify-center border-r border-gray-300 last:border-r-0 min-w-0"
              >
                <span className="text-sm font-semibold text-gray-600 truncate">{DAY_LABELS_SHORT[day]}</span>
              </div>
            ))}

            {timeSlots.map((slotId) => (
              <React.Fragment key={slotId}>
                <div className="bg-gray-50 p-1 flex flex-col items-center justify-center border-r border-t border-gray-200">
                  <span className="text-sm font-semibold text-gray-600">{slotId}</span>
                </div>
                {DAYS.map((day) => (
                  <DroppableTimeSlot
                    key={`${roomName}-${day}-${slotId}`}
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
};

interface CompactViewGridProps extends ViewGridBaseProps {
  classes: string[];
}

export const CompactViewGrid = ({
  lessons,
  classes,
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
}: CompactViewGridProps) => {
  // Compact view needs a class-aware key: `${className}-${day}-${period}`.
  const cellIndex = useMemo(() => {
    const idx = new Map<string, Lesson[]>();
    for (const l of lessons) {
      if (!l.day || !l.timeSlot) continue;
      const k = `${l.class}-${l.day}-${l.timeSlot}`;
      const bucket = idx.get(k);
      if (bucket) bucket.push(l);
      else idx.set(k, [l]);
    }
    return idx;
  }, [lessons]);
  const getLessons = (className: string, day: string, timeSlot: number) =>
    cellIndex.get(`${className}-${day}-${timeSlot}`) ?? EMPTY_LESSONS;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 overflow-auto max-h-[75vh]">
        <div className="min-w-max">
          <div className="border border-gray-300 rounded-lg">
            <div
              className="grid gap-0 sticky top-0 z-30 shadow-sm"
              style={{
                gridTemplateColumns: `52px 48px repeat(${classes.length}, 140px)`,
              }}
            >
              <div className="bg-indigo-600 text-white p-2 flex items-center justify-center border-r border-indigo-500 sticky left-0 z-40">
                <span className="text-xs font-medium">Day</span>
              </div>
              <div className="bg-indigo-600 text-white p-2 flex items-center justify-center border-r border-indigo-500 sticky left-[52px] z-40">
                <span className="text-xs font-medium">#</span>
              </div>
              {classes.map((className) => {
                const isTargetClass = draggedLesson?.class === className;
                return (
                  <div
                    key={className}
                    className={cn(
                      'text-white p-3 flex items-center justify-center border-r border-indigo-500 last:border-r-0 transition-colors min-w-0',
                      isTargetClass
                        ? 'bg-gradient-to-r from-green-600 to-green-700'
                        : 'bg-gradient-to-r from-indigo-600 to-indigo-700',
                    )}
                  >
                    <span className="text-sm font-medium truncate">{className}</span>
                  </div>
                );
              })}
            </div>

            {DAYS.map((day, dayIndex) => (
              <div
                key={day}
                className={cn(
                  'flex border-t border-gray-200',
                  dayIndex > 0 && 'border-t-4 border-indigo-600',
                )}
              >
                <div className="bg-gray-50 p-1 flex items-center justify-center border-r border-gray-200 w-[52px] flex-shrink-0 sticky left-0 z-20">
                  <span className="text-xs font-semibold text-gray-600 tracking-wide [writing-mode:vertical-rl] rotate-180">{DAY_LABELS_SHORT[day]}</span>
                </div>

                <div className="flex-1">
                  {timeSlots.map((slotId) => (
                    <div
                      key={`${day}-${slotId}`}
                      className="grid gap-0 border-t first:border-t-0 border-gray-200"
                      style={{
                        gridTemplateColumns: `48px repeat(${classes.length}, 140px)`,
                      }}
                    >
                      <div className="bg-gray-50 p-1 flex items-center justify-center border-r border-gray-200 sticky left-[52px] z-20">
                        <span className="text-sm font-semibold text-gray-600">{slotId}</span>
                      </div>

                      {classes.map((className) => (
                        <DroppableTimeSlot
                          key={`${className}-${day}-${slotId}`}
                          day={day}
                          timeSlot={slotId}
                          lessons={getLessons(className, day, slotId)}
                          onDrop={onDrop}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          onToggleLock={onToggleLock}
                          displayOptions={displayOptions}
                          compact={true}
                          draggedLesson={draggedLesson}
                          allLessons={allLessons}
                          rowClass={className}
                          selectedLesson={selectedLesson}
                          onManualPlace={onManualPlace}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
