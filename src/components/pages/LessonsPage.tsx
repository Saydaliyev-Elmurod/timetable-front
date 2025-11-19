import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from '@/i18n/index';
import { LessonService } from '@/lib/lessons';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
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

      // Group by class
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
          });
        }
        const c = classesMap.get(classKey);
        c.lessons.push(f);
        c.totalLessons += 1;

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
          });
        }
        const tr = teachersMap.get(teacherKey);
        tr.lessons.push(f);
        tr.totalLessons += 1;

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
          });
        }
        const s = subjectsMap.get(subjectKey);
        s.lessons.push(f);
        s.totalLessons += 1;

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
            });
          }
          const rm = roomsMap.get(roomKey);
          rm.lessons.push(f);
          rm.totalLessons += 1;
        });
      });

      setLessons({
        classes: Array.from(classesMap.values()),
        teachers: Array.from(teachersMap.values()),
        subjects: Array.from(subjectsMap.values()),
        rooms: Array.from(roomsMap.values()),
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
                    <Button size="sm" onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleAdd(item.name);
                    }}>
                      <Plus className="h-4 w-4 mr-1" />
                      {t('lessons.add_lesson_for_class')}
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
                      {/* ... (table cells with lesson data) */}
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
    </div>
  );
}