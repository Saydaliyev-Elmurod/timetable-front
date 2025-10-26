import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

// Type definitions
type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

type FormDataState = {
  fullName: string;
  shortName: string;
  selectedSubjectIds: number[];
  availability: Record<DayOfWeek, number[]>;
};

type AvailabilityMap = Record<DayOfWeek, number[]>;
import {
  Card,
  CardContent,
} from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '../ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { Plus, Trash2, Upload, Download, Copy, Calendar, Check, X, ChevronDown, ChevronsUpDown, Loader2, Edit } from 'lucide-react';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { cn } from '../ui/utils';

// Import services and types
import {
  TeacherService,
  TeacherResponse,
  TeacherRequest,
  TeacherUpdateRequest,
  SubjectResponse,
  TimeSlot
} from '@/lib/teachers';
import { SubjectService } from '@/lib/subjects';
import type { PaginatedResponse } from '@/lib/api';

// Import API configuration
import { API_CONFIG, getApiUrl, safeApiCall } from '@/config/api';

// Using imported TeacherService and SubjectService

// Helper function to convert old format to new API format
const convertToTimeSlots = (availability: any): TimeSlot[] => {
  const dayMap: Record<string, string> = {
    monday: 'MONDAY',
    tuesday: 'TUESDAY',
    wednesday: 'WEDNESDAY',
    thursday: 'THURSDAY',
    friday: 'FRIDAY',
    saturday: 'SATURDAY',
    sunday: 'SUNDAY',
  };

  return Object.entries(availability).map(([day, lessons]) => ({
    dayOfWeek: dayMap[day] || day.toUpperCase(),
    lessons: lessons as number[],
  }));
};

// Helper function to convert API format to old format
const convertFromTimeSlots = (timeSlots: TimeSlot[]): any => {
  const availability: any = {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  };

  timeSlots.forEach((slot) => {
    const dayKey = slot.dayOfWeek.toLowerCase();
    availability[dayKey] = slot.lessons;
  });

  return availability;
};

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<TeacherResponse[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<SubjectResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0); // API uses 0-based indexing
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [deleteDialogTeacher, setDeleteDialogTeacher] = useState<TeacherResponse | null>(null);
  
  // Inline form state
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState<number | null>(null);
  const [originalSubjectIds, setOriginalSubjectIds] = useState<number[]>([]);
  const [inlineFormData, setInlineFormData] = useState({
    fullName: '',
    shortName: '',
    selectedSubjectIds: [] as number[],
    availability: {
      monday: [1, 2, 3, 4, 5, 6, 7],
      tuesday: [1, 2, 3, 4, 5, 6, 7],
      wednesday: [1, 2, 3, 4, 5, 6, 7],
      thursday: [1, 2, 3, 4, 5, 6, 7],
      friday: [1, 2, 3, 4, 5, 6, 7],
      saturday: [1, 2, 3, 4, 5, 6, 7],
      sunday: [1, 2, 3, 4, 5, 6, 7],
    },
  });
  const [showAvailabilityInForm, setShowAvailabilityInForm] = useState(false);
  const [subjectComboOpen, setSubjectComboOpen] = useState(false);
  
  // Availability view for existing teachers
  const [expandedAvailability, setExpandedAvailability] = useState<number | null>(null);

  const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const periods = [1, 2, 3, 4, 5, 6, 7];

  // Fetch teachers on mount and when pagination changes
  useEffect(() => {
    fetchTeachers();
  }, [currentPage, itemsPerPage]);

  // Fetch subjects on mount
  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchTeachers = async () => {
    try {
      setIsLoading(true);
      const data = await TeacherService.getPaginated(currentPage, itemsPerPage);
      setTeachers(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (error) {
      toast.error('Failed to fetch teachers');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      setIsLoadingSubjects(true);
      const data = await SubjectService.getAll();
      setAvailableSubjects(data);
    } catch (error) {
      toast.error('Failed to fetch subjects');
      console.error(error);
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  const filteredTeachers = React.useMemo(() => 
    teachers.filter(
      (teacher) =>
        teacher.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.subjects.some((subject: SubjectResponse) => subject.name.toLowerCase().includes(searchQuery.toLowerCase()))
    ),
    [teachers, searchQuery]
  );

  const generateShortName = useCallback((fullName: string) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}.${parts[parts.length - 1]}`;
    }
    return fullName.substring(0, 8);
  }, []);

  const handleAddTeacher = () => {
    setShowInlineForm(true);
    setEditingTeacherId(null);
    setOriginalSubjectIds([]);
    setInlineFormData({
      fullName: '',
      shortName: '',
      selectedSubjectIds: [],
      availability: {
        monday: [1, 2, 3, 4, 5, 6, 7],
        tuesday: [1, 2, 3, 4, 5, 6, 7],
        wednesday: [1, 2, 3, 4, 5, 6, 7],
        thursday: [1, 2, 3, 4, 5, 6, 7],
        friday: [1, 2, 3, 4, 5, 6, 7],
        saturday: [1, 2, 3, 4, 5, 6, 7],
        sunday: [1, 2, 3, 4, 5, 6, 7],
      },
    });
    setShowAvailabilityInForm(false);
  };

  const handleEdit = async (teacher: TeacherResponse) => {
    try {
      setIsSaving(true);
      const teacherData = await TeacherService.getById(teacher.id);
      setEditingTeacherId(teacher.id);
      setOriginalSubjectIds(teacherData.subjects.map((s: SubjectResponse) => s.id));
      setInlineFormData({
        fullName: teacherData.fullName,
        shortName: teacherData.shortName,
        selectedSubjectIds: teacherData.subjects.map((s: SubjectResponse) => s.id),
        availability: convertFromTimeSlots(teacherData.availabilities),
      });
      setShowInlineForm(true);
      setShowAvailabilityInForm(false);
    } catch (error) {
      toast.error('Failed to load teacher data');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClone = (teacher: TeacherResponse) => {
    setShowInlineForm(true);
    setEditingTeacherId(null);
    setOriginalSubjectIds([]);
    setInlineFormData({
      fullName: `${teacher.fullName} (Copy)`,
      shortName: `${teacher.shortName}-C`,
      selectedSubjectIds: teacher.subjects.map((s: SubjectResponse) => s.id),
      availability: convertFromTimeSlots(teacher.availabilities),
    });
    setShowAvailabilityInForm(false);
  };

  const handleSaveInlineForm = async () => {
    if (!inlineFormData.fullName.trim()) {
      toast.error('Please enter a teacher name');
      return;
    }

    try {
      setIsSaving(true);
      
      if (editingTeacherId) {
        // For update, calculate deleted subjects
        const deletedSubjects = originalSubjectIds.filter(
          id => !inlineFormData.selectedSubjectIds.includes(id)
        );

        const updateData: TeacherUpdateRequest = {
          fullName: inlineFormData.fullName.trim(),
          shortName: inlineFormData.shortName.trim() || generateShortName(inlineFormData.fullName.trim()),
          subjects: inlineFormData.selectedSubjectIds,
          deletedSubjects: deletedSubjects,
          availabilities: convertToTimeSlots(inlineFormData.availability),
        };

        await TeacherService.update(editingTeacherId, updateData);
        toast.success('Teacher updated successfully');
      } else {
        // For create
        const requestData: TeacherRequest = {
          fullName: inlineFormData.fullName.trim(),
          shortName: inlineFormData.shortName.trim() || generateShortName(inlineFormData.fullName.trim()),
          subjects: inlineFormData.selectedSubjectIds,
          availabilities: convertToTimeSlots(inlineFormData.availability),
        };

        await TeacherService.create(requestData);
        toast.success('Teacher added successfully');
      }
      
      setShowInlineForm(false);
      setShowAvailabilityInForm(false);
      setEditingTeacherId(null);
      setOriginalSubjectIds([]);
      await fetchTeachers();
    } catch (error) {
      toast.error(editingTeacherId ? 'Failed to update teacher' : 'Failed to add teacher');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelInlineForm = () => {
    setShowInlineForm(false);
    setShowAvailabilityInForm(false);
    setEditingTeacherId(null);
    setOriginalSubjectIds([]);
  };

  const updateInlineFormField = (field: string, value: any) => {
    setInlineFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'fullName' && value) {
        updated.shortName = generateShortName(value);
      }
      return updated;
    });
  };

  const toggleSubject = (subjectId: number) => {
    setInlineFormData(prev => {
      const subjectIds = prev.selectedSubjectIds.includes(subjectId)
        ? prev.selectedSubjectIds.filter(id => id !== subjectId)
        : [...prev.selectedSubjectIds, subjectId];
      return { ...prev, selectedSubjectIds: subjectIds };
    });
  };

  const removeSubject = (subjectId: number) => {
    setInlineFormData(prev => ({
      ...prev,
      selectedSubjectIds: prev.selectedSubjectIds.filter(id => id !== subjectId)
    }));
  };

  const toggleInlineAvailability = (day: DayOfWeek, period: number) => {
    setInlineFormData(prev => {
      const dayPeriods = prev.availability[day];
      const newPeriods = dayPeriods.includes(period)
        ? dayPeriods.filter((p: number) => p !== period)
        : [...dayPeriods, period].sort((a, b) => a - b);
      
      return {
        ...prev,
        availability: {
          ...prev.availability,
          [day]: newPeriods
        }
      };
    });
  };

  const toggleInlineDay = (day: DayOfWeek) => {
    const currentPeriods = inlineFormData.availability[day];
    const allSelected = periods.every(p => currentPeriods.includes(p));
    
    setInlineFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: allSelected ? [] : [...periods]
      }
    }));
  };

  const toggleInlinePeriodAcrossDays = (period: number) => {
    const isSelected = days.some(day => inlineFormData.availability[day].includes(period));
    const newAvailability = { ...inlineFormData.availability };
    
    days.forEach(day => {
      if (isSelected) {
        newAvailability[day] = newAvailability[day].filter(p => p !== period);
      } else {
        if (!newAvailability[day].includes(period)) {
          newAvailability[day] = [...newAvailability[day], period].sort((a, b) => a - b);
        }
      }
    });
    
    setInlineFormData(prev => ({
      ...prev,
      availability: newAvailability
    }));
  };

  const selectAllInlineAvailability = () => {
    const newAvailability: any = {};
    days.forEach(day => {
      newAvailability[day] = [...periods];
    });
    
    setInlineFormData(prev => ({
      ...prev,
      availability: newAvailability
    }));
  };

  const clearAllInlineAvailability = () => {
    const newAvailability: any = {};
    days.forEach(day => {
      newAvailability[day] = [];
    });
    
    setInlineFormData(prev => ({
      ...prev,
      availability: newAvailability
    }));
  };

  const handleDelete = (teacher: TeacherResponse) => {
    setDeleteDialogTeacher(teacher);
  };

  const confirmDelete = async () => {
    if (deleteDialogTeacher) {
      try {
        await TeacherService.delete(deleteDialogTeacher.id);
        toast.success('Teacher deleted successfully');
        setDeleteDialogTeacher(null);
        await fetchTeachers();
      } catch (error) {
        toast.error('Failed to delete teacher');
        console.error(error);
      }
    }
  };

  const handleImport = () => {
    setIsImportDialogOpen(true);
  };

  const handleDownloadTemplate = () => {
    toast.success('Template downloaded successfully');
  };

  const getTotalAvailablePeriods = (availabilities: TimeSlot[]) => {
    return availabilities.reduce((total, slot) => total + slot.lessons.length, 0);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(0);
  };

  return (
    <div className="space-y-4 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2>Teachers</h2>
          <p className="text-muted-foreground">Manage teachers and their subject assignments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImport} size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button onClick={handleAddTeacher} size="sm" className="bg-green-600 hover:bg-green-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Teacher
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search teachers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Inline Add/Clone Form */}
      {showInlineForm && (
        <Card className="border-2 border-green-500 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    placeholder="e.g., John Smith"
                    value={inlineFormData.fullName}
                    onChange={(e) => updateInlineFormField('fullName', e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label>Short Name / Code</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Auto-generated"
                      value={inlineFormData.shortName}
                      onChange={(e) => updateInlineFormField('shortName', e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowAvailabilityInForm(!showAvailabilityInForm)}
                      className={`flex-shrink-0 ${showAvailabilityInForm ? 'bg-green-100 border-green-500 text-green-700' : 'border-green-300 text-green-600'}`}
                      title="Toggle availability"
                    >
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Subject Selection */}
              <div className="space-y-2">
                <Label>Subjects</Label>
                <Popover open={subjectComboOpen} onOpenChange={setSubjectComboOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={subjectComboOpen}
                      className="w-full justify-between"
                      disabled={isLoadingSubjects}
                    >
                      {isLoadingSubjects ? (
                        <span className="text-muted-foreground">Loading subjects...</span>
                      ) : inlineFormData.selectedSubjectIds.length > 0 ? (
                        <span>{inlineFormData.selectedSubjectIds.length} subject{inlineFormData.selectedSubjectIds.length > 1 ? 's' : ''} selected</span>
                      ) : (
                        <span className="text-muted-foreground">Select subjects...</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search subjects..." />
                      <CommandEmpty>No subject found.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        {availableSubjects.map((subject) => (
                          <CommandItem
                            key={subject.id}
                            value={subject.name}
                            onSelect={() => toggleSubject(subject.id)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                inlineFormData.selectedSubjectIds.includes(subject.id)
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <span className="mr-2">{subject.emoji || '📖'}</span>
                            {subject.name}
                            <Badge variant="outline" className="ml-auto">
                              {subject.shortName}
                            </Badge>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>

                {/* Selected Subjects */}
                {inlineFormData.selectedSubjectIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {inlineFormData.selectedSubjectIds.map((subjectId) => {
                      const subject = availableSubjects.find(s => s.id === subjectId);
                      if (!subject) return null;
                      return (
                        <Badge
                          key={subjectId}
                          variant="secondary"
                          className="pl-2 pr-1"
                          style={{
                            backgroundColor: subject.color ? subject.color + '15' : undefined,
                            color: subject.color,
                            borderColor: subject.color ? subject.color + '40' : undefined
                          }}
                        >
                          <span className="mr-1">{subject.emoji || '📖'}</span>
                          {subject.name}
                          <button
                            onClick={() => removeSubject(subjectId)}
                            className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Inline Availability Grid */}
              {showAvailabilityInForm && (
                <div className="bg-white dark:bg-gray-950 rounded-lg border border-green-300 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Teacher Availability</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAllInlineAvailability}
                        className="h-7 text-xs text-green-600 border-green-300 hover:bg-green-50"
                      >
                        Select All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearAllInlineAvailability}
                        className="h-7 text-xs text-red-600 border-red-300 hover:bg-red-50"
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    {/* Period headers */}
                    <div className="grid grid-cols-8 gap-1">
                      <div className="p-1"></div>
                      {periods.map((period) => (
                        <button
                          key={period}
                          onClick={() => toggleInlinePeriodAcrossDays(period)}
                          className="p-1 text-center text-xs font-medium rounded border border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          P{period}
                        </button>
                      ))}
                    </div>
                    
                    {/* Days and periods */}
                    {days.map((day, dayIndex) => (
                      <div key={day} className="grid grid-cols-8 gap-1">
                        <button
                          onClick={() => toggleInlineDay(day)}
                          className="p-1 text-xs font-medium capitalize text-left rounded border border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          {dayLabels[dayIndex]}
                        </button>
                        {periods.map((period) => {
                          const isAvailable = inlineFormData.availability[day].includes(period);
                          return (
                            <button
                              key={period}
                              onClick={() => toggleInlineAvailability(day, period)}
                              className={`p-1 text-center rounded border text-xs transition-colors ${
                                isAvailable
                                  ? 'bg-green-500 border-green-600 text-white hover:bg-green-600'
                                  : 'bg-gray-100 border-gray-300 text-gray-400 hover:bg-gray-200 dark:bg-gray-800 dark:border-gray-700'
                              }`}
                            >
                              {isAvailable ? '✓' : '—'}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  onClick={handleSaveInlineForm} 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      {editingTeacherId ? 'Update Teacher' : 'Save Teacher'}
                    </>
                  )}
                </Button>
                <Button onClick={handleCancelInlineForm} variant="outline" size="sm" disabled={isSaving}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Short Name</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead className="text-center">Availability</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No teachers found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTeachers.map((teacher) => {
                  const totalPeriods = getTotalAvailablePeriods(teacher.availabilities);
                  const isExpanded = expandedAvailability === teacher.id;
                  const availability = convertFromTimeSlots(teacher.availabilities);

                  return (
                    <React.Fragment key={teacher.id}>
                      <TableRow className="hover:bg-muted/50">
                        <TableCell className="font-medium">{teacher.fullName}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{teacher.shortName}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {teacher.subjects.length === 0 ? (
                              <span className="text-sm text-muted-foreground">No subjects</span>
                            ) : (
                              teacher.subjects.map((subject) => (
                                <Badge
                                  key={subject.id}
                                  variant="outline"
                                  className="text-xs"
                                  style={{
                                    backgroundColor: subject.color ? subject.color + '15' : undefined,
                                    color: subject.color,
                                    borderColor: subject.color ? subject.color + '40' : undefined
                                  }}
                                >
                                  <span className="mr-1">{subject.emoji || '📖'}</span>
                                  {subject.shortName}
                                </Badge>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedAvailability(isExpanded ? null : teacher.id)}
                              className="h-8 px-2 text-green-700 hover:text-green-800 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950"
                            >
                              <Calendar className="h-4 w-4 mr-1" />
                              {totalPeriods} periods
                              <ChevronDown className={`ml-1 h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(teacher)}
                              className="h-8 px-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleClone(teacher)}
                              className="h-8 px-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                            >
                              <Copy className="h-4 w-4 mr-1" />
                              Clone
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(teacher)}
                              className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Availability Row */}
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={5} className="bg-green-50/30 dark:bg-green-950/10 p-4">
                            <div className="bg-white dark:bg-gray-950 rounded-lg border border-green-200 dark:border-green-900 p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Calendar className="h-4 w-4 text-green-600" />
                                <h4 className="text-green-800 dark:text-green-300">Weekly Availability</h4>
                              </div>
                              
                              <div className="grid gap-2">
                                {/* Period headers */}
                                <div className="grid grid-cols-8 gap-1">
                                  <div className="p-1"></div>
                                  {periods.map((period) => (
                                    <div
                                      key={period}
                                      className="p-1 text-center text-xs font-medium text-muted-foreground"
                                    >
                                      P{period}
                                    </div>
                                  ))}
                                </div>
                                
                                {/* Days and availability */}
                                {days.map((day, dayIndex) => (
                                  <div key={day} className="grid grid-cols-8 gap-1">
                                    <div className="p-1 text-xs font-medium capitalize text-muted-foreground">
                                      {dayLabels[dayIndex]}
                                    </div>
                                    {periods.map((period) => {
                                      const isAvailable = availability[day]?.includes(period);
                                      return (
                                        <div
                                          key={period}
                                          className={`p-1 text-center rounded border text-xs ${
                                            isAvailable
                                              ? 'bg-green-500 border-green-600 text-white'
                                              : 'bg-gray-100 border-gray-300 text-gray-400 dark:bg-gray-800 dark:border-gray-700'
                                          }`}
                                        >
                                          {isAvailable ? '✓' : '—'}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Pagination */}
      {!isLoading && totalElements > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Showing {currentPage * itemsPerPage + 1} to {Math.min((currentPage + 1) * itemsPerPage, totalElements)} of {totalElements} teachers
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage >= totalPages - 1}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDialogTeacher} onOpenChange={(open) => !open && setDeleteDialogTeacher(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteDialogTeacher?.fullName}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Teachers</DialogTitle>
            <DialogDescription>
              Upload an Excel file to import multiple teachers at once.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Drag and drop your Excel file here, or click to browse
              </p>
              <Button variant="outline" className="mt-4">
                Select File
              </Button>
            </div>
            <Button variant="outline" onClick={handleDownloadTemplate} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsImportDialogOpen(false)}>
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
