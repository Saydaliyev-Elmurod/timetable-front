import React, { useState, useMemo, useCallback, useEffect } from 'react';

// Services
import { LessonService, LessonResponse, DayOfWeek } from '@/lib/lessons';
import { SubjectService } from '@/lib/subjects';
import { TeacherService } from '@/lib/teachers';
import { ClassService } from '@/lib/classes';

// Types
import { InternalLesson } from '@/types/lessons';
import { GroupedData, ConflictDetail, ViewType, LessonSubmitData } from '@/types/common';

// UI Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// Utils & Hooks
import { cn } from '@/components/ui/utils';
import { toast } from 'sonner';
import { 
  getLessonsByClass, 
  getLessonsByTeacher, 
  getLessonsBySubject, 
  getLessonsByRoom 
} from '@/lib/lessonGroups';
import { filterLessons, paginateLessons } from '@/lib/lessonUtils';

// Components
import AddLessonModal from '@/components/AddLessonModal';

// Icons
import { 
  Plus,
  Pencil,
  Trash2,
  Upload,
  Download,
  Users,
  GraduationCap,
  BookOpen,
  MapPin,
  ChevronDown,
  ChevronRight,
  Expand,
  Minimize,
  FileText,
  Clock,
  Phone,
  Lightbulb,
  Target,
  Zap,
  HelpCircle,
} from 'lucide-react';

export default function LessonsPage() {
  const [lessons, setLessons] = useState<InternalLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [activeTab, setActiveTab] = useState('classes');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<InternalLesson | null>(null);
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [allExpanded, setAllExpanded] = useState(false);

  const [teachers, setTeachers] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);

  // Fetch lessons from API
  const fetchLessons = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await LessonService.getAll();
      // Convert API format to internal format
      const converted = data.map((lesson: LessonResponse) => ({
        id: lesson.id,
        subject: lesson.subject?.name || 'Unknown',
        teacher: lesson.teacher?.fullName || 'Unknown',
        class: lesson.class?.shortName || lesson.class?.name || 'Unknown',
        day: lesson.dayOfWeek,
        startTime: `${lesson.hour}:00`,
        endTime: `${lesson.hour + 1}:00`,
        period: lesson.period,
        frequency: `${lesson.lessonCount}x`,
        room: lesson.rooms?.map(r => r.name).join(', ') || 'No Room',
        duration: '45 min'
      }));
      setLessons(converted);
      setTotalElements(data.length);
      setTotalPages(1);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      toast.error('Failed to load lessons');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const availableClasses = ['1-A', '1-B', '2-A', '2-B', '3-A', '3-B'];
  const availableSubjects = ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'History'];

  const teacherNames = useMemo(() => teachers.map(t => t.name), [teachers]);
  const roomNames = useMemo(() => rooms.map(r => r.name), [rooms]);

  const lessonsByClass = useMemo(() => getLessonsByClass(lessons), [lessons]);

  const lessonsByTeacher = useMemo(() => getLessonsByTeacher(lessons), [lessons]);

  const lessonsBySubject = useMemo(() => getLessonsBySubject(lessons), [lessons]);
  const lessonsByRoom = useMemo(() => getLessonsByRoom(lessons), [lessons]);

  const toggleCardExpansion = (cardId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  const toggleExpandAll = () => {
    const currentData = getCurrentTabData();
    if (allExpanded) {
      setExpandedCards(new Set());
    } else {
      setExpandedCards(new Set(currentData.map(item => item.id)));
    }
    setAllExpanded(!allExpanded);
  };

  const getCurrentTabData = (): GroupedData[] => {
    switch (activeTab) {
      case 'classes':
        return lessonsByClass;
      case 'teachers':
        return lessonsByTeacher;
      case 'subjects':
      case 'rooms':
        return lessonsByRoom;
      default:
        return lessonsByClass;
    }
  };

  const detectConflicts = React.useCallback((newLesson: InternalLesson, excludeId: number | null = null): ConflictDetail[] => {
    const conflictList: ConflictDetail[] = [];
    
    // Check for teacher conflicts
    const teacherConflicts = lessons.filter(
      (lesson) =>
        lesson.id !== excludeId &&
        lesson.teacher === newLesson.teacher &&
        lesson.day === newLesson.day &&
        lesson.period === newLesson.period
    );
    
    if (teacherConflicts.length > 0) {
      conflictList.push({
        type: 'teacher',
        message: `${newLesson.teacher} is already teaching ${teacherConflicts[0].class} during this time`,
      });
    }

    // Check for class conflicts
    const classConflicts = lessons.filter(
      (lesson) =>
        lesson.id !== excludeId &&
        lesson.class === newLesson.class &&
        lesson.day === newLesson.day &&
        lesson.period === newLesson.period
    );
    
    if (classConflicts.length > 0) {
      conflictList.push({
        type: 'class',
        message: `Class ${newLesson.class} already has ${classConflicts[0].subject} during this time`,
      });
    }

    return conflictList;
  }, [lessons]);

  const handleAdd = (targetClass: string | null = null) => {
    setEditingLesson(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (lesson: InternalLesson) => {
    setEditingLesson(lesson);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await LessonService.delete(id);
      setLessons(lessons.filter((l) => l.id !== id));
      toast.success('Lesson deleted successfully');
    } catch (error) {
      console.error('Failed to delete lesson:', error);
      toast.error('Failed to delete lesson');
    }
  };

  const handleSubmit = async (lessonData: LessonSubmitData) => {
    try {
      // Fetch data from services
      const [subjects, teachers, classes] = await Promise.all([
        SubjectService.getAll(),
        TeacherService.getAll(),
        ClassService.getAll()
      ]);

      // Get IDs for teacher and subject by matching names
      const subject = subjects.find((s: any) => s.name === lessonData.subject || s.id.toString() === lessonData.subject);
      const teacher = teachers.find((t: any) => t.fullName === lessonData.selectedTeacher);
      const classIds = lessonData.selectedClasses.map((className: string) => {
        const cls = classes.find((c: any) => c.name === className);
        return cls?.id || 0;
      }).filter(id => id > 0);

      if (!subject || !teacher || classIds.length === 0) {
        toast.error('Invalid subject, teacher, or classes selected');
        return;
      }

      const lessonRequest = {
        classId: classIds,
        teacherId: teacher.id,
        roomIds: [],
        subjectId: subject.id,
        lessonCount: lessonData.lessonsPerWeek,
        dayOfWeek: DayOfWeek.MONDAY, // Default day
        hour: 9, // Default hour
        period: 1 // Default period
      };

      // Call the API - create or update
      if (editingLesson && editingLesson.id) {
        await LessonService.update(editingLesson.id, lessonRequest);
      } else {
        await LessonService.create(lessonRequest);
      }

      // Refresh lessons list
      const updatedLessons = await LessonService.getAll();
      const convertedLessons = updatedLessons.map((lesson: LessonResponse): InternalLesson => ({
        id: lesson.id,
        subject: lesson.subject.name,
        teacher: lesson.teacher.fullName,
        class: lesson.class.name,
        day: lesson.dayOfWeek,
        startTime: `${lesson.hour}:00`,
        endTime: `${lesson.hour + 1}:00`,
        period: lesson.period,
        frequency: `${lesson.lessonCount}x/week`,
        room: lesson.rooms.length > 0 ? lesson.rooms[0].name : 'TBD',
        duration: '45 min'
      }));
      
      setLessons(convertedLessons);
      
      if (editingLesson && editingLesson.id) {
        toast.success('Lesson updated successfully');
      } else {
        toast.success('Lesson created successfully');
      }
    } catch (error) {
      console.error('Failed to save lesson:', error);
      toast.error('Failed to save lesson');
    }
    
    setEditingLesson(null);
    setIsDialogOpen(false);
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
                          {item.totalLessons} Lessons
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {item.totalPeriods} Total Periods
                        </span>
                        <span className="flex items-center gap-1">
                          <GraduationCap className="h-4 w-4" />
                          {item.teachers} Teacher{item.teachers !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {item.subjects} Subject{item.subjects !== 1 ? 's' : ''}
                        </span>
                      </>
                    )}
                    {type === 'teachers' && (
                      <>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {item.classes} Classes
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          {item.totalLessons} Lessons
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {item.totalPeriods} Total Periods
                        </span>
                      </>
                    )}
                      {type === 'subjects' && (
                      <>
                        <span className="flex items-center gap-1">
                          <GraduationCap className="h-4 w-4" />
                          {item.teachers} Teachers
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {item.classes} Classes
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          {item.totalLessons} Lessons
                        </span>
                      </>
                    )}
                    {type === 'rooms' && (
                      <>
                        <span className="flex items-center gap-1">
                          <GraduationCap className="h-4 w-4" />
                          {item.teachers} Teachers
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {item.classes} Classes
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {item.totalPeriods} Total Periods
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
                      Add Lesson
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
                        <TableHead>Subject</TableHead>
                        <TableHead>Teacher</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Room</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </>
                    )}
                    {type === 'teachers' && (
                      <>
                        <TableHead>Class</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Room</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </>
                    )}
                    {type === 'subjects' && (
                      <>
                        <TableHead>Teacher</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Room</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </>
                    )}
                    {type === 'rooms' && (
                      <>
                        <TableHead>Class</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Teacher</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {item.lessons.map((lesson: InternalLesson) => (
                    <TableRow key={lesson.id}>
                      {type === 'classes' && (
                        <>
                          <TableCell>
                            <Badge>{lesson.subject}</Badge>
                          </TableCell>
                          <TableCell>{lesson.teacher}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{lesson.frequency}</Badge>
                          </TableCell>
                          <TableCell>{lesson.room}</TableCell>
                          <TableCell>{lesson.duration}</TableCell>
                        </>
                      )}
                      {type === 'teachers' && (
                        <>
                          <TableCell>
                            <Badge variant="secondary">{lesson.class}</Badge>
                          </TableCell>
                          <TableCell>{lesson.subject}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{lesson.frequency}</Badge>
                          </TableCell>
                          <TableCell>{lesson.room}</TableCell>
                          <TableCell>{lesson.duration}</TableCell>
                        </>
                      )}
                      {type === 'subjects' && (
                        <>
                          <TableCell>{lesson.teacher}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{lesson.class}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{lesson.frequency}</Badge>
                          </TableCell>
                          <TableCell>{lesson.room}</TableCell>
                          <TableCell>{lesson.duration}</TableCell>
                        </>
                      )}
                      {type === 'rooms' && (
                        <>
                          <TableCell>
                            <Badge variant="secondary">{lesson.class}</Badge>
                          </TableCell>
                          <TableCell>{lesson.subject}</TableCell>
                          <TableCell>{lesson.teacher}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{lesson.frequency}</Badge>
                          </TableCell>
                          <TableCell>{lesson.duration}</TableCell>
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
                  ))}n                </TableBody>
              </Table>
              
              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Bulk Import
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
            <h2>Lessons</h2>
            <p className="text-muted-foreground">
              Add lessons for each class with subject(s), teacher(s), and frequency per week (or timetable cycle). View and organize lessons by class, teacher, subject, or room.
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
                  <Minimize className="h-4 w-4" />
                  Collapse All
                </>
              ) : (
                <>
                  <Expand className="h-4 w-4" />
                  Expand All
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
              Classes
            </TabsTrigger>
            <TabsTrigger value="teachers" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Teachers
            </TabsTrigger>
            <TabsTrigger value="subjects" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Subjects
            </TabsTrigger>
            <TabsTrigger value="rooms" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Rooms
            </TabsTrigger>
          </TabsList>

          <TabsContent value="classes" className="space-y-4">
            {lessonsByClass.map((item: GroupedData) => renderLessonCard(item, 'classes'))}
          </TabsContent>

          <TabsContent value="teachers" className="space-y-4">
            {lessonsByTeacher.map((item: GroupedData) => renderLessonCard(item, 'teachers'))}
          </TabsContent>

          <TabsContent value="subjects" className="space-y-4">
            {lessonsBySubject.map((item: GroupedData) => renderLessonCard(item, 'subjects'))}
          </TabsContent>

          <TabsContent value="rooms" className="space-y-4">
            {lessonsByRoom.map((item: GroupedData) => renderLessonCard(item, 'rooms'))}
          </TabsContent>
        </Tabs>

        {/* Global Actions */}
        <div className="flex justify-between items-center pt-6 border-t">
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Bulk Import
            </Button>
          </div>
          <Button onClick={() => handleAdd()}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Lesson
          </Button>
        </div>
      </div>

      {/* Tips & Tricks Sidebar */}
      <div className="w-80">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5" />
              Tips & Tricks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Target className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium mb-1">Frequency First</h4>
                  <p className="text-sm text-muted-foreground">
                    Set lessons per week before worrying about specific time slots. Helps the system optimize lesson placement.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium mb-1">Double Periods</h4>
                  <p className="text-sm text-muted-foreground">
                    Science or lab subjects may need consecutive periods.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium mb-1">Flexible Approach</h4>
                  <p className="text-sm text-muted-foreground">
                    Avoid over-constraining. Let the algorithm find the best combinations.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-start gap-3 mb-3">
                <HelpCircle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium mb-1">Need Help?</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    A timetable assistant will help you build an optimal schedule.
                  </p>
                </div>
              </div>
              <Button variant="outline" className="w-full">
                <Phone className="h-4 w-4 mr-2" />
                Schedule a Call
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Add/Edit Lesson Modal */}
      <AddLessonModal
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleSubmit}
        editingLesson={editingLesson}
      />
    </div>
  );
}