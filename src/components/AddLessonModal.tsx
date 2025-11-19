import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from './ui/alert';
import { 
  X, 
  ChevronDown, 
  Check, 
  HelpCircle, 
  AlertTriangle 
} from 'lucide-react';
import { cn } from './ui/utils';
import { SubjectService } from '@/lib/subjects';
import { TeacherService } from '@/lib/teachers';
import { ClassService } from '@/lib/classes';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n/index';

interface AddLessonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (lessonData: any) => void;
  editingLesson?: any;
}

export default function AddLessonModal({
  open,
  onOpenChange,
  onSubmit,
  editingLesson,
}: AddLessonModalProps) {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    subject: '',
    selectedClasses: [] as string[],
    selectedTeacher: '',
    lessonsPerWeek: 1,
    lessonSequence: 'single',
    scheduleType: 'weekly',
    enableFixedPlacement: false,
    formats: [{ timesPerWeek: 1, duration: '45' }]
  });

  const [conflicts, setConflicts] = useState<any[]>([]);
  const [classesOpen, setClassesOpen] = useState(false);
  const [classSearch, setClassSearch] = useState('');

  // Fetch data from API on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [teachersData, subjectsData, classesData] = await Promise.all([
          TeacherService.getAll(),
          SubjectService.getAll(),
          ClassService.getAll()
        ]);
        
        setTeachers(teachersData);
        setSubjects(subjectsData);
        setClasses(classesData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to load teachers, subjects, or classes');
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open]);

  // Reset form when modal opens/closes or editing lesson changes
  useEffect(() => {
    if (open) {
      const initialFormData = {
        subject: '',
        selectedClasses: [] as string[],
        selectedTeacher: '',
        lessonsPerWeek: 1,
        lessonSequence: 'single',
        scheduleType: 'weekly',
        enableFixedPlacement: false,
        formats: [{ timesPerWeek: 1, duration: '45' }]
      };

      if (editingLesson) {
        initialFormData.subject = editingLesson.subject || '';
        initialFormData.selectedClasses = editingLesson.lessonClass
          ? [editingLesson.lessonClass]
          : editingLesson.class
          ? [editingLesson.class]
          : [];
        initialFormData.selectedTeacher = editingLesson.teacher || '';
        initialFormData.lessonsPerWeek = editingLesson.lessonsPerWeek || 1;
        initialFormData.lessonSequence = editingLesson.lessonSequence || 'single';
        initialFormData.scheduleType = editingLesson.scheduleType || 'weekly';
        initialFormData.enableFixedPlacement = editingLesson.enableFixedPlacement || false;
        initialFormData.formats = editingLesson.formats || [{ timesPerWeek: editingLesson.lessonsPerWeek || 1, duration: '45' }];
      }
      
      setFormData(initialFormData);
      setConflicts([]);
    }
  }, [open, editingLesson]);

  // Check conflicts when key fields change
  useEffect(() => {
    if (formData.selectedClasses.length > 0 && formData.selectedTeacher) {
      const detectedConflicts: any[] = [];
      setConflicts(detectedConflicts);
    }
  }, [formData.selectedClasses, formData.selectedTeacher]);

  const handleClassToggle = (className: string) => {
    const newSelected = formData.selectedClasses.includes(className)
      ? formData.selectedClasses.filter(c => c !== className)
      : [...formData.selectedClasses, className];
    
    setFormData(prev => ({ ...prev, selectedClasses: newSelected }));
  };

  const handleTeacherToggle = (teacherName: string) => {
    setFormData(prev => ({ ...prev, selectedTeacher: teacherName }));
  };

  const removeClass = (className: string) => {
    setFormData(prev => ({ 
      ...prev, 
      selectedClasses: prev.selectedClasses.filter(c => c !== className)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject || formData.selectedClasses.length === 0 || !formData.selectedTeacher) {
      return;
    }

    onSubmit(formData);
  };

  const filteredClasses = classes.filter((cls: any) => 
    cls.name.toLowerCase().includes(classSearch.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingLesson ? 'Edit Lesson' : 'Add Lesson'}
          </DialogTitle>
          <DialogDescription>
            {editingLesson
              ? 'Update the lesson details below.'
              : 'Enter the details for the new lesson. Configure classes, teachers, and scheduling options.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Conflicts Alert */}
            {conflicts.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Conflicts Detected</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside">
                    {conflicts.map((conflict, idx) => (
                      <li key={idx}>{conflict.message}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Subject Selection (Required, Single) */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject {editingLesson ? '' : '*'}</Label>
              {editingLesson ? (
                // Display-only mode when editing
                <div className="p-2 border rounded-lg bg-muted/50">
                  <p className="text-sm">
                    {formData.subject 
                      ? subjects.find((s: any) => s.id.toString() === formData.subject)?.name || formData.subject
                      : 'No subject selected'}
                  </p>
                </div>
              ) : (
                // Edit mode for new lessons
                <Select 
                  value={formData.subject} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}
                >
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoading ? (
                      <div className="p-2 text-center text-muted-foreground">Loading...</div>
                    ) : (
                      subjects.map((subject: any) => (
                        <SelectItem key={subject.id} value={subject.id.toString()}>
                          {subject.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Classes Selection */}
            <div className="space-y-2">
              <Label>Classes {editingLesson ? '' : '*'}</Label>
              <p className="text-sm text-muted-foreground">
                {editingLesson 
                  ? 'Classes cannot be changed when editing a lesson.'
                  : 'Select which classes this lesson applies to (e.g., 5-A, 5-B, 5-C)'}
              </p>
              
              {editingLesson ? (
                // Display-only mode when editing
                <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/50">
                  {formData.selectedClasses.length > 0 ? (
                    formData.selectedClasses.map((className) => (
                      <Badge key={className} variant="secondary" className="px-2 py-1">
                        {className}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No classes selected</span>
                  )}
                </div>
              ) : (
                // Edit mode for new lessons
                <>
                  {/* Selected Classes Chips */}
                  {formData.selectedClasses.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30">
                      {formData.selectedClasses.map((className) => (
                        <Badge key={className} variant="secondary" className="flex items-center gap-1 px-2 py-1">
                          {className}
                          <button
                            type="button"
                            onClick={() => removeClass(className)}
                            className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  <Popover open={classesOpen} onOpenChange={setClassesOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={classesOpen}
                        className="w-full justify-between"
                      >
                        {formData.selectedClasses.length > 0
                          ? `${formData.selectedClasses.length} class${formData.selectedClasses.length !== 1 ? 'es' : ''} selected`
                          : "Select classes..."}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput 
                          placeholder="Search classes..." 
                          value={classSearch}
                          onValueChange={setClassSearch}
                        />
                        <CommandList>
                          <CommandEmpty>No classes found.</CommandEmpty>
                          <CommandGroup>
                            {filteredClasses.map((cls: any) => (
                              <CommandItem
                                key={cls.id}
                                onSelect={() => handleClassToggle(cls.name)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.selectedClasses.includes(cls.name)
                                      ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {cls.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </>
              )}
            </div>

            {/* Teachers Selection (Multi-Select) */}
            <div className="space-y-2">
              <Label htmlFor="teacher">Teacher *</Label>
              <p className="text-sm text-muted-foreground">
                Select the teacher for this lesson.
              </p>
              <Select 
                value={formData.selectedTeacher} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, selectedTeacher: value }))}
              >
                <SelectTrigger id="teacher">
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {isLoading ? (
                    <div className="p-2 text-center text-muted-foreground">Loading...</div>
                  ) : (
                    teachers.map((teacher: any) => (
                      <SelectItem key={teacher.id} value={teacher.fullName}>
                        {teacher.fullName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Number of Lessons per Week */}
            <div className="space-y-2">
              <Label htmlFor="lessonsPerWeek">Number of Lessons per Week</Label>
              <p className="text-sm text-muted-foreground">
                How many times this subject should occur in a week.
              </p>
              <Input
                id="lessonsPerWeek"
                type="number"
                min="1"
                max="20"
                value={formData.lessonsPerWeek}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  setFormData(prev => ({ 
                    ...prev, 
                    lessonsPerWeek: value,
                    formats: [{ timesPerWeek: value, duration: prev.formats[0]?.duration || '45' }]
                  }));
                }}
              />
            </div>

            {/* Lesson Period (Sequence) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label>Lesson Period</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger type="button">
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Should these lessons be scheduled consecutively? For example, choosing 'Double Period' will force the AI to always schedule this subject as a two-lesson block.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <RadioGroup 
                value={formData.lessonSequence} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, lessonSequence: value }))}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="single" id="single" />
                  <Label htmlFor="single" className="cursor-pointer">
                    Single Period
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="double" id="double" />
                  <Label htmlFor="double" className="cursor-pointer">
                    Double Period (two lessons back-to-back)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="triple" id="triple" />
                  <Label htmlFor="triple" className="cursor-pointer">
                    Triple Period (three lessons back-to-back)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Schedule Type (Frequency) */}
            <div className="space-y-3">
              <Label>Schedule Type</Label>
              
              <RadioGroup 
                value={formData.scheduleType} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, scheduleType: value }))}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="weekly" id="weekly" />
                  <Label htmlFor="weekly" className="cursor-pointer">
                    Weekly
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bi-weekly" id="bi-weekly" />
                  <Label htmlFor="bi-weekly" className="cursor-pointer">
                    Bi-weekly (every two weeks)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Fixed Placement Toggle */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="enableFixedPlacement" className="cursor-pointer">
                        Enable Fixed Placement
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger type="button">
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>When enabled, the AI will not automatically schedule this lesson. You will need to place it on the timetable manually. This is useful for fixed events like school assemblies or special club meetings.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
                <Switch
                  id="enableFixedPlacement"
                  checked={formData.enableFixedPlacement}
                  onCheckedChange={(checked: boolean) => 
                    setFormData(prev => ({ ...prev, enableFixedPlacement: checked }))
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={
                !formData.subject || 
                formData.selectedClasses.length === 0 || 
                !formData.selectedTeacher
              }
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              Save Lesson
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}