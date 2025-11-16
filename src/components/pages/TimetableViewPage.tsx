import React, { useState } from "react";
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
import { 
  FileDown, 
  Zap, 
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
} from "lucide-react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { cn } from "../ui/utils";

// Mock data
const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const TIME_SLOTS = [
  { id: 1, start: "08:30", end: "09:15" },
  { id: 2, start: "09:20", end: "10:05" },
  { id: 3, start: "10:10", end: "10:55" },
  { id: 4, start: "11:00", end: "11:45" },
  { id: 5, start: "11:50", end: "12:35" },
  { id: 6, start: "13:00", end: "13:45" },
  { id: 7, start: "13:50", end: "14:35" },
  { id: 8, start: "14:40", end: "15:25" },
];

const CLASSES = [
  "5-A",
  "5-B",
  "6-A",
  "6-B",
  "7-A",
  "7-B",
  "8-A",
  "8-B",
];
const TEACHERS = [
  "John Smith",
  "Sarah Johnson",
  "Michael Brown",
  "Emma Davis",
  "David Wilson",
];
const ROOMS = [
  "Room 101",
  "Room 102",
  "Room 103",
  "Lab A",
  "Lab B",
  "Gym",
];

const SUBJECT_COLORS = {
  Mathematics: "bg-blue-100 border-blue-300 text-blue-900",
  Physics: "bg-purple-100 border-purple-300 text-purple-900",
  Chemistry: "bg-green-100 border-green-300 text-green-900",
  English: "bg-orange-100 border-orange-300 text-orange-900",
  History: "bg-amber-100 border-amber-300 text-amber-900",
  "P.E.": "bg-red-100 border-red-300 text-red-900",
  Biology: "bg-emerald-100 border-emerald-300 text-emerald-900",
  Art: "bg-pink-100 border-pink-300 text-pink-900",
};

interface Lesson {
  id: number;
  subject: string;
  teacher: string;
  room: string;
  class: string;
  day?: string;
  timeSlot?: number;
  isLocked?: boolean;
}

interface UnplacedLesson extends Lesson {
  reason: string;
}

interface DisplayOptions {
  showTeacher: boolean;
  showRoom: boolean;
  showSubject: boolean;
}

// Draggable Lesson Card Component with Display Options
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
  lesson: Lesson;
  onEdit: (lesson: Lesson) => void;
  onDelete: (lesson: Lesson) => void;
  onToggleLock: (lesson: Lesson) => void;
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
    SUBJECT_COLORS[
      lesson.subject as keyof typeof SUBJECT_COLORS
    ] || "bg-gray-100 border-gray-300 text-gray-900";

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
              <div className="font-medium">
                {lesson.subject}
              </div>
            )}
            <div className="text-sm opacity-75">
              {lesson.class}
            </div>
            {displayOptions.showTeacher && (
              <div className="text-sm opacity-75">
                {lesson.teacher}
              </div>
            )}
            {displayOptions.showRoom && (
              <div className="text-sm opacity-75">
                {lesson.room}
              </div>
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
  onDrop: (
    lesson: Lesson,
    day: string,
    timeSlot: number,
  ) => void;
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

// Class View - Vertical Layout
const ClassViewGrid = ({
  className,
  lessons,
  onDrop,
  onEdit,
  onDelete,
  onToggleLock,
  displayOptions,
}: {
  className: string;
  lessons: Lesson[];
  onDrop: (
    lesson: Lesson,
    day: string,
    timeSlot: number,
  ) => void;
  onEdit: (lesson: Lesson) => void;
  onDelete: (lesson: Lesson) => void;
  onToggleLock: (lesson: Lesson) => void;
  displayOptions: DisplayOptions;
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
                  {day}
                </span>
              </div>
            ))}

            {TIME_SLOTS.map((slot) => (
              <React.Fragment key={slot.id}>
                <div className="bg-gray-50 p-2 flex flex-col items-center justify-center border-r border-t border-gray-200">
                  <span className="text-xs">{slot.start}</span>
                  <span className="text-xs text-muted-foreground">
                    -
                  </span>
                  <span className="text-xs">{slot.end}</span>
                </div>
                {DAYS.map((day) => (
                  <DroppableTimeSlot
                    key={`${className}-${day}-${slot.id}`}
                    day={day}
                    timeSlot={slot.id}
                    lesson={getLesson(day, slot.id)}
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

// Teacher View - Vertical Layout (NEW)
const TeacherViewGrid = ({
  teacherName,
  lessons,
  onDrop,
  onEdit,
  onDelete,
  onToggleLock,
  displayOptions,
}: {
  teacherName: string;
  lessons: Lesson[];
  onDrop: (
    lesson: Lesson,
    day: string,
    timeSlot: number,
  ) => void;
  onEdit: (lesson: Lesson) => void;
  onDelete: (lesson: Lesson) => void;
  onToggleLock: (lesson: Lesson) => void;
  displayOptions: DisplayOptions;
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
                  {day}
                </span>
              </div>
            ))}

            {TIME_SLOTS.map((slot) => (
              <React.Fragment key={slot.id}>
                <div className="bg-gray-50 p-2 flex flex-col items-center justify-center border-r border-t border-gray-200">
                  <span className="text-xs">{slot.start}</span>
                  <span className="text-xs text-muted-foreground">
                    -
                  </span>
                  <span className="text-xs">{slot.end}</span>
                </div>
                {DAYS.map((day) => (
                  <DroppableTimeSlot
                    key={`${teacherName}-${day}-${slot.id}`}
                    day={day}
                    timeSlot={slot.id}
                    lesson={getLesson(day, slot.id)}
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

// Room View - Vertical Layout (NEW)
const RoomViewGrid = ({
  roomName,
  lessons,
  onDrop,
  onEdit,
  onDelete,
  onToggleLock,
  displayOptions,
}: {
  roomName: string;
  lessons: Lesson[];
  onDrop: (
    lesson: Lesson,
    day: string,
    timeSlot: number,
  ) => void;
  onEdit: (lesson: Lesson) => void;
  onDelete: (lesson: Lesson) => void;
  onToggleLock: (lesson: Lesson) => void;
  displayOptions: DisplayOptions;
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
                  {day}
                </span>
              </div>
            ))}

            {TIME_SLOTS.map((slot) => (
              <React.Fragment key={slot.id}>
                <div className="bg-gray-50 p-2 flex flex-col items-center justify-center border-r border-t border-gray-200">
                  <span className="text-xs">{slot.start}</span>
                  <span className="text-xs text-muted-foreground">
                    -
                  </span>
                  <span className="text-xs">{slot.end}</span>
                </div>
                {DAYS.map((day) => (
                  <DroppableTimeSlot
                    key={`${roomName}-${day}-${slot.id}`}
                    day={day}
                    timeSlot={slot.id}
                    lesson={getLesson(day, slot.id)}
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

// Compact View - Horizontal Layout (Days/Times as rows, Classes as columns)
const CompactViewGrid = ({
  lessons,
  onDrop,
  onEdit,
  onDelete,
  onToggleLock,
  displayOptions,
}: {
  lessons: Lesson[];
  onDrop: (
    lesson: Lesson,
    day: string,
    timeSlot: number,
  ) => void;
  onEdit: (lesson: Lesson) => void;
  onDelete: (lesson: Lesson) => void;
  onToggleLock: (lesson: Lesson) => void;
  displayOptions: DisplayOptions;
}) => {
  const getLesson = (
    className: string,
    day: string,
    timeSlot: number,
  ) => {
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
          <div
            className="grid gap-0 border border-gray-300 rounded-lg overflow-hidden"
            style={{
              gridTemplateColumns: `120px repeat(${CLASSES.length}, 140px)`,
            }}
          >
            {/* Header Row */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-3 flex items-center justify-center border-r border-indigo-500">
              <span className="text-sm font-medium">
                Day / Time
              </span>
            </div>
            {CLASSES.map((className) => (
              <div
                key={className}
                className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-3 flex items-center justify-center border-r border-indigo-500 last:border-r-0"
              >
                <span className="text-sm font-medium">
                  {className}
                </span>
              </div>
            ))}

            {/* Grid Rows - For each day and time slot */}
            {DAYS.map((day) =>
              TIME_SLOTS.map((slot) => (
                <React.Fragment key={`${day}-${slot.id}`}>
                  <div className="bg-gray-50 p-2 flex flex-col items-start justify-center border-r border-t border-gray-200">
                    <span className="text-xs font-medium">
                      {day}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {slot.start}-{slot.end}
                    </span>
                  </div>
                  {CLASSES.map((className) => (
                    <DroppableTimeSlot
                      key={`${className}-${day}-${slot.id}`}
                      day={day}
                      timeSlot={slot.id}
                      lesson={getLesson(
                        className,
                        day,
                        slot.id,
                      )}
                      onDrop={onDrop}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onToggleLock={onToggleLock}
                      displayOptions={displayOptions}
                      compact={true}
                    />
                  ))}
                </React.Fragment>
              )),
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function TimetableViewPage({
  timetableId,
  onNavigate,
}: {
  timetableId?: number;
  onNavigate?: (page: string) => void;
}) {
  const [viewMode, setViewMode] = useState<
    "classes" | "teachers" | "rooms" | "compact"
  >("classes");
  const [filterBy, setFilterBy] = useState<
    "all" | "class" | "teacher" | "room"
  >("all");
  const [selectedEntity, setSelectedEntity] =
    useState<string>("");
  const [filterPopoverOpen, setFilterPopoverOpen] =
    useState(false);

  // Display Options State
  const [displayOptions, setDisplayOptions] =
    useState<DisplayOptions>({
      showTeacher: true,
      showRoom: true,
      showSubject: true,
    });

  // Initialize with mock scheduled lessons
  const [scheduledLessons, setScheduledLessons] = useState<
    Lesson[]
  >([
    {
      id: 1,
      subject: "Mathematics",
      teacher: "John Smith",
      room: "Room 101",
      class: "5-A",
      day: "Monday",
      timeSlot: 1,
      isLocked: false,
    },
    {
      id: 2,
      subject: "Physics",
      teacher: "Sarah Johnson",
      room: "Lab A",
      class: "5-A",
      day: "Monday",
      timeSlot: 2,
      isLocked: false,
    },
    {
      id: 3,
      subject: "English",
      teacher: "Michael Brown",
      room: "Room 102",
      class: "5-A",
      day: "Tuesday",
      timeSlot: 1,
      isLocked: true,
    },
    {
      id: 4,
      subject: "Chemistry",
      teacher: "Emma Davis",
      room: "Lab B",
      class: "5-A",
      day: "Wednesday",
      timeSlot: 3,
      isLocked: false,
    },
    {
      id: 5,
      subject: "Mathematics",
      teacher: "John Smith",
      room: "Room 101",
      class: "5-B",
      day: "Monday",
      timeSlot: 3,
      isLocked: false,
    },
    {
      id: 6,
      subject: "English",
      teacher: "Michael Brown",
      room: "Room 102",
      class: "5-B",
      day: "Monday",
      timeSlot: 4,
      isLocked: false,
    },
    {
      id: 7,
      subject: "History",
      teacher: "David Wilson",
      room: "Room 103",
      class: "5-B",
      day: "Tuesday",
      timeSlot: 2,
      isLocked: false,
    },
    {
      id: 8,
      subject: "Biology",
      teacher: "Sarah Johnson",
      room: "Lab A",
      class: "6-A",
      day: "Monday",
      timeSlot: 1,
      isLocked: false,
    },
    {
      id: 9,
      subject: "P.E.",
      teacher: "Emma Davis",
      room: "Gym",
      class: "6-A",
      day: "Tuesday",
      timeSlot: 5,
      isLocked: false,
    },
    {
      id: 10,
      subject: "Art",
      teacher: "David Wilson",
      room: "Room 103",
      class: "6-A",
      day: "Wednesday",
      timeSlot: 2,
      isLocked: false,
    },
    {
      id: 11,
      subject: "Physics",
      teacher: "Sarah Johnson",
      room: "Lab A",
      class: "6-B",
      day: "Thursday",
      timeSlot: 1,
      isLocked: false,
    },
    {
      id: 12,
      subject: "Mathematics",
      teacher: "John Smith",
      room: "Room 101",
      class: "7-A",
      day: "Friday",
      timeSlot: 2,
      isLocked: false,
    },
    {
      id: 13,
      subject: "Chemistry",
      teacher: "Emma Davis",
      room: "Lab B",
      class: "7-B",
      day: "Wednesday",
      timeSlot: 4,
      isLocked: false,
    },
  ]);

  const [unplacedLessons, setUnplacedLessons] = useState<
    UnplacedLesson[]
  >([
    {
      id: 101,
      subject: "P.E.",
      teacher: "John Smith",
      room: "Gym",
      class: "5-A",
      reason: "No available time slots for this teacher",
      isLocked: false,
    },
    {
      id: 102,
      subject: "Biology",
      teacher: "Sarah Johnson",
      room: "Lab A",
      class: "5-B",
      reason: "Room conflict - Lab A fully booked",
      isLocked: false,
    },
    {
      id: 103,
      subject: "Art",
      teacher: "Emma Davis",
      room: "Room 103",
      class: "7-A",
      reason: "Teacher has back-to-back classes",
      isLocked: false,
    },
  ]);

  const totalLessons =
    scheduledLessons.length + unplacedLessons.length;
  const scheduleIntegrity = Math.round(
    (scheduledLessons.length / totalLessons) * 100,
  );
  const conflicts = 2;

  const handleDrop = (
    lesson: Lesson,
    day: string,
    timeSlot: number,
  ) => {
    setUnplacedLessons((prev) =>
      prev.filter((l) => l.id !== lesson.id),
    );
    setScheduledLessons((prev) => {
      const filtered = prev.filter(
        (l) =>
          !(
            l.class === lesson.class &&
            l.day === day &&
            l.timeSlot === timeSlot
          ),
      );
      return [...filtered, { ...lesson, day, timeSlot }];
    });
  };

  const handleEdit = (lesson: Lesson) => {
    console.log("Edit lesson:", lesson);
  };

  const handleDelete = (lesson: Lesson) => {
    setScheduledLessons((prev) =>
      prev.filter((l) => l.id !== lesson.id),
    );
  };

  const handleToggleLock = (lesson: Lesson) => {
    setScheduledLessons((prev) =>
      prev.map((l) =>
        l.id === lesson.id
          ? { ...l, isLocked: !l.isLocked }
          : l,
      ),
    );
  };

  const handleRegenerate = () => {
    // delegate to optimize action if timetableId is present
    handleOptimize();
  };

  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleOptimize = async () => {
    if (!timetableId) {
      console.log('No timetableId provided for optimize');
      return;
    }

    setIsOptimizing(true);
    // lightweight notification (this file doesn't import toast)
    console.log('Optimizing timetable...', timetableId);

    const body = {
      applySoftConstraint: true,
      applyUnScheduledLessons: true,
      applyContinuityPenaltyTeacher: true,
      applyContinuityPenaltyClass: true,
      applyBalancedLoad: true,
      applyDailySubjectDistribution: true,
    };

    try {
      const res = await (await import('@/lib/api')).apiCall<any>(`http://localhost:8080/api/timetable/v1/timetable/optimize/${timetableId}`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (res.error) {
        console.error('Optimize failed', res.error);
      } else {
        console.log('Optimize request sent');
      }
    } catch (err) {
      console.error('Optimize request error', err);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleExport = () => {
    console.log("Export to PDF");
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
      return CLASSES;
    } else if (filterBy === "class") {
      return [selectedEntity];
    } else {
      const relevantClasses = new Set(
        scheduledLessons
          .filter((lesson) => {
            if (filterBy === "teacher")
              return lesson.teacher === selectedEntity;
            if (filterBy === "room")
              return lesson.room === selectedEntity;
            return false;
          })
          .map((lesson) => lesson.class),
      );
      return Array.from(relevantClasses);
    }
  };

  const getTeachersToDisplay = () => {
    if (filterBy === "all") {
      return TEACHERS;
    } else if (filterBy === "teacher") {
      return [selectedEntity];
    } else {
      const relevantTeachers = new Set(
        scheduledLessons
          .filter((lesson) => {
            if (filterBy === "class")
              return lesson.class === selectedEntity;
            if (filterBy === "room")
              return lesson.room === selectedEntity;
            return false;
          })
          .map((lesson) => lesson.teacher),
      );
      return Array.from(relevantTeachers);
    }
  };

  const getRoomsToDisplay = () => {
    if (filterBy === "all") {
      return ROOMS;
    } else if (filterBy === "room") {
      return [selectedEntity];
    } else {
      const relevantRooms = new Set(
        scheduledLessons
          .filter((lesson) => {
            if (filterBy === "class")
              return lesson.class === selectedEntity;
            if (filterBy === "teacher")
              return lesson.teacher === selectedEntity;
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

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto p-6 max-w-[1800px]">
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
                    value as
                      | "classes"
                      | "teachers"
                      | "rooms"
                      | "compact",
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

                <Separator
                  orientation="vertical"
                  className="h-8"
                />

                {/* Filter Button with Popover */}
                <Popover
                  open={filterPopoverOpen}
                  onOpenChange={setFilterPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Filter className="h-4 w-4" />
                      Filter
                      {filterBy !== "all" && (
                        <Badge
                          variant="secondary"
                          className="ml-1 h-5 px-1.5"
                        >
                          1
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-80 p-4"
                    align="end"
                  >
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-3">
                          Filters
                        </h4>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-xs">
                            Filter By
                          </Label>
                          <Select
                            value={filterBy}
                            onValueChange={(value: any) => {
                              setFilterBy(value);
                              if (value === "all") {
                                setSelectedEntity("");
                              } else {
                                const options =
                                  value === "class"
                                    ? CLASSES
                                    : value === "teacher"
                                      ? TEACHERS
                                      : ROOMS;
                                setSelectedEntity(options[0]);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">
                                All
                              </SelectItem>
                              <SelectItem value="class">
                                By Class
                              </SelectItem>
                              <SelectItem value="teacher">
                                By Teacher
                              </SelectItem>
                              <SelectItem value="room">
                                By Room
                              </SelectItem>
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
                                  ? CLASSES
                                  : filterBy === "teacher"
                                    ? TEACHERS
                                    : ROOMS
                                ).map((option) => (
                                  <SelectItem
                                    key={option}
                                    value={option}
                                  >
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
                            <span className="text-xs">
                              Schedule Integrity
                            </span>
                            <span className="text-xs font-semibold text-green-600">
                              {scheduleIntegrity}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs">
                              Conflicts
                            </span>
                            <Badge
                              variant={
                                conflicts > 0
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="h-5 text-xs"
                            >
                              {conflicts}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs">
                              Unplaced
                            </span>
                            <Badge
                              variant="secondary"
                              className="h-5 text-xs"
                            >
                              {unplacedLessons.length}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                <Separator
                  orientation="vertical"
                  className="h-8"
                />

                {/* Main Action Buttons */}
                <Button
                  onClick={handleOptimize}
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Optimize
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExport}
                  size="sm"
                >
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
                      />
                    ))
                  ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                      <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No scheduled lessons found for this
                        teacher.
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
                      />
                    ))
                  ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                      <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No scheduled lessons found for this
                        room.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* Compact View - Horizontal */
                <CompactViewGrid
                  lessons={filteredLessons}
                  onDrop={handleDrop}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleLock={handleToggleLock}
                  displayOptions={displayOptions}
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
                    <p className="text-sm">
                      All lessons placed!
                    </p>
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
                          <span className="opacity-75">
                            Reason:
                          </span>{" "}
                          {lesson.reason}
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