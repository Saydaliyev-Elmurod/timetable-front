import React, { useState, useEffect, useMemo } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Label } from "../ui/label";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "../ui/toggle-group";
import { Toggle } from "../ui/toggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { Separator } from "../ui/separator";
import { Alert, AlertDescription } from "../ui/alert";
import {
  FileDown,
  RefreshCw,
  Lock,
  Unlock,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle2,
  GripVertical,
  ArrowLeft,
  User,
  DoorOpen,
  BookOpen,
  Filter,
  Users,
  Building2,
  Grid3x3,
  Loader2,
  Info,
} from "lucide-react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { cn } from "../ui/utils";
import { toast } from "sonner@2.0.3";
import { 
  timetableActionApi, 
  TimetableActionRequest, 
  ActionResponse, 
  ValidationResponse,
  initializeMockLessons
} from "../api/timetableActionApi";

// API Types based on backend entities
interface TimeSlot {
  dayOfWeek: string;
  lessons: number[];
}

interface TeacherResponse {
  id: number;
  fullName: string;
  shortName: string;
  availabilities: TimeSlot[];
  createdDate: string;
  updatedDate: string;
}

interface SubjectResponse {
  id: number;
  shortName: string;
  name: string;
  availabilities: TimeSlot[];
}

interface RoomResponse {
  id: number;
  name: string;
}

interface ClassResponse {
  id: number;
  shortName: string;
  name: string;
  availabilities: TimeSlot[];
  teacher: TeacherResponse;
  rooms: RoomResponse[];
  updatedDate: string;
  createdDate: string;
}

interface ScheduledData {
  day: string;
  hour: number;
  teacher: TeacherResponse;
  subject: SubjectResponse;
  classObj: ClassResponse;
  roomId: number;
}

interface UnscheduledLesson {
  classInfo: ClassResponse;
  teacher: TeacherResponse;
  subject: SubjectResponse;
  requiredCount: number;
  scheduledCount: number;
  missingCount: number;
}

interface TimetableDataEntity {
  id: string;
  timetableId: string;
  isScheduled: boolean;
  subjectId: number;
  classId: number;
  roomId: number;
  teacherId: number;
  dayOfWeek: string;
  hour: number;
  scheduledData: ScheduledData | null;
  unscheduledData: UnscheduledLesson | null;
  version: number;
}

// Internal Lesson format (for DnD and display)
interface Lesson {
  id: string;
  subject: string;
  subjectId: number;
  teacher: string;
  teacherId: number;
  teacherShort: string;
  room: string;
  roomId: number;
  class: string;
  classId: number;
  day?: string;
  timeSlot?: number;
  isLocked?: boolean;
}

interface UnplacedLesson extends Lesson {
  reason: string;
  requiredCount?: number;
  scheduledCount?: number;
  missingCount?: number;
}

interface DisplayOptions {
  showTeacher: boolean;
  showRoom: boolean;
  showSubject: boolean;
}

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "bg-blue-100 border-blue-300 text-blue-900",
  Physics: "bg-purple-100 border-purple-300 text-purple-900",
  Chemistry: "bg-green-100 border-green-300 text-green-900",
  English: "bg-orange-100 border-orange-300 text-orange-900",
  History: "bg-amber-100 border-amber-300 text-amber-900",
  "P.E.": "bg-red-100 border-red-300 text-red-900",
  Biology: "bg-emerald-100 border-emerald-300 text-emerald-900",
  Art: "bg-pink-100 border-pink-300 text-pink-900",
};

// Draggable Lesson Card Component
const DraggableLessonCard = ({
  lesson,
  onEdit,
  onDelete,
  onToggleLock,
  displayOptions,
  isUnplaced = false,
  compact = false,
  showClass = false,
}: {
  lesson: Lesson | UnplacedLesson;
  onEdit: (lesson: Lesson | UnplacedLesson) => void;
  onDelete: (lesson: Lesson | UnplacedLesson) => void;
  onToggleLock: (lesson: Lesson | UnplacedLesson) => void;
  displayOptions: DisplayOptions;
  isUnplaced?: boolean;
  compact?: boolean;
  showClass?: boolean;
}) => {
  const [{ opacity }, drag] = useDrag(
    () => ({
      type: "lesson",
      item: lesson,
      collect: (monitor) => ({
        opacity: monitor.isDragging() ? 0.4 : 1,
      }),
    }),
    [lesson],
  );

  const [popoverOpen, setPopoverOpen] = useState(false);

  const subjectColor =
    SUBJECT_COLORS[lesson.subject as keyof typeof SUBJECT_COLORS] ||
    "bg-gray-100 border-gray-300 text-gray-900";

  if (isUnplaced) {
    return (
      <div
        ref={drag}
        style={{ opacity }}
        className={cn(
          "p-3 rounded-lg border-2 cursor-move hover:shadow-md transition-shadow",
          subjectColor,
          "mb-3",
        )}
      >
        <div className="flex items-start gap-2">
          <GripVertical className="h-4 w-4 mt-0.5 opacity-50" />
          <div className="flex-1">
            {displayOptions.showSubject && (
              <div className="font-medium">{lesson.subject}</div>
            )}
            <div className="text-sm opacity-75">{lesson.class}</div>
            {displayOptions.showTeacher && (
              <div className="text-sm opacity-75">{lesson.teacher}</div>
            )}
            {displayOptions.showRoom && (
              <div className="text-sm opacity-75">{lesson.room}</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <div
          ref={drag}
          style={{ opacity }}
          className={cn(
            "p-2 rounded-lg border-2 cursor-pointer hover:shadow-md transition-all h-full",
            subjectColor,
            lesson.isLocked && "ring-2 ring-yellow-500",
            compact && "p-1.5",
          )}
        >
          <div className="flex items-start justify-between gap-1">
            <div className="flex-1 min-w-0">
              {displayOptions.showSubject && (
                <div
                  className={cn(
                    "font-medium truncate",
                    compact && "text-xs",
                  )}
                >
                  {lesson.subject}
                </div>
              )}
              {showClass && (
                <div
                  className={cn(
                    "text-sm opacity-75 truncate",
                    compact && "text-xs",
                  )}
                >
                  {lesson.class}
                </div>
              )}
              {displayOptions.showTeacher && (
                <div
                  className={cn(
                    "text-sm opacity-75 truncate",
                    compact && "text-xs",
                  )}
                >
                  {lesson.teacher}
                </div>
              )}
              {displayOptions.showRoom && (
                <div
                  className={cn(
                    "text-sm opacity-75 truncate",
                    compact && "text-xs",
                  )}
                >
                  {lesson.room}
                </div>
              )}
            </div>
            {lesson.isLocked && (
              <Lock className="h-3 w-3 text-yellow-600 flex-shrink-0" />
            )}
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="start">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              onEdit(lesson);
              setPopoverOpen(false);
            }}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              onToggleLock(lesson);
              setPopoverOpen(false);
            }}
          >
            {lesson.isLocked ? (
              <>
                <Unlock className="mr-2 h-4 w-4" />
                Unlock
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Lock
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => {
              onDelete(lesson);
              setPopoverOpen(false);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Droppable Time Slot Component
const DroppableTimeSlot = ({
  day,
  timeSlot,
  lesson,
  onDrop,
  onEdit,
  onDelete,
  onToggleLock,
  displayOptions,
  compact = false,
  showClass = false,
}: {
  day: string;
  timeSlot: number;
  lesson?: Lesson;
  onDrop: (lesson: Lesson, day: string, timeSlot: number) => void;
  onEdit: (lesson: Lesson) => void;
  onDelete: (lesson: Lesson) => void;
  onToggleLock: (lesson: Lesson) => void;
  displayOptions: DisplayOptions;
  compact?: boolean;
  showClass?: boolean;
}) => {
  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: "lesson",
      drop: (item: Lesson) => onDrop(item, day, timeSlot),
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
      }),
    }),
    [day, timeSlot],
  );

  return (
    <div
      ref={drop}
      className={cn(
        "border border-gray-200 p-1 transition-colors",
        compact ? "min-h-[60px]" : "min-h-[70px]",
        isOver && "bg-blue-50 border-blue-300",
        !lesson && "hover:bg-gray-50",
      )}
    >
      {lesson && (
        <DraggableLessonCard
          lesson={lesson}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleLock={onToggleLock}
          displayOptions={displayOptions}
          compact={compact}
          showClass={showClass}
        />
      )}
    </div>
  );
};

// Class View Grid
const ClassViewGrid = ({
  className,
  lessons,
  onDrop,
  onEdit,
  onDelete,
  onToggleLock,
  displayOptions,
  timeSlots,
}: {
  className: string;
  lessons: Lesson[];
  onDrop: (lesson: Lesson, day: string, timeSlot: number) => void;
  onEdit: (lesson: Lesson) => void;
  onDelete: (lesson: Lesson) => void;
  onToggleLock: (lesson: Lesson) => void;
  displayOptions: DisplayOptions;
  timeSlots: number[];
}) => {
  const getLesson = (day: string, timeSlot: number) => {
    return lessons.find(
      (lesson) =>
        lesson.class === className &&
        lesson.day === day &&
        lesson.timeSlot === timeSlot,
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-3">
        <h3 className="font-semibold">Class {className}</h3>
      </div>

      <div className="p-4 overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-[100px_repeat(6,1fr)] gap-0 border border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-gray-100 p-2 flex items-center justify-center border-r border-gray-300">
              <span className="text-sm font-medium">Time</span>
            </div>
            {DAYS.map((day) => (
              <div
                key={day}
                className="bg-gray-100 p-2 flex items-center justify-center border-r border-gray-300 last:border-r-0"
              >
                <span className="text-sm font-medium">
                  {DAY_LABELS[day]}
                </span>
              </div>
            ))}

            {timeSlots.map((slotId) => (
              <React.Fragment key={slotId}>
                <div className="bg-gray-50 p-2 flex flex-col items-center justify-center border-r border-t border-gray-200">
                  <span className="text-xs">Period {slotId}</span>
                </div>
                {DAYS.map((day) => (
                  <DroppableTimeSlot
                    key={`${className}-${day}-${slotId}`}
                    day={day}
                    timeSlot={slotId}
                    lesson={getLesson(day, slotId)}
                    onDrop={onDrop}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleLock={onToggleLock}
                    displayOptions={displayOptions}
                    compact={true}
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

// Teacher View Grid
const TeacherViewGrid = ({
  teacherName,
  lessons,
  onDrop,
  onEdit,
  onDelete,
  onToggleLock,
  displayOptions,
  timeSlots,
}: {
  teacherName: string;
  lessons: Lesson[];
  onDrop: (lesson: Lesson, day: string, timeSlot: number) => void;
  onEdit: (lesson: Lesson) => void;
  onDelete: (lesson: Lesson) => void;
  onToggleLock: (lesson: Lesson) => void;
  displayOptions: DisplayOptions;
  timeSlots: number[];
}) => {
  const getLesson = (day: string, timeSlot: number) => {
    return lessons.find(
      (lesson) =>
        lesson.teacher === teacherName &&
        lesson.day === day &&
        lesson.timeSlot === timeSlot,
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-3">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5" />
          <h3 className="font-semibold">{teacherName}</h3>
        </div>
      </div>

      <div className="p-4 overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-[100px_repeat(6,1fr)] gap-0 border border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-gray-100 p-2 flex items-center justify-center border-r border-gray-300">
              <span className="text-sm font-medium">Time</span>
            </div>
            {DAYS.map((day) => (
              <div
                key={day}
                className="bg-gray-100 p-2 flex items-center justify-center border-r border-gray-300 last:border-r-0"
              >
                <span className="text-sm font-medium">
                  {DAY_LABELS[day]}
                </span>
              </div>
            ))}

            {timeSlots.map((slotId) => (
              <React.Fragment key={slotId}>
                <div className="bg-gray-50 p-2 flex flex-col items-center justify-center border-r border-t border-gray-200">
                  <span className="text-xs">Period {slotId}</span>
                </div>
                {DAYS.map((day) => (
                  <DroppableTimeSlot
                    key={`${teacherName}-${day}-${slotId}`}
                    day={day}
                    timeSlot={slotId}
                    lesson={getLesson(day, slotId)}
                    onDrop={onDrop}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleLock={onToggleLock}
                    displayOptions={displayOptions}
                    compact={true}
                    showClass={true}
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

// Room View Grid
const RoomViewGrid = ({
  roomName,
  lessons,
  onDrop,
  onEdit,
  onDelete,
  onToggleLock,
  displayOptions,
  timeSlots,
}: {
  roomName: string;
  lessons: Lesson[];
  onDrop: (lesson: Lesson, day: string, timeSlot: number) => void;
  onEdit: (lesson: Lesson) => void;
  onDelete: (lesson: Lesson) => void;
  onToggleLock: (lesson: Lesson) => void;
  displayOptions: DisplayOptions;
  timeSlots: number[];
}) => {
  const getLesson = (day: string, timeSlot: number) => {
    return lessons.find(
      (lesson) =>
        lesson.room === roomName &&
        lesson.day === day &&
        lesson.timeSlot === timeSlot,
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-6 py-3">
        <div className="flex items-center gap-2">
          <DoorOpen className="h-5 w-5" />
          <h3 className="font-semibold">{roomName}</h3>
        </div>
      </div>

      <div className="p-4 overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-[100px_repeat(6,1fr)] gap-0 border border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-gray-100 p-2 flex items-center justify-center border-r border-gray-300">
              <span className="text-sm font-medium">Time</span>
            </div>
            {DAYS.map((day) => (
              <div
                key={day}
                className="bg-gray-100 p-2 flex items-center justify-center border-r border-gray-300 last:border-r-0"
              >
                <span className="text-sm font-medium">
                  {DAY_LABELS[day]}
                </span>
              </div>
            ))}

            {timeSlots.map((slotId) => (
              <React.Fragment key={slotId}>
                <div className="bg-gray-50 p-2 flex flex-col items-center justify-center border-r border-t border-gray-200">
                  <span className="text-xs">Period {slotId}</span>
                </div>
                {DAYS.map((day) => (
                  <DroppableTimeSlot
                    key={`${roomName}-${day}-${slotId}`}
                    day={day}
                    timeSlot={slotId}
                    lesson={getLesson(day, slotId)}
                    onDrop={onDrop}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleLock={onToggleLock}
                    displayOptions={displayOptions}
                    compact={true}
                    showClass={true}
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

// Compact View Grid
const CompactViewGrid = ({
  lessons,
  classes,
  onDrop,
  onEdit,
  onDelete,
  onToggleLock,
  displayOptions,
  timeSlots,
}: {
  lessons: Lesson[];
  classes: string[];
  onDrop: (lesson: Lesson, day: string, timeSlot: number) => void;
  onEdit: (lesson: Lesson) => void;
  onDelete: (lesson: Lesson) => void;
  onToggleLock: (lesson: Lesson) => void;
  displayOptions: DisplayOptions;
  timeSlots: number[];
}) => {
  const getLesson = (className: string, day: string, timeSlot: number) => {
    return lessons.find(
      (lesson) =>
        lesson.class === className &&
        lesson.day === day &&
        lesson.timeSlot === timeSlot,
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 overflow-x-auto">
        <div className="min-w-max">
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            {/* Header Row */}
            <div
              className="grid gap-0"
              style={{
                gridTemplateColumns: `100px 80px repeat(${classes.length}, 140px)`,
              }}
            >
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-3 flex items-center justify-center border-r border-indigo-500">
                <span className="text-sm font-medium">Day</span>
              </div>
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-3 flex items-center justify-center border-r border-indigo-500">
                <span className="text-sm font-medium">Period</span>
              </div>
              {classes.map((className) => (
                <div
                  key={className}
                  className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-3 flex items-center justify-center border-r border-indigo-500 last:border-r-0"
                >
                  <span className="text-sm font-medium">{className}</span>
                </div>
              ))}
            </div>

            {/* Body - Each day group */}
            {DAYS.map((day, dayIndex) => (
              <div
                key={day}
                className={cn(
                  "flex border-t border-gray-200",
                  dayIndex > 0 && "border-t-4 border-indigo-600"
                )}
              >
                {/* Day name column */}
                <div className="bg-gray-50 p-2 flex items-center justify-center border-r border-gray-200 w-[100px] flex-shrink-0">
                  <span className="text-sm font-medium">
                    {DAY_LABELS[day]}
                  </span>
                </div>
                
                {/* Periods and lessons */}
                <div className="flex-1">
                  {timeSlots.map((slotId) => (
                    <div
                      key={`${day}-${slotId}`}
                      className="grid gap-0 border-t first:border-t-0 border-gray-200"
                      style={{
                        gridTemplateColumns: `80px repeat(${classes.length}, 140px)`,
                      }}
                    >
                      {/* Period number */}
                      <div className="bg-gray-50 p-2 flex items-center justify-center border-r border-gray-200">
                        <span className="text-xs font-medium">
                          Period {slotId}
                        </span>
                      </div>
                      
                      {/* Lesson cells */}
                      {classes.map((className) => (
                        <DroppableTimeSlot
                          key={`${className}-${day}-${slotId}`}
                          day={day}
                          timeSlot={slotId}
                          lesson={getLesson(className, day, slotId)}
                          onDrop={onDrop}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          onToggleLock={onToggleLock}
                          displayOptions={displayOptions}
                          compact={true}
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

export default function TimetableViewPageWithAPI({
  timetableId,
  onNavigate,
}: {
  timetableId?: string;
  onNavigate?: (page: string) => void;
}) {
  const [viewMode, setViewMode] = useState<
    "classes" | "teachers" | "rooms" | "compact"
  >("classes");
  const [filterBy, setFilterBy] = useState<"all" | "class" | "teacher" | "room">(
    "all",
  );
  const [selectedEntity, setSelectedEntity] = useState<string>("");
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);

  // Display Options State
  const [displayOptions, setDisplayOptions] = useState<DisplayOptions>({
    showTeacher: true,
    showRoom: true,
    showSubject: true,
  });

  // API Data State
  const [timetableData, setTimetableData] = useState<TimetableDataEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timetableVersion, setTimetableVersion] = useState(1);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Processed data
  const [scheduledLessons, setScheduledLessons] = useState<Lesson[]>([]);
  const [unplacedLessons, setUnplacedLessons] = useState<UnplacedLesson[]>([]);

  // Fetch timetable data from API
  useEffect(() => {
    if (timetableId) {
      fetchTimetableData(timetableId);
    }
  }, [timetableId]);

  const fetchTimetableData = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`http://localhost:8080/api/timetable/v1/timetable/${id}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch timetable data: ${response.statusText}`);
      }

      const data: TimetableDataEntity[] = await response.json();
      setTimetableData(data);

      // Process the data
      processAPIData(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch timetable data";
      setError(errorMessage);
      toast.error(errorMessage);

      // Fallback to empty data
      setScheduledLessons([]);
      setUnplacedLessons([]);
    } finally {
      setIsLoading(false);
    }
  };

  const processAPIData = (data: TimetableDataEntity[]) => {
    const scheduled: Lesson[] = [];
    const unplaced: UnplacedLesson[] = [];

    data.forEach((entry) => {
      if (entry.isScheduled && entry.scheduledData) {
        const sd = entry.scheduledData;
        scheduled.push({
          id: entry.id,
          subject: sd.subject.name,
          subjectId: sd.subject.id,
          teacher: sd.teacher.fullName,
          teacherId: sd.teacher.id,
          teacherShort: sd.teacher.shortName,
          room: `Room ${sd.roomId}`,
          roomId: sd.roomId,
          class: sd.classObj.shortName,
          classId: sd.classObj.id,
          day: sd.day,
          timeSlot: sd.hour,
          isLocked: false,
        });
      } else if (!entry.isScheduled && entry.unscheduledData) {
        const ud = entry.unscheduledData;
        unplaced.push({
          id: entry.id,
          subject: ud.subject.name,
          subjectId: ud.subject.id,
          teacher: ud.teacher.fullName,
          teacherId: ud.teacher.id,
          teacherShort: ud.teacher.shortName,
          room: "TBD",
          roomId: 0,
          class: ud.classInfo.shortName,
          classId: ud.classInfo.id,
          isLocked: false,
          reason: `Missing ${ud.missingCount} out of ${ud.requiredCount} required lessons`,
          requiredCount: ud.requiredCount,
          scheduledCount: ud.scheduledCount,
          missingCount: ud.missingCount,
        });
      }
    });

    setScheduledLessons(scheduled);
    setUnplacedLessons(unplaced);
  };

  // Extract unique classes, teachers, rooms from scheduled lessons
  const allClasses = useMemo(
    () => Array.from(new Set(scheduledLessons.map((l) => l.class))).sort(),
    [scheduledLessons],
  );
  const allTeachers = useMemo(
    () => Array.from(new Set(scheduledLessons.map((l) => l.teacher))).sort(),
    [scheduledLessons],
  );
  const allRooms = useMemo(
    () => Array.from(new Set(scheduledLessons.map((l) => l.room))).sort(),
    [scheduledLessons],
  );

  // Extract unique time slots
  const timeSlots = useMemo(
    () =>
      Array.from(new Set(scheduledLessons.map((l) => l.timeSlot).filter(Boolean)))
        .sort((a, b) => a! - b!) as number[],
    [scheduledLessons],
  );

  const totalLessons = scheduledLessons.length + unplacedLessons.length;
  const scheduleIntegrity =
    totalLessons > 0 ? Math.round((scheduledLessons.length / totalLessons) * 100) : 100;
  const conflicts = 0; // TODO: Implement conflict detection

  // Initialize mock lessons when scheduled lessons change
  useEffect(() => {
    if (scheduledLessons.length > 0) {
      initializeMockLessons(scheduledLessons);
    }
  }, [scheduledLessons.length]);

  // Handle drag and drop with action-based API
  const handleDrop = async (draggedLesson: Lesson, targetDay: string, targetTimeSlot: number) => {
    if (isProcessingAction) return;
    
    // Get the lesson at the target position (if any)
    const targetLesson = scheduledLessons.find(
      (l) => l.day === targetDay && l.timeSlot === targetTimeSlot && l.class === draggedLesson.class
    );
    
    const isUnplacedLesson = unplacedLessons.some((l) => l.id === draggedLesson.id);
    
    let actionRequest: TimetableActionRequest;
    let actionDescription = '';
    
    if (targetLesson && targetLesson.id !== draggedLesson.id) {
      // SWAP: There's a lesson at target position - swap them
      actionRequest = {
        action_type: 'SWAP_LESSONS',
        timetable_version: timetableVersion,
        payload: {
          lesson_a: {
            id: draggedLesson.id,
            source_position: {
              day: draggedLesson.day || '',
              hour: draggedLesson.timeSlot || 0,
              room_id: draggedLesson.roomId,
            },
          },
          lesson_b: {
            id: targetLesson.id,
            source_position: {
              day: targetLesson.day || '',
              hour: targetLesson.timeSlot || 0,
              room_id: targetLesson.roomId,
            },
          },
        },
      };
      actionDescription = `Swap ${draggedLesson.subject} with ${targetLesson.subject}`;
    } else if (isUnplacedLesson) {
      // PLACE_UNPLACED: Moving from unplaced to schedule
      actionRequest = {
        action_type: 'PLACE_UNPLACED_LESSON',
        timetable_version: timetableVersion,
        payload: {
          lesson_id: draggedLesson.id,
          target_position: {
            day: targetDay,
            hour: targetTimeSlot,
            room_id: draggedLesson.roomId || 0,
          },
        },
      };
      actionDescription = `Place ${draggedLesson.subject} to ${DAY_LABELS[targetDay]}, Period ${targetTimeSlot}`;
    } else {
      // MOVE: Moving to empty slot or same class different time
      actionRequest = {
        action_type: 'MOVE_LESSON',
        timetable_version: timetableVersion,
        payload: {
          lesson_id: draggedLesson.id,
          source_position: {
            day: draggedLesson.day || '',
            hour: draggedLesson.timeSlot || 0,
            room_id: draggedLesson.roomId,
          },
          target_position: {
            day: targetDay,
            hour: targetTimeSlot,
            room_id: draggedLesson.roomId || 0,
          },
        },
      };
      actionDescription = `Move ${draggedLesson.subject} to ${DAY_LABELS[targetDay]}, Period ${targetTimeSlot}`;
    }
    
    try {
      setIsProcessingAction(true);
      
      // Step 1: Validate the action
      const validation: ValidationResponse = await timetableActionApi.validateMove(
        timetableId || '1',
        actionRequest
      );
      
      if (!validation.valid) {
        // Show validation errors
        const errorMessage = validation.errors?.join(', ') || 'Invalid action';
        toast.error('Cannot perform action', {
          description: errorMessage,
        });
        return;
      }
      
      // Show warnings if any
      if (validation.warnings && validation.warnings.length > 0) {
        toast.warning('Action has warnings', {
          description: validation.warnings.join(', '),
        });
      }
      
      // Step 2: Apply the action
      const result: ActionResponse = await timetableActionApi.applyAction(
        timetableId || '1',
        actionRequest
      );
      
      if (!result.success) {
        const errorMessage = result.errors?.join(', ') || 'Failed to apply action';
        toast.error('Action failed', {
          description: errorMessage,
        });
        return;
      }
      
      // Step 3: Update local state optimistically
      setTimetableVersion(result.new_version);
      
      if (actionRequest.action_type === 'SWAP_LESSONS') {
        // Swap the two lessons
        setScheduledLessons((prev) => {
          return prev.map((l) => {
            if (l.id === draggedLesson.id) {
              return {
                ...l,
                day: targetDay,
                timeSlot: targetTimeSlot,
                roomId: targetLesson.roomId,
              };
            } else if (l.id === targetLesson.id) {
              return {
                ...l,
                day: draggedLesson.day!,
                timeSlot: draggedLesson.timeSlot!,
                roomId: draggedLesson.roomId,
              };
            }
            return l;
          });
        });
      } else if (actionRequest.action_type === 'PLACE_UNPLACED_LESSON') {
        // Move from unplaced to scheduled
        setUnplacedLessons((prev) => prev.filter((l) => l.id !== draggedLesson.id));
        setScheduledLessons((prev) => [
          ...prev,
          { ...draggedLesson, day: targetDay, timeSlot: targetTimeSlot },
        ]);
      } else {
        // MOVE_LESSON: Update the lesson's position
        setScheduledLessons((prev) =>
          prev.map((l) =>
            l.id === draggedLesson.id ? { ...l, day: targetDay, timeSlot: targetTimeSlot } : l
          )
        );
      }
      
      // Show success with soft constraint impact
      const qualityInfo = result.soft_constraint_impact?.new_quality_score 
        ? ` (Quality: ${result.soft_constraint_impact.new_quality_score}%)`
        : '';
      
      toast.success(result.message || 'Action completed successfully', {
        description: actionDescription + qualityInfo,
      });
      
      // Show soft constraint warnings if any
      if (result.soft_constraint_impact?.warnings && result.soft_constraint_impact.warnings.length > 0) {
        setTimeout(() => {
          toast.info('Scheduling Impact', {
            description: result.soft_constraint_impact!.warnings!.join(', '),
          });
        }, 500);
      }
      
    } catch (error) {
      console.error('Action error:', error);
      toast.error('Failed to process action', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleEdit = (lesson: Lesson | UnplacedLesson) => {
    console.log("Edit lesson:", lesson);
  };

  const handleDelete = (lesson: Lesson | UnplacedLesson) => {
    setScheduledLessons((prev) => prev.filter((l) => l.id !== lesson.id));
  };

  const handleToggleLock = (lesson: Lesson | UnplacedLesson) => {
    setScheduledLessons((prev) =>
      prev.map((l) =>
        l.id === lesson.id ? { ...l, isLocked: !l.isLocked } : l,
      ),
    );
  };

  const handleRegenerate = () => {
    console.log("Regenerate timetable");
    toast.info("Regenerating timetable...");
  };

  const handleExport = () => {
    console.log("Export to PDF");
    toast.info("Exporting to PDF...");
  };

  const getFilteredLessons = () => {
    if (filterBy === "all") {
      return scheduledLessons;
    }

    return scheduledLessons.filter((lesson) => {
      switch (filterBy) {
        case "class":
          return lesson.class === selectedEntity;
        case "teacher":
          return lesson.teacher === selectedEntity;
        case "room":
          return lesson.room === selectedEntity;
        default:
          return true;
      }
    });
  };

  const getClassesToDisplay = () => {
    if (filterBy === "all") {
      return allClasses;
    } else if (filterBy === "class") {
      return [selectedEntity];
    } else {
      const relevantClasses = new Set(
        scheduledLessons
          .filter((lesson) => {
            if (filterBy === "teacher") return lesson.teacher === selectedEntity;
            if (filterBy === "room") return lesson.room === selectedEntity;
            return false;
          })
          .map((lesson) => lesson.class),
      );
      return Array.from(relevantClasses);
    }
  };

  const getTeachersToDisplay = () => {
    if (filterBy === "all") {
      return allTeachers;
    } else if (filterBy === "teacher") {
      return [selectedEntity];
    } else {
      const relevantTeachers = new Set(
        scheduledLessons
          .filter((lesson) => {
            if (filterBy === "class") return lesson.class === selectedEntity;
            if (filterBy === "room") return lesson.room === selectedEntity;
            return false;
          })
          .map((lesson) => lesson.teacher),
      );
      return Array.from(relevantTeachers);
    }
  };

  const getRoomsToDisplay = () => {
    if (filterBy === "all") {
      return allRooms;
    } else if (filterBy === "room") {
      return [selectedEntity];
    } else {
      const relevantRooms = new Set(
        scheduledLessons
          .filter((lesson) => {
            if (filterBy === "class") return lesson.class === selectedEntity;
            if (filterBy === "teacher") return lesson.teacher === selectedEntity;
            return false;
          })
          .map((lesson) => lesson.room),
      );
      return Array.from(relevantRooms);
    }
  };

  const filteredLessons = getFilteredLessons();
  const classesToDisplay = getClassesToDisplay();
  const teachersToDisplay = getTeachersToDisplay();
  const roomsToDisplay = getRoomsToDisplay();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Loading timetable data...</p>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto p-6 max-w-[1800px]">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Processing Action Indicator */}
          {isProcessingAction && (
            <Alert className="mb-6 bg-blue-50 border-blue-300">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <AlertDescription className="text-blue-800">
                Processing action... Please wait.
              </AlertDescription>
            </Alert>
          )}

          {/* Redesigned Header - Single Line, Persistent */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4 mb-6 sticky top-0 z-10">
            <div className="flex items-center justify-between gap-6">
              {/* Left: Page Title */}
              <div className="flex items-center gap-3">
                {onNavigate && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onNavigate("timetables")}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                )}
                <h1>Timetable</h1>
              </div>

              {/* Center: View Mode Switcher (Segmented Control) */}
              <ToggleGroup
                type="single"
                value={viewMode}
                onValueChange={(value) =>
                  value &&
                  setViewMode(
                    value as "classes" | "teachers" | "rooms" | "compact",
                  )
                }
                className="border rounded-lg bg-gray-50"
              >
                <ToggleGroupItem
                  value="classes"
                  aria-label="Classes View"
                  className="gap-2 px-4"
                >
                  <Users className="h-4 w-4" />
                  Classes
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="teachers"
                  aria-label="Teachers View"
                  className="gap-2 px-4"
                >
                  <User className="h-4 w-4" />
                  Teachers
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="rooms"
                  aria-label="Rooms View"
                  className="gap-2 px-4"
                >
                  <Building2 className="h-4 w-4" />
                  Rooms
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="compact"
                  aria-label="Compact View"
                  className="gap-2 px-4"
                >
                  <Grid3x3 className="h-4 w-4" />
                  Compact
                </ToggleGroupItem>
              </ToggleGroup>

              {/* Right: Display Options + Filter + Actions */}
              <div className="flex items-center gap-2">
                {/* Display Options - Round Icon Toggles */}
                <div className="flex items-center gap-1 mr-2">
                  <Toggle
                    pressed={displayOptions.showSubject}
                    onPressedChange={(pressed) =>
                      setDisplayOptions((prev) => ({
                        ...prev,
                        showSubject: pressed,
                      }))
                    }
                    aria-label="Toggle Subject"
                    size="sm"
                    className="h-9 w-9 rounded-full p-0"
                  >
                    <BookOpen className="h-4 w-4" />
                  </Toggle>
                  <Toggle
                    pressed={displayOptions.showTeacher}
                    onPressedChange={(pressed) =>
                      setDisplayOptions((prev) => ({
                        ...prev,
                        showTeacher: pressed,
                      }))
                    }
                    aria-label="Toggle Teacher"
                    size="sm"
                    className="h-9 w-9 rounded-full p-0"
                  >
                    <User className="h-4 w-4" />
                  </Toggle>
                  <Toggle
                    pressed={displayOptions.showRoom}
                    onPressedChange={(pressed) =>
                      setDisplayOptions((prev) => ({
                        ...prev,
                        showRoom: pressed,
                      }))
                    }
                    aria-label="Toggle Room"
                    size="sm"
                    className="h-9 w-9 rounded-full p-0"
                  >
                    <DoorOpen className="h-4 w-4" />
                  </Toggle>
                </div>

                <Separator orientation="vertical" className="h-8" />

                {/* Filter Button with Popover */}
                <Popover
                  open={filterPopoverOpen}
                  onOpenChange={setFilterPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Filter className="h-4 w-4" />
                      Filter
                      {filterBy !== "all" && (
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                          1
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4" align="end">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-3">Filters</h4>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Filter By</Label>
                          <Select
                            value={filterBy}
                            onValueChange={(value: any) => {
                              setFilterBy(value);
                              if (value === "all") {
                                setSelectedEntity("");
                              } else {
                                const options =
                                  value === "class"
                                    ? allClasses
                                    : value === "teacher"
                                      ? allTeachers
                                      : allRooms;
                                setSelectedEntity(options[0] || "");
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="class">By Class</SelectItem>
                              <SelectItem value="teacher">
                                By Teacher
                              </SelectItem>
                              <SelectItem value="room">By Room</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {filterBy !== "all" && (
                          <div className="space-y-2">
                            <Label className="text-xs">
                              Select{" "}
                              {filterBy === "class"
                                ? "Class"
                                : filterBy === "teacher"
                                  ? "Teacher"
                                  : "Room"}
                            </Label>
                            <Select
                              value={selectedEntity}
                              onValueChange={setSelectedEntity}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {(filterBy === "class"
                                  ? allClasses
                                  : filterBy === "teacher"
                                    ? allTeachers
                                    : allRooms
                                ).map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>

                      <Separator />

                      {/* Statistics in Filter Panel */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-muted-foreground">
                          Statistics
                        </h4>
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs">Version</span>
                            <Badge variant="outline" className="text-xs">
                              v{timetableVersion}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs">Schedule Integrity</span>
                            <span className="text-xs font-semibold text-green-600">
                              {scheduleIntegrity}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs">Conflicts</span>
                            <Badge
                              variant={
                                conflicts > 0 ? "destructive" : "secondary"
                              }
                              className="h-5 text-xs"
                            >
                              {conflicts}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs">Unplaced</span>
                            <Badge variant="secondary" className="h-5 text-xs">
                              {unplacedLessons.length}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                <Separator orientation="vertical" className="h-8" />

                {/* Main Action Buttons */}
                <Button
                  onClick={handleRegenerate}
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </Button>
                <Button variant="outline" onClick={handleExport} size="sm">
                  <FileDown className="mr-2 h-4 w-4" />
                  Print / PDF
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex gap-6">
            {/* Main Timetable Area */}
            <div className="flex-1">
              {viewMode === "classes" ? (
                /* View by Classes - Vertical */
                <div className="space-y-6">
                  {classesToDisplay.length > 0 ? (
                    classesToDisplay.map((className) => (
                      <ClassViewGrid
                        key={className}
                        className={className}
                        lessons={filteredLessons}
                        onDrop={handleDrop}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onToggleLock={handleToggleLock}
                        displayOptions={displayOptions}
                        timeSlots={timeSlots}
                      />
                    ))
                  ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                      <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No scheduled lessons found.
                      </p>
                    </div>
                  )}
                </div>
              ) : viewMode === "teachers" ? (
                /* View by Teachers - Vertical (NEW) */
                <div className="space-y-6">
                  {teachersToDisplay.length > 0 ? (
                    teachersToDisplay.map((teacherName) => (
                      <TeacherViewGrid
                        key={teacherName}
                        teacherName={teacherName}
                        lessons={filteredLessons}
                        onDrop={handleDrop}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onToggleLock={handleToggleLock}
                        displayOptions={displayOptions}
                        timeSlots={timeSlots}
                      />
                    ))
                  ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                      <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No scheduled lessons found for this teacher.
                      </p>
                    </div>
                  )}
                </div>
              ) : viewMode === "rooms" ? (
                /* View by Rooms - Vertical (NEW) */
                <div className="space-y-6">
                  {roomsToDisplay.length > 0 ? (
                    roomsToDisplay.map((roomName) => (
                      <RoomViewGrid
                        key={roomName}
                        roomName={roomName}
                        lessons={filteredLessons}
                        onDrop={handleDrop}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onToggleLock={handleToggleLock}
                        displayOptions={displayOptions}
                        timeSlots={timeSlots}
                      />
                    ))
                  ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                      <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No scheduled lessons found for this room.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* Compact View - Horizontal */
                <CompactViewGrid
                  lessons={filteredLessons}
                  classes={allClasses}
                  onDrop={handleDrop}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleLock={handleToggleLock}
                  displayOptions={displayOptions}
                  timeSlots={timeSlots}
                />
              )}
            </div>

            {/* Unplaced Lessons Sidebar */}
            <Card className="w-80 flex-shrink-0 shadow-sm h-fit sticky top-32">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b p-4">
                <CardTitle className="flex items-center gap-2 text-orange-900 text-base">
                  <AlertCircle className="h-5 w-5" />
                  Unplaced Lessons
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Drag to place manually
                </p>
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
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onToggleLock={handleToggleLock}
                          displayOptions={displayOptions}
                          isUnplaced={true}
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
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
