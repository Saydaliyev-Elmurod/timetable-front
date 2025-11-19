import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from '@/i18n/index';
import { LessonService } from '@/lib/lessons';
import { TeacherService } from '@/lib/teachers';
import { SubjectService } from '@/lib/subjects';
import { apiCall, getApiUrl } from '@/lib/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../ui/card';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '../ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Plus, Download, Upload, Pencil, Trash2, BookOpen, Clock, GraduationCap, FileText, Users, ChevronDown, ChevronRight, ChevronsDown, ChevronsUp, MapPin, Zap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandGroup, CommandInput, CommandItem, CommandEmpty } from '../ui/command';
import { Badge } from '../ui/badge';
import { Check } from 'lucide-react';
import { X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

// Lightweight local types to keep the page functional until stricter typings are added
type InternalLesson = any;
type LessonResponse = any;
type LessonSubmitData = any;
type GroupedData = any;
type ViewType = 'classes' | 'teachers' | 'subjects' | 'rooms';

export default function LessonsPage() {
  const { t } = useTranslation();
  const [lessons, setLessons] = useState<{
    classes: GroupedData[];
    teachers: GroupedData[];
    subjects: GroupedData[];
    rooms: GroupedData[];
  }>({ classes: [], teachers: [], subjects: [], rooms: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [editingLesson, setEditingLesson] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<ViewType>('classes');
  const [allExpanded, setAllExpanded] = useState(false);
  const [optimizeOpen, setOptimizeOpen] = useState(false);
  const [optTimetableId, setOptTimetableId] = useState<string>('');
  const [applySoftConstraint, setApplySoftConstraint] = useState(true);
  const [applyUnScheduledLessons, setApplyUnScheduledLessons] = useState(true);
  const [applyUnScheduledLessonsPenalty, setApplyUnScheduledLessonsPenalty] = useState<number>(100);
  const [applyContinuityPenaltyTeacher, setApplyContinuityPenaltyTeacher] = useState(true);
  const [applyContinuityPenaltyTeacherPenalty, setApplyContinuityPenaltyTeacherPenalty] = useState<number>(20);
  const [applyContinuityPenaltyClass, setApplyContinuityPenaltyClass] = useState(true);
  const [applyContinuityPenaltyClassPenalty, setApplyContinuityPenaltyClassPenalty] = useState<number>(50);
  const [applyBalancedLoad, setApplyBalancedLoad] = useState(true);
  const [applyBalancedLoadPenalty, setApplyBalancedLoadPenalty] = useState<number>(30);
  const [applyDailySubjectDistribution, setApplyDailySubjectDistribution] = useState(true);
  const [applyDailySubjectDistributionPenalty, setApplyDailySubjectDistributionPenalty] = useState<number>(30);
  const [isOptimizing, setIsOptimizing] = useState(false);
  // Entity edit (class / teacher / subject) state
  const [entityEditOpen, setEntityEditOpen] = useState(false);
  const [entityEditType, setEntityEditType] = useState<'class' | 'teacher' | 'subject' | null>(null);
  const [entityEditId, setEntityEditId] = useState<number | null>(null);
  const [entityEditData, setEntityEditData] = useState<any>(null);
  const [entityLoading, setEntityLoading] = useState(false);
  const [entitySaving, setEntitySaving] = useState(false);
  const [entityTeachers, setEntityTeachers] = useState<any[]>([]);
  const [entityRooms, setEntityRooms] = useState<any[]>([]);
  const [entitySubjects, setEntitySubjects] = useState<any[]>([]);
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const periods = [1, 2, 3, 4, 5, 6, 7];

  const toggleEntityAvailability = (day: string, period: number) => {
    setEntityEditData((prev: any) => {
      const availability = { ...(prev.availability || {}) };
      availability[day] = availability[day] || [];
      availability[day] = availability[day].includes(period)
        ? availability[day].filter((p: number) => p !== period)
        : [...availability[day], period].sort((a: number, b: number) => a - b);
      return { ...prev, availability };
    });
  };

  const toggleEntityDay = (day: string) => {
    setEntityEditData((prev: any) => {
      const availability = { ...(prev.availability || {}) };
      const dayPeriods = availability[day] || [];
      const allSelected = periods.every(p => dayPeriods.includes(p));
      availability[day] = allSelected ? [] : [...periods];
      return { ...prev, availability };
    });
  };

  const toggleEntityPeriodAcrossDays = (period: number) => {
    setEntityEditData((prev: any) => {
      const availability = { ...(prev.availability || {}) };
      const isSelected = days.some(day => (availability[day] || []).includes(period));
      days.forEach(day => {
        availability[day] = availability[day] || [];
        if (isSelected) {
          availability[day] = availability[day].filter((p: number) => p !== period);
        } else {
          if (!availability[day].includes(period)) availability[day] = [...availability[day], period].sort((a:number,b:number)=>a-b);
        }
      });
      return { ...prev, availability };
    });
  };

  const selectAllEntityAvailability = () => {
    setEntityEditData((prev: any) => {
      const availability: any = {};
      days.forEach(day => availability[day] = [...periods]);
      return { ...prev, availability };
    });
  };

  const clearAllEntityAvailability = () => {
    setEntityEditData((prev: any) => {
      const availability: any = {};
      days.forEach(day => availability[day] = []);
      return { ...prev, availability };
    });
  };

  const toggleEntitySubject = (subjectId: number) => {
    setEntityEditData((prev: any) => {
      const current = Array.isArray(prev.selectedSubjectIds) ? [...prev.selectedSubjectIds] : [];
      const idx = current.indexOf(subjectId);
      if (idx === -1) current.push(subjectId);
      else current.splice(idx, 1);
      return { ...prev, selectedSubjectIds: current };
    });
  };

  const removeEntitySubject = (subjectId: number) => {
    setEntityEditData((prev: any) => ({ ...prev, selectedSubjectIds: (prev.selectedSubjectIds || []).filter((s: any) => s !== subjectId) }));
  };

  const toggleEntityRoom = (roomId: string) => {
    setEntityEditData((prev: any) => {
      const current = Array.isArray(prev.roomIds) ? [...prev.roomIds] : [];
      const idx = current.indexOf(roomId);
      if (idx === -1) current.push(roomId);
      else current.splice(idx, 1);
      return { ...prev, roomIds: current };
    });
  };

  const toggleCardExpansion = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleExpandAll = () => {
    setAllExpanded((prev) => {
      const next = !prev;
      if (!next) {
        setExpandedCards(new Set());
      }
      return next;
    });
  };

  const openEntityEditor = async (type: 'class' | 'teacher' | 'subject', id: number) => {
    setEntityEditOpen(true);
    setEntityEditType(type);
    setEntityEditId(id);
    setEntityLoading(true);
    setEntityEditData(null);

    try {
      if (type === 'teacher') {
        const data = await TeacherService.getById(id);
        // fetch subjects for selector
        try {
          const subs = await SubjectService.getAll();
          setEntitySubjects(Array.isArray(subs) ? subs : []);
        } catch (e) {
          setEntitySubjects([]);
        }

        setEntityEditData({
          fullName: data.fullName,
          shortName: data.shortName,
          selectedSubjectIds: Array.isArray(data.subjects) ? data.subjects.map((s: any) => s.id) : [],
          availability: convertFromTimeSlots(data.availabilities),
          isActive: (data as any).isActive ?? true,
          updatedDate: (data as any).updatedDate,
          createdDate: (data as any).createdDate,
          raw: data
        });
      } else if (type === 'subject') {
        const data = await SubjectService.getById(id);
        setEntityEditData({ name: data.name, shortName: data.shortName, raw: data });
      } else if (type === 'class') {
        const url = `${getApiUrl('CLASSES')}/${id}`;
        const res = await apiCall<any>(url);
        if (res.error) throw res.error;
        const cls = res.data;
        // fetch teachers and rooms to populate select lists
        try {
          const tRes = await TeacherService.getAll();
          setEntityTeachers(Array.isArray(tRes) ? tRes : []);
        } catch (e) {
          setEntityTeachers([]);
        }
        try {
          const roomsRes = await apiCall<any>(`${getApiUrl('ROOMS')}/all`);
          setEntityRooms(Array.isArray(roomsRes?.data) ? roomsRes.data : []);
        } catch (e) {
          setEntityRooms([]);
        }

        setEntityEditData({
          name: cls.name,
          shortName: cls.shortName,
          classTeacher: cls.teacher?.id ? String(cls.teacher.id) : '',
          roomIds: Array.isArray(cls.rooms) ? cls.rooms.map((r: any) => String(r.id)) : [],
          availability: convertFromTimeSlots(cls?.availabilities),
          isActive: cls.isActive ?? true,
          updatedDate: cls.updatedDate,
          createdDate: cls.createdDate,
          raw: cls
        });
      }
    } catch (err) {
      console.error('Failed to load entity for edit', err);
      toast.error(t('lessons.failed_to_load_entity'));
      setEntityEditOpen(false);
      setEntityEditType(null);
      setEntityEditId(null);
    } finally {
      setEntityLoading(false);
    }
  };

  // Helpers to convert availability/timeSlots (copied from ClassesPage)
  const convertFromTimeSlots = (timeSlots: any) => {
    const dayMapping: any = {
      MONDAY: 'monday',
      TUESDAY: 'tuesday',
      WEDNESDAY: 'wednesday',
      THURSDAY: 'thursday',
      FRIDAY: 'friday',
      SATURDAY: 'saturday',
      SUNDAY: 'sunday'
    };

    const availability: any = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    };

    if (timeSlots) {
      timeSlots.forEach((slot: any) => {
        const day = dayMapping[slot.dayOfWeek];
        if (day) {
          availability[day] = slot.lessons || [];
        }
      });
    }

    return availability;
  };

  const convertToTimeSlots = (availability: any) => {
    const dayMapping: any = {
      monday: 'MONDAY',
      tuesday: 'TUESDAY',
      wednesday: 'WEDNESDAY',
      thursday: 'THURSDAY',
      friday: 'FRIDAY',
      saturday: 'SATURDAY',
      sunday: 'SUNDAY'
    };

    const timeSlots: any[] = [];
    Object.entries(availability).forEach(([day, lessons]) => {
      if (lessons && (lessons as any[]).length > 0) {
        timeSlots.push({
          dayOfWeek: dayMapping[day],
          lessons: (lessons as any[]).sort((a: number, b: number) => a - b)
        });
      }
    });
    return timeSlots;
  };

  const updateEntityField = (field: string, value: any) => {
    setEntityEditData((prev: any) => ({ ...(prev || {}), [field]: value }));
  };

  const saveEntityEdit = async () => {
    if (!entityEditType || !entityEditId || !entityEditData) return;
    setEntitySaving(true);
    try {
      if (entityEditType === 'teacher') {
        // TeacherService.update expects TeacherUpdateRequest; provide minimal structure
        await TeacherService.update(entityEditId, {
          fullName: entityEditData.fullName,
          shortName: entityEditData.shortName || '',
          subjects: Array.isArray(entityEditData.selectedSubjectIds)
            ? entityEditData.selectedSubjectIds
            : (entityEditData.raw?.subjects || []).map((s: any) => s.id) || [],
          deletedSubjects: [],
          availabilities: convertToTimeSlots(entityEditData.availability || {})
        });
        toast.success(t('lessons.teacher_updated'));
      } else if (entityEditType === 'subject') {
        await SubjectService.update(entityEditId, {
          name: entityEditData.name,
          shortName: entityEditData.shortName || '',
          availabilities: entityEditData.raw?.availabilities || []
        });
        toast.success(t('lessons.subject_updated'));
      } else if (entityEditType === 'class') {
          const url = `${getApiUrl('CLASSES')}/${entityEditId}`;
          const body: any = {
            name: entityEditData.name,
            shortName: entityEditData.shortName || '',
            isActive: entityEditData.isActive ?? true,
            teacherId: entityEditData.classTeacher ? parseInt(entityEditData.classTeacher, 10) : null,
            rooms: Array.isArray(entityEditData.roomIds) ? entityEditData.roomIds.map((r: any) => ({ id: parseInt(r, 10) })) : [],
            availabilities: convertToTimeSlots(entityEditData.availability || {}),
          };

          await apiCall(url, {
            method: 'PUT',
            body: JSON.stringify(body)
          });
          toast.success(t('lessons.class_updated'));
      }

      // refresh lessons and close
      await fetchLessons();
      setEntityEditOpen(false);
      setEntityEditType(null);
      setEntityEditId(null);
      setEntityEditData(null);
    } catch (err) {
      console.error('Failed to save entity', err);
      toast.error(t('lessons.failed_to_save'));
    } finally {
      setEntitySaving(false);
    }
  };

  const handleAdd = (className?: string) => {
    setEditingLesson({ class: className } as any);
    setIsDialogOpen(true);
  };
  const handleEdit = (lesson: any) => {
    setEditingLesson(lesson);
    setIsDialogOpen(true);
  };

  // Fetch lessons from API
  const fetchLessons = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await LessonService.getAll();

      // Convert API format to internal flat format but keep original for grouping
      const flat = data.map((lesson: LessonResponse) => ({
        id: lesson.id,
        raw: lesson,
        subject: lesson.subject?.name || t('lessons.unknown_subject'),
        teacher: lesson.teacher?.fullName || t('lessons.unknown_teacher'),
        className: lesson.class?.shortName || lesson.class?.name || t('lessons.unknown_class'),
        classId: lesson.class?.id,
        day: lesson.dayOfWeek,
        startTime: `${lesson.hour}:00`,
        endTime: `${lesson.hour + 1}:00`,
        period: lesson.period,
        frequency: `${lesson.lessonCount}x`,
        rooms: lesson.rooms || [],
        roomNames: lesson.rooms?.map((r: any) => r.name).join(', ') || t('lessons.no_room'),
        duration: '45 min'
      }));

      // Group by class and compute unique teacher/subject counts
      const classesMap = new Map<string | number, any>();
      const teachersMap = new Map<string | number, any>();
      const subjectsMap = new Map<string | number, any>();
      const roomsMap = new Map<string | number, any>();

      flat.forEach((f) => {
        // classes
        const classKey = f.classId ?? f.className ?? `class-${f.id}`;
        if (!classesMap.has(classKey)) {
          classesMap.set(classKey, {
            id: String(classKey),
            name: f.className,
            totalLessons: 0,
            totalPeriods: 0,
            teachers: 0,
            subjects: 0,
            lessons: [] as any[],
            _teacherIds: new Set<number | string>(),
            _subjectIds: new Set<number | string>(),
          });
        }
          const c = classesMap.get(classKey);
          c.lessons.push(f);
          c.totalLessons += 1;
          // accumulate totalPeriods from lesson counts when available (default to 1)
          c.totalPeriods += (f.raw?.lessonCount && Number(f.raw.lessonCount)) ? Number(f.raw.lessonCount) : 1;
        // record unique teacher/subject ids
        if (f.raw?.teacher?.id) c._teacherIds.add(f.raw.teacher.id);
        if (f.raw?.subject?.id) c._subjectIds.add(f.raw.subject.id);

        // teachers
        const teacherKey = f.raw.teacher?.id ?? f.teacher ?? `teacher-${f.id}`;
        if (!teachersMap.has(teacherKey)) {
          teachersMap.set(teacherKey, {
            id: String(teacherKey),
            name: f.teacher,
            totalLessons: 0,
            totalPeriods: 0,
            classes: 0,
            lessons: [] as any[],
            _classIds: new Set<number | string>(),
          });
        }
        const tr = teachersMap.get(teacherKey);
        tr.lessons.push(f);
        tr.totalLessons += 1;
        // count periods for teacher (use lessonCount if present otherwise count as 1)
        tr.totalPeriods += (f.raw?.lessonCount && Number(f.raw.lessonCount)) ? Number(f.raw.lessonCount) : 1;
        if (f.classId) tr._classIds.add(f.classId);

        // subjects
        const subjectKey = f.raw.subject?.id ?? f.subject ?? `subject-${f.id}`;
        if (!subjectsMap.has(subjectKey)) {
          subjectsMap.set(subjectKey, {
            id: String(subjectKey),
            name: f.subject,
            totalLessons: 0,
            teachers: 0,
            classes: 0,
            lessons: [] as any[],
            _classIds: new Set<number | string>(),
            _teacherIds: new Set<number | string>(),
          });
        }
        const s = subjectsMap.get(subjectKey);
        s.lessons.push(f);
        s.totalLessons += 1;
        if (f.classId) s._classIds.add(f.classId);
        if (f.raw?.teacher?.id) s._teacherIds.add(f.raw.teacher.id);

        // rooms (a lesson can belong to multiple rooms)
        (f.rooms || []).forEach((r: any) => {
          const roomKey = r.id ?? r.name ?? `room-${f.id}`;
          if (!roomsMap.has(roomKey)) {
            roomsMap.set(roomKey, {
              id: String(roomKey),
              name: r.name || t('lessons.unknown_room'),
              totalLessons: 0,
              teachers: 0,
              classes: 0,
              lessons: [] as any[],
              _classIds: new Set<number | string>(),
              _teacherIds: new Set<number | string>(),
            });
          }
          const rm = roomsMap.get(roomKey);
          rm.lessons.push(f);
          rm.totalLessons += 1;
          if (f.classId) rm._classIds.add(f.classId);
          if (f.raw?.teacher?.id) rm._teacherIds.add(f.raw.teacher.id);
        });
      });

      // finalize counts by converting internal Sets to numeric fields
      const finalize = (arr: any[]) => arr.map((it) => {
        if (it._teacherIds) {
          it.teachers = it._teacherIds.size;
          delete it._teacherIds;
        }
        if (it._subjectIds) {
          it.subjects = it._subjectIds.size;
          delete it._subjectIds;
        }
        if (it._classIds) {
          it.classes = it._classIds.size;
          delete it._classIds;
        }
        if (typeof it.totalPeriods === 'undefined') it.totalPeriods = it.totalPeriods || 0;
        if (it._teacherIds === undefined && it.teachers === undefined) {
          it.teachers = it.teachers || 0;
        }
        if (it._subjectIds === undefined && it.subjects === undefined) {
          it.subjects = it.subjects || 0;
        }
        return it;
      });

      setLessons({
        classes: finalize(Array.from(classesMap.values())),
        teachers: finalize(Array.from(teachersMap.values())),
        subjects: finalize(Array.from(subjectsMap.values())),
        rooms: finalize(Array.from(roomsMap.values())),
      });

      setTotalElements(data.length);
      setTotalPages(1);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      toast.error(t('lessons.failed_to_load_lessons'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  // Load lessons on mount
  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  // ... (useEffect and other functions)

  const handleDelete = async (id: number) => {
    try {
      await LessonService.delete(id);
      // refresh listing after delete to keep grouped state consistent
      await fetchLessons();
      toast.success(t('lessons.lesson_deleted_successfully'));
    } catch (error) {
      console.error('Failed to delete lesson:', error);
      toast.error(t('lessons.failed_to_delete_lesson'));
    }
  };

  const handleSubmit = async (_lessonData: LessonSubmitData) => {
    try {
      // ... (logic for fetching data and creating lessonRequest)

      // Call the API - create or update
      const lessonRequest = {} as any;
      if (editingLesson && editingLesson.id) {
        await LessonService.update(editingLesson.id, lessonRequest);
        toast.success(t('lessons.lesson_updated_successfully'));
      } else {
        await LessonService.create(lessonRequest);
        toast.success(t('lessons.lesson_created_successfully'));
      }

      // ... (logic for refreshing lessons)
    } catch (error) {
      console.error('Failed to save lesson:', error);
      if (editingLesson) {
        toast.error(t('lessons.failed_to_update_lesson'));
      } else {
        toast.error(t('lessons.failed_to_create_lesson'));
      }
    }
    
    setEditingLesson(null);
    setIsDialogOpen(false);
  };

  const handleOptimizeSubmit = async () => {
    if (!optTimetableId) {
      toast.error(t('lessons.optimize_no_timetable_id'));
      return;
    }

    const timetableIdNum = parseInt(optTimetableId, 10);
    if (isNaN(timetableIdNum)) {
      toast.error(t('lessons.optimize_invalid_timetable_id'));
      return;
    }

    const body = {
      applySoftConstraint,
      applyUnScheduledLessons,
      applyUnScheduledLessonsPenalty,
      applyContinuityPenaltyTeacher,
      applyContinuityPenaltyTeacherPenalty,
      applyContinuityPenaltyClass,
      applyContinuityPenaltyClassPenalty,
      applyBalancedLoad,
      applyBalancedLoadPenalty,
      applyDailySubjectDistribution,
      applyDailySubjectDistributionPenalty,
    } as any;

    setIsOptimizing(true);
    try {
      const res = await (await import('@/lib/api')).apiCall<any>(`http://localhost:8080/api/timetable/v1/timetable/optimize/${timetableIdNum}`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (res?.error) {
        console.error('Optimize failed', res);
        toast.error(t('lessons.optimize_failed'));
      } else {
        toast.success(t('lessons.optimize_started'));
        // refresh lessons after an optimization attempt
        fetchLessons();
      }
    } catch (err) {
      console.error('Optimize request error', err);
      toast.error(t('lessons.optimize_failed'));
    } finally {
      setIsOptimizing(false);
      setOptimizeOpen(false);
    }
  };

  const renderLessonCard = (item: GroupedData, type: ViewType) => {
    const isExpanded = expandedCards.has(item.id);
    
    return (
      <Card key={item.id} className="mb-4">
        <Collapsible
          open={isExpanded}
          onOpenChange={() => toggleCardExpansion(item.id)}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    {type === 'classes' && (
                      <>
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          {t('lessons.lessons_count').replace('{{count}}', String(item.totalLessons))}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {t('lessons.total_periods').replace('{{count}}', String(item.totalPeriods))}
                        </span>
                        <span className="flex items-center gap-1">
                          <GraduationCap className="h-4 w-4" />
                          {t('lessons.teachers_count').replace('{{count}}', String(item.teachers))}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {t('lessons.subjects_count').replace('{{count}}', String(item.subjects))}
                        </span>
                      </>
                    )}
                    {type === 'teachers' && (
                      <>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {t('lessons.classes_count').replace('{{count}}', String(item.classes))}
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          {t('lessons.lessons_count').replace('{{count}}', String(item.totalLessons))}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {t('lessons.total_periods').replace('{{count}}', String(item.totalPeriods))}
                        </span>
                      </>
                    )}
                      {type === 'subjects' && (
                      <>
                        <span className="flex items-center gap-1">
                          <GraduationCap className="h-4 w-4" />
                          {t('lessons.teachers_count').replace('{{count}}', String(item.teachers))}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {t('lessons.classes_count').replace('{{count}}', String(item.classes))}
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          {t('lessons.lessons_count').replace('{{count}}', String(item.totalLessons))}
                        </span>
                      </>
                    )}
                    {type === 'rooms' && (
                      <>
                        <span className="flex items-center gap-1">
                          <GraduationCap className="h-4 w-4" />
                          {t('lessons.teachers_count').replace('{{count}}', String(item.teachers))}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {t('lessons.classes_count').replace('{{count}}', String(item.classes))}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {t('lessons.total_periods').replace('{{count}}', String(item.totalPeriods))}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {type === 'classes' && (
                    <>
                      <Button size="sm" onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleAdd(item.name);
                      }}>
                        <Plus className="h-4 w-4 mr-1" />
                        {t('lessons.add_lesson_for_class')}
                      </Button>
                      <Button size="sm" variant="outline" onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        const idNum = Number(item.id);
                        if (isNaN(idNum)) {
                          toast.error(t('lessons.cannot_edit_unknown_class'));
                          return;
                        }
                        openEntityEditor('class', idNum);
                      }}>
                        <Pencil className="h-4 w-4 mr-1" />
                        {t('lessons.edit_class')}
                      </Button>
                    </>
                  )}
                  {type === 'teachers' && (
                    <Button size="sm" variant="outline" onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      const idNum = Number(item.id);
                      if (isNaN(idNum)) {
                        toast.error(t('lessons.cannot_edit_unknown_teacher'));
                        return;
                      }
                      openEntityEditor('teacher', idNum);
                    }}>
                      <Pencil className="h-4 w-4 mr-1" />
                      {t('lessons.edit_teacher')}
                    </Button>
                  )}
                  {type === 'subjects' && (
                    <Button size="sm" variant="outline" onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      const idNum = Number(item.id);
                      if (isNaN(idNum)) {
                        toast.error(t('lessons.cannot_edit_unknown_subject'));
                        return;
                      }
                      openEntityEditor('subject', idNum);
                    }}>
                      <Pencil className="h-4 w-4 mr-1" />
                      {t('lessons.edit_subject')}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    {type === 'classes' && (
                      <>
                        <TableHead>{t('lessons.subject')}</TableHead>
                        <TableHead>{t('lessons.teacher')}</TableHead>
                        <TableHead>{t('lessons.frequency')}</TableHead>
                        <TableHead>{t('lessons.room')}</TableHead>
                        <TableHead>{t('lessons.duration')}</TableHead>
                        <TableHead className="text-right">{t('lessons.actions')}</TableHead>
                      </>
                    )}
                    {type === 'teachers' && (
                      <>
                        <TableHead>{t('lessons.class')}</TableHead>
                        <TableHead>{t('lessons.subject')}</TableHead>
                        <TableHead>{t('lessons.frequency')}</TableHead>
                        <TableHead>{t('lessons.room')}</TableHead>
                        <TableHead>{t('lessons.duration')}</TableHead>
                        <TableHead className="text-right">{t('lessons.actions')}</TableHead>
                      </>
                    )}
                    {type === 'subjects' && (
                      <>
                        <TableHead>{t('lessons.teacher')}</TableHead>
                        <TableHead>{t('lessons.class')}</TableHead>
                        <TableHead>{t('lessons.frequency')}</TableHead>
                        <TableHead>{t('lessons.room')}</TableHead>
                        <TableHead>{t('lessons.duration')}</TableHead>
                        <TableHead className="text-right">{t('lessons.actions')}</TableHead>
                      </>
                    )}
                    {type === 'rooms' && (
                      <>
                        <TableHead>{t('lessons.class')}</TableHead>
                        <TableHead>{t('lessons.subject')}</TableHead>
                        <TableHead>{t('lessons.teacher')}</TableHead>
                        <TableHead>{t('lessons.frequency')}</TableHead>
                        <TableHead>{t('lessons.duration')}</TableHead>
                        <TableHead className="text-right">{t('lessons.actions')}</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {item.lessons.map((lesson: InternalLesson) => (
                    <TableRow key={lesson.id}>
                      {type === 'classes' && (
                        <>
                          <TableCell>{lesson.subject || lesson.raw?.subject?.name || t('lessons.unknown_subject')}</TableCell>
                          <TableCell>{lesson.teacher || lesson.raw?.teacher?.fullName || t('lessons.unknown_teacher')}</TableCell>
                          <TableCell>{lesson.frequency || (lesson.lessonCount ? `${lesson.lessonCount}x` : '-')}</TableCell>
                          <TableCell>{lesson.roomNames || (lesson.rooms && lesson.rooms.length ? lesson.rooms.map((r: any) => r.name).join(', ') : t('lessons.no_room'))}</TableCell>
                          <TableCell>{lesson.duration || `${lesson.raw?.duration || '45'} min`}</TableCell>
                        </>
                      )}

                      {type === 'teachers' && (
                        <>
                          <TableCell>{lesson.className || lesson.raw?.class?.shortName || t('lessons.unknown_class')}</TableCell>
                          <TableCell>{lesson.subject || lesson.raw?.subject?.name || t('lessons.unknown_subject')}</TableCell>
                          <TableCell>{lesson.frequency || (lesson.lessonCount ? `${lesson.lessonCount}x` : '-')}</TableCell>
                          <TableCell>{lesson.roomNames || (lesson.rooms && lesson.rooms.length ? lesson.rooms.map((r: any) => r.name).join(', ') : t('lessons.no_room'))}</TableCell>
                          <TableCell>{lesson.duration || `${lesson.raw?.duration || '45'} min`}</TableCell>
                        </>
                      )}

                      {type === 'subjects' && (
                        <>
                          <TableCell>{lesson.teacher || lesson.raw?.teacher?.fullName || t('lessons.unknown_teacher')}</TableCell>
                          <TableCell>{lesson.className || lesson.raw?.class?.shortName || t('lessons.unknown_class')}</TableCell>
                          <TableCell>{lesson.frequency || (lesson.lessonCount ? `${lesson.lessonCount}x` : '-')}</TableCell>
                          <TableCell>{lesson.roomNames || (lesson.rooms && lesson.rooms.length ? lesson.rooms.map((r: any) => r.name).join(', ') : t('lessons.no_room'))}</TableCell>
                          <TableCell>{lesson.duration || `${lesson.raw?.duration || '45'} min`}</TableCell>
                        </>
                      )}

                      {type === 'rooms' && (
                        <>
                          <TableCell>{lesson.className || lesson.raw?.class?.shortName || t('lessons.unknown_class')}</TableCell>
                          <TableCell>{lesson.subject || lesson.raw?.subject?.name || t('lessons.unknown_subject')}</TableCell>
                          <TableCell>{lesson.teacher || lesson.raw?.teacher?.fullName || t('lessons.unknown_teacher')}</TableCell>
                          <TableCell>{lesson.frequency || (lesson.lessonCount ? `${lesson.lessonCount}x` : '-')}</TableCell>
                          <TableCell>{lesson.duration || `${lesson.raw?.duration || '45'} min`}</TableCell>
                        </>
                      )}

                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(lesson)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(lesson.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    {t('lessons.export_csv')}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    {t('lessons.bulk_import')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  };

  return (
    <div className="flex gap-6">
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2>{t('lessons.title')}</h2>
            <p className="text-muted-foreground">
              {t('lessons.description')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={toggleExpandAll}
              className="flex items-center gap-2"
            >
              {allExpanded ? (
                <>
                      <ChevronsUp className="h-4 w-4" />
                  {t('lessons.collapse_all')}
                </>
              ) : (
                <>
                  <ChevronsDown className="h-4 w-4" />
                  {t('lessons.expand_all')}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="classes" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t('lessons.classes')}
            </TabsTrigger>
            <TabsTrigger value="teachers" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              {t('lessons.teachers')}
            </TabsTrigger>
            <TabsTrigger value="subjects" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              {t('lessons.subjects')}
            </TabsTrigger>
            <TabsTrigger value="rooms" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {t('lessons.rooms')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="classes" className="space-y-4 mt-6">
            {lessons.classes.length === 0 && !isLoading && (
              <div className="text-muted-foreground">{t('lessons.no_lessons_found')}</div>
            )}
            {lessons.classes.map((item) => renderLessonCard(item, 'classes'))}
          </TabsContent>

          <TabsContent value="teachers" className="space-y-4 mt-6">
            {lessons.teachers.length === 0 && !isLoading && (
              <div className="text-muted-foreground">{t('lessons.no_lessons_found')}</div>
            )}
            {lessons.teachers.map((item) => renderLessonCard(item, 'teachers'))}
          </TabsContent>

          <TabsContent value="subjects" className="space-y-4 mt-6">
            {lessons.subjects.length === 0 && !isLoading && (
              <div className="text-muted-foreground">{t('lessons.no_lessons_found')}</div>
            )}
            {lessons.subjects.map((item) => renderLessonCard(item, 'subjects'))}
          </TabsContent>

          <TabsContent value="rooms" className="space-y-4 mt-6">
            {lessons.rooms.length === 0 && !isLoading && (
              <div className="text-muted-foreground">{t('lessons.no_lessons_found')}</div>
            )}
            {lessons.rooms.map((item) => renderLessonCard(item, 'rooms'))}
          </TabsContent>
        </Tabs>

        {/* Global Actions */}
        <div className="flex justify-between items-center pt-6 border-t">
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              {t('lessons.export_csv')}
            </Button>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              {t('lessons.bulk_import')}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setOptimizeOpen(true)}
              variant="secondary"
              size="sm"
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              {t('lessons.optimize')}
            </Button>
            <Button onClick={() => handleAdd()}>
              <Plus className="mr-2 h-4 w-4" />
              {t('lessons.add_lesson')}
            </Button>
          </div>
        </div>
      </div>

      {/* ... (Tips & Tricks Sidebar) */}
        <Dialog open={optimizeOpen} onOpenChange={setOptimizeOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('lessons.optimize_title')}</DialogTitle>
              <DialogDescription>
                {t('lessons.optimize_description')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">{t('lessons.timetable_id')}</Label>
                  <Input value={optTimetableId} onChange={(e) => setOptTimetableId(e.target.value)} placeholder={t('lessons.timetable_id_placeholder')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">{t('lessons.apply_soft_constraint')}</Label>
                  </div>
                  <Switch checked={applySoftConstraint} onCheckedChange={(v: any) => setApplySoftConstraint(!!v)} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">{t('lessons.apply_unscheduled')}</Label>
                  </div>
                  <Switch checked={applyUnScheduledLessons} onCheckedChange={(v: any) => setApplyUnScheduledLessons(!!v)} />
                </div>

                <div>
                  <Label className="text-sm">{t('lessons.apply_unscheduled_penalty')}</Label>
                  <Input type="number" value={String(applyUnScheduledLessonsPenalty)} onChange={(e) => setApplyUnScheduledLessonsPenalty(Number(e.target.value || 0))} />
                </div>

                <div>
                  <Label className="text-sm">{t('lessons.apply_continuity_teacher')}</Label>
                  <div className="flex items-center gap-2">
                    <Switch checked={applyContinuityPenaltyTeacher} onCheckedChange={(v: any) => setApplyContinuityPenaltyTeacher(!!v)} />
                    <Input type="number" value={String(applyContinuityPenaltyTeacherPenalty)} onChange={(e) => setApplyContinuityPenaltyTeacherPenalty(Number(e.target.value || 0))} />
                  </div>
                </div>

                <div>
                  <Label className="text-sm">{t('lessons.apply_continuity_class')}</Label>
                  <div className="flex items-center gap-2">
                    <Switch checked={applyContinuityPenaltyClass} onCheckedChange={(v: any) => setApplyContinuityPenaltyClass(!!v)} />
                    <Input type="number" value={String(applyContinuityPenaltyClassPenalty)} onChange={(e) => setApplyContinuityPenaltyClassPenalty(Number(e.target.value || 0))} />
                  </div>
                </div>

                <div>
                  <Label className="text-sm">{t('lessons.apply_balanced_load')}</Label>
                  <div className="flex items-center gap-2">
                    <Switch checked={applyBalancedLoad} onCheckedChange={(v: any) => setApplyBalancedLoad(!!v)} />
                    <Input type="number" value={String(applyBalancedLoadPenalty)} onChange={(e) => setApplyBalancedLoadPenalty(Number(e.target.value || 0))} />
                  </div>
                </div>

                <div>
                  <Label className="text-sm">{t('lessons.apply_daily_subject_distribution')}</Label>
                  <div className="flex items-center gap-2">
                    <Switch checked={applyDailySubjectDistribution} onCheckedChange={(v: any) => setApplyDailySubjectDistribution(!!v)} />
                    <Input type="number" value={String(applyDailySubjectDistributionPenalty)} onChange={(e) => setApplyDailySubjectDistributionPenalty(Number(e.target.value || 0))} />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <div className="flex gap-2 w-full justify-end">
                <Button variant="ghost" onClick={() => setOptimizeOpen(false)}>{t('actions.cancel')}</Button>
                <Button onClick={handleOptimizeSubmit} disabled={isOptimizing}>
                  {isOptimizing ? t('lessons.optimizing') : t('lessons.optimize')}
                </Button>
              </div>
            </DialogFooter>
            <DialogClose />
          </DialogContent>
        </Dialog>
        {/* Entity Edit Dialog (Class / Teacher / Subject) */}
        <Dialog open={entityEditOpen} onOpenChange={(open) => {
          setEntityEditOpen(open);
          if (!open) {
            setEntityEditType(null);
            setEntityEditId(null);
            setEntityEditData(null);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {entityEditType === 'class' && t('lessons.edit_class')}
                {entityEditType === 'teacher' && t('lessons.edit_teacher')}
                {entityEditType === 'subject' && t('lessons.edit_subject')}
              </DialogTitle>
              <DialogDescription />
            </DialogHeader>

            <div className="py-4">
              {entityLoading ? (
                <div className="p-6 text-center">{t('actions.loading')}</div>
              ) : (
                entityEditData && (
                  <div className="space-y-4">
                    {entityEditType === 'teacher' && (
                      <>
                        <Label>{t('teachers.full_name')}</Label>
                        <Input value={entityEditData.fullName || ''} onChange={(e) => updateEntityField('fullName', e.target.value)} />
                        <Label>{t('teachers.short_name_code')}</Label>
                        <Input value={entityEditData.shortName || ''} onChange={(e) => updateEntityField('shortName', e.target.value)} />

                        <div className="space-y-2">
                          <Label>{t('teachers.subjects')}</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-between">
                                {entityEditData.selectedSubjectIds && entityEditData.selectedSubjectIds.length > 0 ? (
                                  <span>{entityEditData.selectedSubjectIds.length} selected</span>
                                ) : (
                                  <span className="text-muted-foreground">{t('teachers.select_subjects_placeholder')}</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="start">
                              <Command>
                                <CommandInput placeholder={t('teachers.search_subjects')} />
                                <CommandEmpty>{t('teachers.no_subject_found')}</CommandEmpty>
                                <CommandGroup className="max-h-64 overflow-auto p-2">
                                  {entitySubjects && entitySubjects.length > 0 && entitySubjects.map((subject) => (
                                    <CommandItem key={subject.id} value={subject.name} onSelect={() => toggleEntitySubject(subject.id)}>
                                      <Check className={`mr-2 h-4 w-4 ${entityEditData.selectedSubjectIds?.includes(subject.id) ? 'opacity-100' : 'opacity-0'}`} />
                                      <span className="mr-2">{subject.emoji || '📖'}</span>
                                      {subject.name}
                                      <Badge variant="outline" className="ml-auto">{subject.shortName}</Badge>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </Command>
                            </PopoverContent>
                          </Popover>

                          {entityEditData.selectedSubjectIds && entityEditData.selectedSubjectIds.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {entityEditData.selectedSubjectIds.map((subjectId: number) => {
                                const s = entitySubjects.find((x: any) => x.id === subjectId);
                                if (!s) return null;
                                return (
                                  <Badge key={subjectId} variant="secondary" className="pl-2 pr-1">
                                    <span className="mr-1">{s.emoji || '📖'}</span>
                                    {s.name}
                                    <button onClick={() => removeEntitySubject(subjectId)} className="ml-2 text-xs">✕</button>
                                  </Badge>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Availability for teacher */}
                        <div className="bg-white rounded-lg border p-3 mt-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium">{t('teachers.teacher_availability')}</p>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={selectAllEntityAvailability}>{t('teachers.select_all')}</Button>
                              <Button variant="outline" size="sm" onClick={clearAllEntityAvailability}>{t('teachers.clear_all')}</Button>
                            </div>
                          </div>

                          <div className="grid gap-2">
                            <div className="grid grid-cols-8 gap-1 mb-1">
                              <div className="p-1"></div>
                              {periods.map((period) => (
                                <button key={period} onClick={() => toggleEntityPeriodAcrossDays(period)} className="p-1 text-center text-xs font-medium rounded border border-gray-300 hover:bg-gray-100">
                                  P{period}
                                </button>
                              ))}
                            </div>

                            {days.map((day, dayIndex) => (
                              <div key={day} className="grid grid-cols-8 gap-1">
                                <button onClick={() => toggleEntityDay(day)} className="p-1 text-xs font-medium capitalize text-left rounded border border-gray-300 hover:bg-gray-100">
                                  {dayLabels[dayIndex]}
                                </button>
                                {periods.map((period) => {
                                  const isAvailable = (entityEditData.availability?.[day] || []).includes(period);
                                  return (
                                    <button key={period} onClick={() => toggleEntityAvailability(day, period)} className={`p-1 text-center rounded border text-xs ${isAvailable ? 'bg-green-500 border-green-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-400'}`}>
                                      {isAvailable ? '✓' : '—'}
                                    </button>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {entityEditType === 'subject' && (
                      <>
                        <Label>{t('subjects.name')}</Label>
                        <Input value={entityEditData.name || ''} onChange={(e) => updateEntityField('name', e.target.value)} />
                        <Label>{t('subjects.short_name')}</Label>
                        <Input value={entityEditData.shortName || ''} onChange={(e) => updateEntityField('shortName', e.target.value)} />
                      </>
                    )}

                    {entityEditType === 'class' && (
                      <>
                        <Label>{t('classes.class_name')}</Label>
                        <Input value={entityEditData.name || ''} onChange={(e) => updateEntityField('name', e.target.value)} />
                        <Label>{t('classes.short_name')}</Label>
                        <Input value={entityEditData.shortName || ''} onChange={(e) => updateEntityField('shortName', e.target.value)} />

                        <div className="space-y-2">
                          <Label>{t('classes.class_teacher')}</Label>
                          <Select
                            value={entityEditData.classTeacher || undefined}
                            onValueChange={(value) => updateEntityField('classTeacher', value)}
                            disabled={!entityTeachers || entityTeachers.length === 0}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t('classes.class_teacher')} />
                            </SelectTrigger>
                            <SelectContent>
                              {entityTeachers && entityTeachers.length > 0 ? (
                                entityTeachers.map((teacher: any) => (
                                  teacher.id ? (
                                    <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                      {teacher.fullName || teacher.name}
                                    </SelectItem>
                                  ) : null
                                ))
                              ) : (
                                <div className="p-2 text-sm text-muted-foreground text-center">{t('teachers.no_teachers_found')}</div>
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>{t('classes.rooms_optional')}</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-between">
                                {entityEditData.roomIds && entityEditData.roomIds.length > 0 ? (
                                  <span>{entityEditData.roomIds.length} selected</span>
                                ) : (
                                  <span className="text-muted-foreground">{t('classes.select_rooms_placeholder') || 'Select rooms'}</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="start">
                              <Command>
                                <CommandInput placeholder={t('classes.search_rooms') || 'Search rooms...'} />
                                <CommandEmpty>{t('classes.no_rooms')}</CommandEmpty>
                                <CommandGroup className="max-h-64 overflow-auto p-2">
                                  {entityRooms && entityRooms.length > 0 ? (
                                    entityRooms.map((room) => (
                                      <CommandItem key={room.id} value={room.name} onSelect={() => toggleEntityRoom(String(room.id))}>
                                        <Check className={`mr-2 h-4 w-4 ${entityEditData.roomIds?.includes(String(room.id)) ? 'opacity-100' : 'opacity-0'}`} />
                                        <span className="mr-2">{room.name}</span>
                                        <span className="text-muted-foreground ml-auto text-xs">Cap: {room.capacity || 0}</span>
                                      </CommandItem>
                                    ))
                                  ) : null}
                                </CommandGroup>
                              </Command>
                            </PopoverContent>
                          </Popover>

                          {/* Selected rooms badges */}
                          {entityEditData.roomIds && entityEditData.roomIds.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {entityEditData.roomIds.map((roomId: string) => {
                                const room = entityRooms.find(r => String(r.id) === roomId);
                                if (!room) return null;
                                return (
                                  <Badge key={roomId} variant="secondary" className="pl-2 pr-1">
                                    {room.name}
                                    <button onClick={() => toggleEntityRoom(roomId)} className="ml-2 text-xs">✕</button>
                                  </Badge>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Availability */}
                        <div className="bg-white rounded-lg border p-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium">{t('classes.class_availability')}</p>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={selectAllEntityAvailability}>{t('classes.select_all')}</Button>
                              <Button variant="outline" size="sm" onClick={clearAllEntityAvailability}>{t('classes.clear_all')}</Button>
                            </div>
                          </div>

                          <div className="grid gap-2">
                            <div className="grid grid-cols-8 gap-1 mb-1">
                              <div className="p-1"></div>
                              {periods.map((period) => (
                                <button key={period} onClick={() => toggleEntityPeriodAcrossDays(period)} className="p-1 text-center text-xs font-medium rounded border border-gray-300 hover:bg-gray-100">
                                  P{period}
                                </button>
                              ))}
                            </div>

                            {days.map((day, dayIndex) => (
                              <div key={day} className="grid grid-cols-8 gap-1">
                                <button onClick={() => toggleEntityDay(day)} className="p-1 text-xs font-medium capitalize text-left rounded border border-gray-300 hover:bg-gray-100">
                                  {dayLabels[dayIndex]}
                                </button>
                                {periods.map((period) => {
                                  const isAvailable = (entityEditData.availability?.[day] || []).includes(period);
                                  return (
                                    <button key={period} onClick={() => toggleEntityAvailability(day, period)} className={`p-1 text-center rounded border text-xs ${isAvailable ? 'bg-green-500 border-green-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-400'}`}>
                                      {isAvailable ? '✓' : '—'}
                                    </button>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )
              )}
            </div>

            <DialogFooter>
              <div className="flex gap-2 w-full justify-end">
                <Button variant="ghost" onClick={() => setEntityEditOpen(false)}>{t('actions.cancel')}</Button>
                <Button onClick={saveEntityEdit} disabled={entitySaving}>{entitySaving ? t('actions.saving') : t('actions.save')}</Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}