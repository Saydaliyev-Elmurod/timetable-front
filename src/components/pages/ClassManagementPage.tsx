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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import {
  Users,
  UserPlus,
  BookOpen,
  UserCog,
  Calendar,
  Search,
  Mail,
  Plus,
  Edit,
  Save,
  ArrowLeft,
  Clock,
  GraduationCap,
  ChevronRight,
  MoreVertical,
  Settings,
  Download,
  FileText,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { toast } from 'sonner@2.0.3';

export default function ClassManagementPage({ classData, onBack }) {
  const [activeTab, setActiveTab] = useState('subjects-teachers');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample class data
  const classInfo = classData || {
    name: 'Grade 7-B',
    studentCount: 32,
    homeroomTeacher: 'Mrs. Davis',
    students: [
      { id: 1, name: 'Emma Johnson', studentId: 'STU-2024-001', email: 'emma.j@school.com' },
      { id: 2, name: 'Liam Smith', studentId: 'STU-2024-002', email: 'liam.s@school.com' },
      { id: 3, name: 'Olivia Brown', studentId: 'STU-2024-003', email: 'olivia.b@school.com' },
      { id: 4, name: 'Noah Davis', studentId: 'STU-2024-004', email: 'noah.d@school.com' },
      { id: 5, name: 'Ava Wilson', studentId: 'STU-2024-005', email: 'ava.w@school.com' },
    ],
    subjects: [
      { id: 1, name: 'Mathematics', teacher: 'Mr. Robert Chen', teacherId: 'T001', color: '#4A90E2' },
      { id: 2, name: 'English Literature', teacher: 'Mrs. Sarah Williams', teacherId: 'T002', color: '#50E3C2' },
      { id: 3, name: 'Physics', teacher: 'Dr. James Anderson', teacherId: 'T003', color: '#9013FE' },
      { id: 4, name: 'Chemistry', teacher: null, teacherId: null, color: '#F5A623' },
      { id: 5, name: 'History', teacher: 'Ms. Emily Taylor', teacherId: 'T005', color: '#BD10E0' },
      { id: 6, name: 'Biology', teacher: 'Dr. Michael Brown', teacherId: 'T006', color: '#7ED321' },
      { id: 7, name: 'Physical Education', teacher: null, teacherId: null, color: '#D0021B' },
      { id: 8, name: 'Computer Science', teacher: 'Mr. David Kumar', teacherId: 'T008', color: '#4A4A4A' },
    ],
    timetable: {
      Monday: [
        { subject: 'Mathematics', teacher: 'Mr. Robert Chen', time: '08:00 - 09:00' },
        { subject: 'English Literature', teacher: 'Mrs. Sarah Williams', time: '09:00 - 10:00' },
        { subject: 'Physics', teacher: 'Dr. James Anderson', time: '10:15 - 11:15' },
        { subject: 'History', teacher: 'Ms. Emily Taylor', time: '11:15 - 12:15' },
        { subject: 'Biology', teacher: 'Dr. Michael Brown', time: '13:00 - 14:00' },
      ],
      Tuesday: [
        { subject: 'Computer Science', teacher: 'Mr. David Kumar', time: '08:00 - 09:00' },
        { subject: 'Mathematics', teacher: 'Mr. Robert Chen', time: '09:00 - 10:00' },
        { subject: 'Physical Education', teacher: 'Unassigned', time: '10:15 - 11:15' },
        { subject: 'English Literature', teacher: 'Mrs. Sarah Williams', time: '11:15 - 12:15' },
        { subject: 'Physics', teacher: 'Dr. James Anderson', time: '13:00 - 14:00' },
      ],
    },
  };

  const filteredStudents = classInfo.students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveChanges = () => {
    toast('Changes saved successfully!');
  };

  const handleAssignTeacher = (subjectName) => {
    toast(`Opening teacher assignment for ${subjectName}...`);
  };

  const handleAddStudent = () => {
    toast('Opening student enrollment dialog...');
  };

  const handleAssignNewSubject = () => {
    toast('Opening subject assignment dialog...');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Back Navigation */}
        {onBack && (
          <Button 
            variant="ghost" 
            onClick={onBack} 
            className="mb-4 hover:bg-white/80 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Classes
          </Button>
        )}

        {/* Enhanced Header Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-4xl font-semibold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent m-0">
                    {classInfo.name}
                  </h1>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="px-4 py-2 bg-blue-50 text-blue-700 border-blue-200">
                    <Users className="h-4 w-4 mr-2" />
                    {classInfo.studentCount} Students
                  </Badge>
                  <Badge variant="outline" className="px-4 py-2 bg-emerald-50 text-emerald-700 border-emerald-200">
                    <UserCog className="h-4 w-4 mr-2" />
                    {classInfo.homeroomTeacher}
                  </Badge>
                </div>
              </div>
              <p className="text-slate-600 text-lg leading-relaxed max-w-2xl m-0">
                Comprehensive class management dashboard for students, subjects, teacher assignments, and weekly scheduling.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" className="gap-2 border-slate-200 hover:bg-slate-50 transition-colors">
                <Settings className="h-4 w-4" />
                Class Settings
              </Button>
              <Button variant="outline" className="gap-2 border-slate-200 hover:bg-slate-50 transition-colors">
                <Download className="h-4 w-4" />
                Export Data
              </Button>
              <Button 
                onClick={handleSaveChanges} 
                className="gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg p-2">
            <TabsList className="bg-transparent border-none p-0 h-auto grid grid-cols-3 gap-2">
              <TabsTrigger 
                value="students" 
                className="gap-3 px-8 py-4 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-blue-200 transition-all hover:bg-white/50"
              >
                <Users className="h-5 w-5" />
                <span className="font-medium">Students</span>
                <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700 text-xs">
                  {classInfo.studentCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="subjects-teachers" 
                className="gap-3 px-8 py-4 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-emerald-200 transition-all hover:bg-white/50"
              >
                <BookOpen className="h-5 w-5" />
                <span className="font-medium">Subjects & Teachers</span>
                <Badge variant="secondary" className="ml-2 bg-emerald-100 text-emerald-700 text-xs">
                  {classInfo.subjects.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="timetable" 
                className="gap-3 px-8 py-4 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-violet-200 transition-all hover:bg-white/50"
              >
                <Calendar className="h-5 w-5" />
                <span className="font-medium">Weekly Timetable</span>
                <Badge variant="secondary" className="ml-2 bg-violet-100 text-violet-700 text-xs">
                  5 days
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Enhanced Students Tab */}
          <TabsContent value="students" className="space-y-6 mt-8">
            <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="space-y-2">
                    <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                      Class Students
                    </CardTitle>
                    <CardDescription className="text-base text-slate-600">
                      {classInfo.studentCount} students enrolled in {classInfo.name}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input
                        placeholder="Search by name or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 w-80 h-12 border-slate-200 bg-white/80 focus:bg-white transition-colors"
                      />
                    </div>
                    <Button 
                      onClick={handleAddStudent} 
                      className="gap-3 px-6 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all"
                    >
                      <UserPlus className="h-5 w-5" />
                      Add Student
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      className="group flex items-center justify-between p-6 rounded-xl border border-slate-200 bg-white/60 hover:bg-white hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center gap-5">
                        <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                          <AvatarImage src={`https://ui-avatars.com/api/?name=${student.name}&background=3B82F6&color=fff`} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                            {student.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-slate-800">{student.name}</span>
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              {student.studentId}
                            </Badge>
                          </div>
                          <p className="text-slate-500 m-0 flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {student.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="hover:bg-blue-50">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enhanced Subjects & Teachers Tab */}
          <TabsContent value="subjects-teachers" className="space-y-6 mt-8">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardDescription className="text-blue-600 font-medium">Total Subjects</CardDescription>
                  <CardTitle className="text-4xl font-bold text-blue-800">{classInfo.subjects.length}</CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100/50 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardDescription className="text-emerald-600 font-medium">Assigned Teachers</CardDescription>
                  <CardTitle className="text-4xl font-bold text-emerald-800">
                    {classInfo.subjects.filter(s => s.teacher).length}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-none shadow-lg bg-gradient-to-br from-orange-50 to-orange-100/50 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardDescription className="text-orange-600 font-medium">Pending Assignments</CardDescription>
                  <CardTitle className="text-4xl font-bold text-orange-800">
                    {classInfo.subjects.filter(s => !s.teacher).length}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Main Content */}
            <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="space-y-2">
                    <CardTitle className="text-2xl bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
                      Subjects & Teacher Assignments
                    </CardTitle>
                    <CardDescription className="text-base text-slate-600">
                      Manage subject assignments and teacher allocations for {classInfo.name}
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={handleAssignNewSubject} 
                    className="gap-3 px-6 h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all"
                  >
                    <Plus className="h-5 w-5" />
                    Assign New Subject
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {classInfo.subjects.map((subject) => (
                    <div
                      key={subject.id}
                      className="group flex items-center justify-between p-6 rounded-xl border border-slate-200 bg-white/60 hover:bg-white hover:shadow-lg transition-all duration-200"
                    >
                      <div className="flex items-center gap-6 flex-1">
                        <div
                          className="w-1.5 h-16 rounded-full shadow-sm"
                          style={{ backgroundColor: subject.color }}
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-4">
                            <h4 className="text-lg font-semibold text-slate-800 m-0">{subject.name}</h4>
                            {!subject.teacher && (
                              <Badge variant="destructive" className="px-3 py-1 bg-red-50 text-red-700 border-red-200">
                                Unassigned
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            {subject.teacher ? (
                              <>
                                <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                                  <AvatarImage src={`https://ui-avatars.com/api/?name=${subject.teacher}&background=059669&color=fff`} />
                                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-sm">
                                    {subject.teacher.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="font-medium text-slate-700">{subject.teacher}</span>
                                  <Badge variant="outline" className="text-xs w-fit bg-slate-50 text-slate-600 border-slate-200">
                                    {subject.teacherId}
                                  </Badge>
                                </div>
                              </>
                            ) : (
                              <span className="text-slate-500 italic flex items-center gap-2">
                                <UserCog className="h-4 w-4" />
                                No teacher assigned
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleAssignTeacher(subject.name)}
                        variant={subject.teacher ? "outline" : "default"}
                        className={`gap-2 px-6 transition-all ${
                          subject.teacher 
                            ? "border-slate-200 hover:bg-slate-50" 
                            : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg hover:shadow-xl"
                        }`}
                      >
                        <UserCog className="h-4 w-4" />
                        {subject.teacher ? 'Change Teacher' : 'Assign Teacher'}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enhanced Weekly Timetable Tab */}
          <TabsContent value="timetable" className="space-y-6 mt-8">
            <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="space-y-2">
                    <CardTitle className="text-2xl bg-gradient-to-r from-violet-600 to-violet-800 bg-clip-text text-transparent">
                      Weekly Class Schedule
                    </CardTitle>
                    <CardDescription className="text-base text-slate-600">
                      Complete weekly timetable overview for {classInfo.name}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button variant="outline" className="gap-2 border-slate-200 hover:bg-slate-50">
                      <FileText className="h-4 w-4" />
                      Print Schedule
                    </Button>
                    <Button variant="outline" className="gap-2 border-slate-200 hover:bg-slate-50">
                      <Download className="h-4 w-4" />
                      Export PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {Object.entries(classInfo.timetable).slice(0, 5).map(([day, lessons]) => (
                    <div key={day} className="space-y-4">
                      <div className="bg-gradient-to-r from-violet-500 to-violet-600 text-white p-4 rounded-xl text-center shadow-lg">
                        <h4 className="m-0 text-white font-semibold">{day}</h4>
                        <p className="text-violet-100 text-sm m-0 mt-1">{lessons.length} lessons</p>
                      </div>
                      <div className="space-y-3">
                        {lessons.map((lesson, idx) => (
                          <div
                            key={idx}
                            className="bg-white/80 border border-slate-200 rounded-xl p-4 hover:shadow-md hover:bg-white transition-all duration-200 group"
                          >
                            <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                              <Clock className="h-4 w-4" />
                              {lesson.time}
                            </div>
                            <div className="font-semibold text-slate-800 mb-2 group-hover:text-violet-700 transition-colors">
                              {lesson.subject}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={`https://ui-avatars.com/api/?name=${lesson.teacher}&background=8B5CF6&color=fff`} />
                                <AvatarFallback className="bg-violet-500 text-white text-xs">
                                  {lesson.teacher.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              {lesson.teacher}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Week Summary */}
                <div className="mt-8 p-6 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200">
                  <h4 className="font-semibold text-slate-800 mb-4">Weekly Overview</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {Object.values(classInfo.timetable).reduce((total, lessons) => total + lessons.length, 0)}
                      </div>
                      <div className="text-slate-600">Total Lessons</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600">5</div>
                      <div className="text-slate-600">School Days</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-violet-600">
                        {new Set(Object.values(classInfo.timetable).flat().map(lesson => lesson.subject)).size}
                      </div>
                      <div className="text-slate-600">Unique Subjects</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {new Set(Object.values(classInfo.timetable).flat().map(lesson => lesson.teacher)).size}
                      </div>
                      <div className="text-slate-600">Different Teachers</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}