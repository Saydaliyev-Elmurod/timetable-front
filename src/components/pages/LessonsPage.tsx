import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible';
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
  HelpCircle
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { toast } from 'sonner@2.0.3';
import AddLessonModal from '../AddLessonModal';
import { cn } from '../ui/utils';

export default function LessonsPage() {
  const [lessons, setLessons] = useState([
    {
      id: 1,
      subject: 'Mathematics',
      teacher: 'Mr. Karimov',
      class: '1-A',
      day: 'Monday',
      startTime: '09:00',
      endTime: '10:00',
      period: 1,
      frequency: '3x/week',
      room: 'Room 102',
      duration: '45 min'
    },
    {
      id: 2,
      subject: 'English',
      teacher: 'Ms. Aliyeva',
      class: '1-A',
      day: 'Monday',
      startTime: '10:00',
      endTime: '11:00',
      period: 2,
      frequency: '4x/week',
      room: 'Room 101',
      duration: '45 min'
    },
    {
      id: 3,
      subject: 'Physics',
      teacher: 'Ms. Rustamova',
      class: '2-B',
      day: 'Tuesday',
      startTime: '09:00',
      endTime: '11:00',
      period: 1,
      frequency: '2x/week',
      room: 'Lab A',
      duration: '90 min'
    },
    {
      id: 4,
      subject: 'Mathematics',
      teacher: 'Mr. Karimov',
      class: '2-B',
      day: 'Wednesday',
      startTime: '09:00',
      endTime: '10:00',
      period: 1,
      frequency: '3x/week',
      room: 'Room 102',
      duration: '45 min'
    },
    {
      id: 5,
      subject: 'Chemistry',
      teacher: 'Dr. Nazarov',
      class: '3-A',
      day: 'Thursday',
      startTime: '10:00',
      endTime: '11:00',
      period: 2,
      frequency: '2x/week',
      room: 'Lab B',
      duration: '60 min'
    },
  ]);

  const [activeTab, setActiveTab] = useState('classes');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [allExpanded, setAllExpanded] = useState(false);

  const availableClasses = ['1-A', '1-B', '2-A', '2-B', '3-A', '3-B'];
  const availableTeachers = ['Mr. Karimov', 'Ms. Aliyeva', 'Ms. Rustamova', 'Dr. Nazarov', 'Ms. Tursunova'];
  const availableSubjects = ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'History'];

  // Group lessons by different categories
  const lessonsByClass = React.useMemo(() => {
    const grouped = lessons.reduce((acc, lesson) => {
      if (!acc[lesson.class]) {
        acc[lesson.class] = [];
      }
      acc[lesson.class].push(lesson);
      return acc;
    }, {});

    return Object.entries(grouped).map(([className, classLessons]) => ({
      id: className,
      name: className,
      lessons: classLessons,
      totalLessons: classLessons.length,
      totalPeriods: classLessons.reduce((sum, lesson) => sum + parseInt(lesson.frequency), 0),
      teachers: [...new Set(classLessons.map(l => l.teacher))].length,
      subjects: [...new Set(classLessons.map(l => l.subject))].length
    }));
  }, [lessons]);

  const lessonsByTeacher = React.useMemo(() => {
    const grouped = lessons.reduce((acc, lesson) => {
      if (!acc[lesson.teacher]) {
        acc[lesson.teacher] = [];
      }
      acc[lesson.teacher].push(lesson);
      return acc;
    }, {});

    return Object.entries(grouped).map(([teacherName, teacherLessons]) => ({
      id: teacherName,
      name: teacherName,
      lessons: teacherLessons,
      totalLessons: teacherLessons.length,
      totalPeriods: teacherLessons.reduce((sum, lesson) => sum + parseInt(lesson.frequency), 0),
      classes: [...new Set(teacherLessons.map(l => l.class))].length,
      subjects: [...new Set(teacherLessons.map(l => l.subject))].length
    }));
  }, [lessons]);

  const lessonsBySubject = React.useMemo(() => {
    const grouped = lessons.reduce((acc, lesson) => {
      if (!acc[lesson.subject]) {
        acc[lesson.subject] = [];
      }
      acc[lesson.subject].push(lesson);
      return acc;
    }, {});

    return Object.entries(grouped).map(([subjectName, subjectLessons]) => ({
      id: subjectName,
      name: subjectName,
      lessons: subjectLessons,
      totalLessons: subjectLessons.length,
      teachers: [...new Set(subjectLessons.map(l => l.teacher))].length,
      classes: [...new Set(subjectLessons.map(l => l.class))].length
    }));
  }, [lessons]);

  const lessonsByRoom = React.useMemo(() => {
    const grouped = lessons.reduce((acc, lesson) => {
      if (!acc[lesson.room]) {
        acc[lesson.room] = [];
      }
      acc[lesson.room].push(lesson);
      return acc;
    }, {});

    return Object.entries(grouped).map(([roomName, roomLessons]) => ({
      id: roomName,
      name: roomName,
      lessons: roomLessons,
      totalPeriods: roomLessons.reduce((sum, lesson) => sum + parseInt(lesson.frequency), 0),
      teachers: [...new Set(roomLessons.map(l => l.teacher))].length,
      classes: [...new Set(roomLessons.map(l => l.class))].length
    }));
  }, [lessons]);

  const toggleCardExpansion = (cardId) => {
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

  const getCurrentTabData = () => {
    switch (activeTab) {
      case 'classes':
        return lessonsByClass;
      case 'teachers':
        return lessonsByTeacher;
      case 'subjects':
        return lessonsBySubject;
      case 'rooms':
        return lessonsByRoom;
      default:
        return lessonsByClass;
    }
  };

  const detectConflicts = React.useCallback((newLesson, excludeId = null) => {
    const conflictList = [];
    
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

  const handleAdd = (targetClass = null) => {
    setEditingLesson(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (lesson) => {
    setEditingLesson(lesson);
    setIsDialogOpen(true);
  };

  const handleDelete = (id) => {
    setLessons(lessons.filter((l) => l.id !== id));
    toast('Lesson deleted successfully');
  };

  const handleSubmit = (lessonData) => {
    if (lessonData.multiClass && lessonData.selectedClasses.length > 1) {
      // Handle multi-class lesson creation
      const newLessons = lessonData.selectedClasses.map((className, index) => ({
        id: lessons.length + index + 1,
        subject: lessonData.subject,
        teacher: lessonData.selectedTeachers[0] || 'TBD',
        class: className,
        day: 'Monday', // Default - would be determined by scheduling algorithm
        startTime: '09:00',
        endTime: '10:00',
        period: 1,
        frequency: `${lessonData.formats[0]?.timesPerWeek || 1}x/week`,
        room: 'TBD',
        duration: `${lessonData.formats[0]?.duration || '45'} min`
      }));

      setLessons([...lessons, ...newLessons]);
      toast(`✅ Lesson successfully created for ${lessonData.selectedClasses.length} classes.`);
    } else {
      // Handle single lesson creation/update
      const singleLessonData = {
        subject: lessonData.subject,
        teacher: lessonData.selectedTeachers[0] || 'TBD',
        class: lessonData.selectedClasses[0] || '',
        day: 'Monday', // Default
        startTime: '09:00',
        endTime: '10:00',
        period: 1,
        frequency: `${lessonData.formats[0]?.timesPerWeek || 1}x/week`,
        room: 'TBD',
        duration: `${lessonData.formats[0]?.duration || '45'} min`
      };

      if (editingLesson) {
        setLessons(
          lessons.map((l) =>
            l.id === editingLesson.id ? { ...l, ...singleLessonData } : l
          )
        );
        toast('Lesson updated successfully');
      } else {
        const newLesson = {
          id: lessons.length + 1,
          ...singleLessonData,
        };
        setLessons([...lessons, newLesson]);
        toast('Lesson added successfully');
      }
    }
    
    setIsDialogOpen(false);
  };

  const renderLessonCard = (item, type) => {
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
                    <Button size="sm" onClick={(e) => {
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
                  {item.lessons.map((lesson) => (
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
                  ))}
                </TableBody>
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
            {lessonsByClass.map(item => renderLessonCard(item, 'classes'))}
          </TabsContent>

          <TabsContent value="teachers" className="space-y-4">
            {lessonsByTeacher.map(item => renderLessonCard(item, 'teachers'))}
          </TabsContent>

          <TabsContent value="subjects" className="space-y-4">
            {lessonsBySubject.map(item => renderLessonCard(item, 'subjects'))}
          </TabsContent>

          <TabsContent value="rooms" className="space-y-4">
            {lessonsByRoom.map(item => renderLessonCard(item, 'rooms'))}
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
        availableClasses={availableClasses}
        availableTeachers={availableTeachers}
        availableSubjects={availableSubjects}
        detectConflicts={detectConflicts}
      />
    </div>
  );
}