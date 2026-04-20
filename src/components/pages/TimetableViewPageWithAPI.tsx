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
  AlertCircle,
  CheckCircle2,
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
  RefreshCw,
  Zap,
  FileDown,
} from "lucide-react";
import { DndProvider, useDragLayer } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { cn } from "../ui/utils";
import { toast } from "sonner";
import {
  timetableActionApi,
  TimetableActionRequest,
  ActionResponse,
  ValidationResponse,
  initializeMockLessons
} from "../api/timetableActionApi";
import { apiCall } from '@/lib/api';
import { organizationApi } from '../../api/organizationApi';
import {
  DraggableLessonCard,
  DroppableTimeSlot,
  ClassViewGrid,
  TeacherViewGrid,
  RoomViewGrid,
  CompactViewGrid,
} from '@/components/timetable';
import type {
  Lesson,
  UnplacedLesson,
  DisplayOptions,
  TimetableDataEntity,
  TimetableFullResponse,
  ClassResponse,
  TeacherResponse,
  SubjectResponse,
  RoomResponse,
  GroupResponse,
} from '@/components/timetable/types';
import { DAYS, DAY_LABELS } from '@/components/timetable/constants';
import { subjectColorIndex } from '@/components/timetable/utils/subjectColor';

// Page-local types — shapes NOT defined in @/components/timetable/types.
// The UnscheduledLessonData shape used by this page's legacy fetcher differs
// from `UnscheduledLessonResponse` (ids vs. full objects) so it stays local.
interface UnscheduledLessonData {
  classId: number;
  teacherId: number;
  subjectId: number;
  roomIds: number[];
  requiredCount: number;
  scheduledCount: number;
  missingCount: number;
}

// Timetable metadata for score/quality display (list endpoint).
interface TimetableMeta {
  id: string;
  name: string;
  scheduled: number | null;
  unscheduled: number | null;
  score: number | null;
  teacherGaps: number | null;
  classGaps: number | null;
  createdDate: string;
  updatedDate: string;
}

// Legacy API envelope used by the page's inline fetcher. The shared types.ts
// version (`TimetableFullResponse`) assumes the 4A schema (full unscheduled
// objects); this page still reads the legacy id-based unscheduled shape.
type LegacyTimetableDataEntity = Omit<TimetableDataEntity, 'unscheduledData'> & {
  unscheduledData: UnscheduledLessonData | null;
};

interface TimetableAPIResponse {
  timetableData: LegacyTimetableDataEntity[];
  classes: ClassResponse[];
  teachers: TeacherResponse[];
  subjects: SubjectResponse[];
  rooms: RoomResponse[];
  groups: GroupResponse[];
}


const TimetableContent = ({
  timetableId,
  onNavigate,
}: {
  timetableId?: string;
  onNavigate?: (page: string) => void;
}) => {
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
  const [timetableData, setTimetableData] = useState<LegacyTimetableDataEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timetableVersion, setTimetableVersion] = useState(1);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Timetable Metadata (score, gaps)
  const [timetableMeta, setTimetableMeta] = useState<TimetableMeta | null>(null);

  // Processed data
  const [scheduledLessons, setScheduledLessons] = useState<Lesson[]>([]);
  const [unplacedLessons, setUnplacedLessons] = useState<UnplacedLesson[]>([]);
  const [companyPeriods, setCompanyPeriods] = useState<number[]>([]);

  // MANUAL PLACEMENT STATE
  const [selectedLesson, setSelectedLesson] = useState<Lesson | UnplacedLesson | null>(null);

  const handleSelectLesson = (lesson: Lesson | UnplacedLesson) => {
    if (selectedLesson?.id === lesson.id) {
      setSelectedLesson(null); // Deselect
    } else {
      setSelectedLesson(lesson);
    }
  };

  const handleManualPlace = (day: string, timeSlot: number) => {
    if (!selectedLesson) return;

    // Call the existing drop handler
    handleDrop(selectedLesson, day, timeSlot);

    // Clear selection
    setSelectedLesson(null);
  };

  // Fetch organization settings
  useEffect(() => {
    const fetchOrganizationSettings = async () => {
      try {
        const org = await organizationApi.get();
        if (org && org.periods) {
          const nonBreakPeriodsCount = org.periods.filter(p => !p.isBreak).length;
          const newPeriods = Array.from({ length: nonBreakPeriodsCount }, (_, i) => i + 1);
          if (newPeriods.length > 0) {
            setCompanyPeriods(newPeriods);
          }
        }
      } catch (error) {
        console.error('Failed to fetch organization settings:', error);
      }
    };
    fetchOrganizationSettings();
  }, []);

  // Drag Layer to track dragged item globally
  const { isDragging, draggedLesson } = useDragLayer((monitor) => ({
    isDragging: monitor.isDragging(),
    draggedLesson: monitor.getItem() as Lesson | null,
  }));

  // Fetch timetable metadata (score, gaps) from the list endpoint
  useEffect(() => {
    if (timetableId) {
      fetchTimetableMeta(timetableId);
    }
  }, [timetableId]);

  const fetchTimetableMeta = async (id: string) => {
    try {
      const res = await apiCall<TimetableMeta[]>('http://localhost:8080/api/timetable/v1/timetable');
      if (res.data) {
        const meta = res.data.find(t => t.id === id);
        if (meta) {
          setTimetableMeta(meta);
        }
      }
    } catch (err) {
      console.error('Failed to fetch timetable metadata:', err);
    }
  };

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

      const res = await apiCall<TimetableAPIResponse>(`http://localhost:8080/api/timetable/v1/timetable/${id}`);

      if (res.error) {
        throw res.error;
      }

      const apiResponse = res.data;
      if (!apiResponse) {
        throw new Error("Empty response from server");
      }

      const timetableData = apiResponse.timetableData || [];
      const classes = apiResponse.classes || [];
      const teachers = apiResponse.teachers || [];
      const subjects = apiResponse.subjects || [];
      const rooms = apiResponse.rooms || [];
      const groups = apiResponse.groups || [];

      setTimetableData(timetableData);

      // Debug: Log the full response structure
      console.log("API Response:", {
        timetableData: timetableData.slice(0, 3), // First 3 items
        classes,
        teachers,
        subjects,
        rooms,
        groups
      });

      // Debug: Check slotDetails structure
      const sampleWithDetails = timetableData.find(d => d.slotDetails?.length > 0);
      if (sampleWithDetails) {
        console.log("Sample slotDetails:", sampleWithDetails.slotDetails);
      }

      // Process the data with lookup maps
      processAPIData(timetableData, classes, teachers, subjects, rooms, groups);
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

  const processAPIData = (
    data: LegacyTimetableDataEntity[],
    classes: ClassResponse[],
    teachers: TeacherResponse[],
    subjects: SubjectResponse[],
    rooms: RoomResponse[],
    groups: GroupResponse[]
  ) => {
    // Create lookup maps for efficient ID-to-object conversion
    const classMap = new Map(classes.map(c => [c.id, c]));
    const teacherMap = new Map(teachers.map(t => [t.id, t]));
    const subjectMap = new Map(subjects.map(s => [s.id, s]));
    const roomMap = new Map(rooms.map(r => [r.id, r]));
    const groupMap = new Map(groups.map(g => [g.id, g]));

    const scheduled: Lesson[] = [];
    const unplaced: UnplacedLesson[] = [];

    data.forEach((entry) => {
      // Get class info from lookup map
      const classInfo = classMap.get(entry.classId);

      // 1. Handle Scheduled Slots (slotDetails)
      if (entry.isScheduled && entry.slotDetails && entry.slotDetails.length > 0) {
        const slotKey = `${entry.classId}::${entry.dayOfWeek}::${entry.hour}::${entry.weekIndex ?? 'W'}`;
        const groupCount = entry.slotDetails.length;

        entry.slotDetails.forEach((detail, index) => {
          const className = classInfo?.shortName || `Class ${entry.classId}`;
          const classId = classInfo?.id || entry.classId;

          // Per-detail subject. Backend now sends `subjectId` on each slot
          // detail; fall back to the legacy parent-entity field if absent.
          const resolvedSubjectId = detail.subjectId ?? entry.subjectId ?? null;
          const subj = resolvedSubjectId != null ? subjectMap.get(resolvedSubjectId) : undefined;
          const subjectName = subj?.name || "No Subject";
          const colorIndex = subjectColorIndex(resolvedSubjectId);

          // Stable per-detail id: entity + group discriminator + lesson.
          const stableId = `${entry.id}::${detail.groupId ?? 'main'}::${detail.lessonId}`;

          const tch = teacherMap.get(detail.teacherId);
          const rm = roomMap.get(detail.roomId);
          const grp = detail.groupId ? groupMap.get(detail.groupId) : null;

          scheduled.push({
            id: stableId,
            subject: subjectName,
            subjectId: resolvedSubjectId ?? 0,
            teacher: tch?.fullName || "No Teacher",
            teacherId: detail.teacherId || 0,
            teacherShort: tch?.shortName || tch?.fullName || "",
            room: rm ? rm.name : "No Room",
            roomId: detail.roomId || 0,
            class: className,
            classId: classId,
            day: entry.dayOfWeek,
            timeSlot: entry.hour,
            isLocked: false,
            groupName: grp?.name,
            groupId: detail.groupId ?? undefined,
            weekIndex: entry.weekIndex ?? undefined,
            isBiWeekly: entry.weekIndex !== null,
            rawDetails: detail,
            slotKey,
            groupIndex: index,
            groupCount,
            subjectColorIndex: colorIndex,
            entityId: entry.id,
            version: entry.version,
          });
        });
      }

      // 2. Handle Unscheduled/Unplaced Data (legacy id-based shape)
      if (!entry.isScheduled && entry.unscheduledData) {
        const ud = entry.unscheduledData;

        // Resolve entities from maps
        const subj = subjectMap.get(ud.subjectId);
        const tch = teacherMap.get(ud.teacherId);
        const cls = classMap.get(ud.classId);

        // Resolve rooms
        const roomsList = ud.roomIds ? ud.roomIds.map(rid => roomMap.get(rid)).filter(r => r) : [];
        const roomName = roomsList.length > 0
          ? roomsList.map(r => r!.name).join(", ")
          : "TBD";
        const firstRoomId = roomsList.length > 0 ? roomsList[0]!.id : 0;

        const udColorIndex = subjectColorIndex(ud.subjectId ?? null);

        unplaced.push({
          id: entry.id,
          subject: subj?.name || "Unknown Subject",
          subjectId: ud.subjectId || 0,
          teacher: tch?.fullName || "No Teacher",
          teacherId: ud.teacherId || 0,
          teacherShort: tch?.shortName || tch?.fullName || "",
          room: roomName,
          roomId: firstRoomId,
          class: cls?.shortName || "Unknown Class",
          classId: ud.classId || 0,
          isLocked: false,
          reason: `Missing ${ud.missingCount} out of ${ud.requiredCount} required lessons`,
          requiredCount: ud.requiredCount,
          scheduledCount: ud.scheduledCount,
          missingCount: ud.missingCount,
          slotKey: `unplaced::${entry.id}`,
          groupIndex: 0,
          groupCount: 1,
          subjectColorIndex: udColorIndex,
          entityId: entry.id,
          version: entry.version,
        });
      }
    });

    setScheduledLessons(scheduled);
    setUnplacedLessons(unplaced);

    console.log("Processed lessons:", { scheduled: scheduled.length, unplaced: unplaced.length });
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
    () => {
      const scheduledSlots = new Set(scheduledLessons.map((l) => l.timeSlot).filter(Boolean) as number[]);
      // Add company periods to the set
      companyPeriods.forEach(p => scheduledSlots.add(p));

      // If no company periods and no scheduled lessons, default to 1-7
      if (scheduledSlots.size === 0) {
        return [1, 2, 3, 4, 5, 6, 7];
      }

      return Array.from(scheduledSlots).sort((a, b) => a - b);
    },
    [scheduledLessons, companyPeriods],
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
                roomId: targetLesson!.roomId,
              };
            } else if (l.id === targetLesson!.id) {
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
    // kept for backward compatibility; delegate to optimize
    handleOptimize();
  };

  const handleOptimize = async () => {
    if (!timetableId) {
      toast.error('Optimallashtirish uchun jadval tanlanmagan');
      return;
    }

    setIsProcessingAction(true);
    toast.info('Jadval optimallashtirilmoqda...');

    const body = {
      applySoftConstraint: true,
      applyUnScheduledLessons: true,
      applyContinuityPenaltyTeacher: true,
      applyContinuityPenaltyClass: true,
      applyBalancedLoad: true,
      applyDailySubjectDistribution: true,
    };

    try {
      const res = await apiCall<any>(`http://localhost:8080/api/timetable/v1/timetable/optimize/${timetableId}`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (res.error) {
        toast.error('Optimallashtirish xatolik', { description: res.error.message });
      } else {
        toast.success('Optimallashtirish muvaffaqiyatli!');
        // Refresh timetable data and metadata after optimization
        try {
          await Promise.all([
            fetchTimetableData(timetableId),
            fetchTimetableMeta(timetableId),
          ]);
        } catch (e) {
          // ignore refresh errors
        }
      }
    } catch (err) {
      console.error('Optimize error:', err);
      toast.error('Optimallashtirish so\'rovi amalga oshmadi');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleExport = async () => {
    if (!timetableId) return;
    try {
      toast.info('PDF eksport qilinmoqda...');
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:8080/api/timetable/v1/timetable/export/pdf/${timetableId}`, {
        method: 'GET',
        headers: { 'Authorization': token ? `Bearer ${token}` : '' },
      });
      if (!response.ok) throw new Error('PDF eksport xatolik');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${timetableMeta?.name || 'timetable'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('PDF muvaffaqiyatli yuklandi!');
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('PDF eksport xatolik');
    }
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto p-6 max-w-[1800px]">
          <div className="flex items-center gap-3 mb-6 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
            <span className="text-sm">Loading timetable data...</span>
          </div>
          {/* 3-row skeleton so users see the grid scaffolding before content arrives */}
          <div className="space-y-3">
            <div className="animate-pulse bg-slate-100 rounded-md h-20" />
            <div className="animate-pulse bg-slate-100 rounded-md h-20" />
            <div className="animate-pulse bg-slate-100 rounded-md h-20" />
          </div>
        </div>
      </div>
    );
  }

  // Hard-error state: hide the grid entirely and let the user retry.
  // Toast already fired from fetchTimetableData, but an inline recoverable
  // state is mandatory so the page is never a blank white screen (Pass 4A).
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto p-6 max-w-[1800px]">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-1">Failed to load timetable</div>
              <div className="text-sm opacity-90">{error}</div>
            </AlertDescription>
          </Alert>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => timetableId && fetchTimetableData(timetableId)}
              disabled={!timetableId}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            {onNavigate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate("timetables")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="container mx-auto p-6 max-w-[1800px]">
        {/* Processing Action Indicator */}
        {isProcessingAction && (
          <Alert className="mb-6 bg-blue-50 border-blue-300">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <AlertDescription className="text-blue-800">
              Amal bajarilmoqda... Iltimos kuting.
            </AlertDescription>
          </Alert>
        )}

        {/* Redesigned Header - Single Line, Persistent */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/80 px-6 py-4 mb-6 sticky top-0 z-10">
          <div className="flex items-center justify-between gap-6">
            {/* Left: Page Title + Score Badges */}
            <div className="flex items-center gap-4">
              {onNavigate && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onNavigate("timetables")}
                  className="rounded-xl hover:bg-indigo-50"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-700 to-purple-600 bg-clip-text text-transparent">
                  {timetableMeta?.name || 'Dars Jadvali'}
                </h1>
              </div>

              {/* Compact score/gaps badges */}
              {timetableMeta && (
                <div className="flex items-center gap-2 ml-2">
                  {/* Score */}
                  <Badge variant="outline" className={`gap-1 px-2.5 py-1 font-bold border ${timetableMeta.score !== null && timetableMeta.score !== undefined
                    ? timetableMeta.score >= 70
                      ? 'border-green-300 bg-green-50 text-green-700'
                      : timetableMeta.score >= 50
                        ? 'border-yellow-300 bg-yellow-50 text-yellow-700'
                        : 'border-red-300 bg-red-50 text-red-700'
                    : 'border-gray-200 text-gray-400'
                    }`}>
                    <Info className="h-3 w-3" />
                    {timetableMeta.score ?? '—'} ball
                  </Badge>

                  <Separator orientation="vertical" className="h-5" />

                  {/* Scheduled / Unscheduled */}
                  <Badge variant="outline" className="gap-1 px-2 py-1 border-green-200 bg-green-50/80 text-green-700">
                    <CheckCircle2 className="h-3 w-3" />
                    {timetableMeta.scheduled ?? scheduledLessons.length}
                  </Badge>
                  {(timetableMeta.unscheduled ?? 0) > 0 && (
                    <Badge variant="outline" className="gap-1 px-2 py-1 border-red-200 bg-red-50/80 text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      {timetableMeta.unscheduled}
                    </Badge>
                  )}

                  <Separator orientation="vertical" className="h-5" />

                  {/* Gaps */}
                  <Badge variant="outline" className={`gap-1 px-2 py-1 ${(timetableMeta.teacherGaps ?? 0) > 0 ? 'border-amber-200 bg-amber-50/80 text-amber-700' : 'text-gray-400'}`}>
                    <User className="h-3 w-3" />
                    {timetableMeta.teacherGaps ?? 0}
                  </Badge>
                  <Badge variant="outline" className={`gap-1 px-2 py-1 ${(timetableMeta.classGaps ?? 0) > 0 ? 'border-purple-200 bg-purple-50/80 text-purple-700' : 'text-gray-400'}`}>
                    <Users className="h-3 w-3" />
                    {timetableMeta.classGaps ?? 0}
                  </Badge>
                </div>
              )}
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
                onClick={handleOptimize}
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                <Zap className="mr-2 h-4 w-4" />
                Optimize
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
                      draggedLesson={isDragging ? draggedLesson : null}
                      allLessons={scheduledLessons}
                      selectedLesson={selectedLesson}
                      onManualPlace={handleManualPlace}
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
                      draggedLesson={isDragging ? draggedLesson : null}
                      allLessons={scheduledLessons}
                      selectedLesson={selectedLesson}
                      onManualPlace={handleManualPlace}
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
                      draggedLesson={isDragging ? draggedLesson : null}
                      allLessons={scheduledLessons}
                      selectedLesson={selectedLesson}
                      onManualPlace={handleManualPlace}
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
                draggedLesson={isDragging ? draggedLesson : null}
                allLessons={scheduledLessons}
                selectedLesson={selectedLesson}
                onManualPlace={handleManualPlace}
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
                        isSelected={selectedLesson?.id === lesson.id}
                        onSelect={handleSelectLesson}
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
  );
}

export default function TimetableViewPageWithAPI(props: {
  timetableId?: string;
  onNavigate?: (page: string) => void;
}) {
  return (
    <DndProvider backend={HTML5Backend}>
      <TimetableContent {...props} />
    </DndProvider>
  );
}
