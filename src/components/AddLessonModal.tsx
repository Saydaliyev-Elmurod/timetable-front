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

interface AddLessonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (lessonData: any) => void;
  editingLesson?: any;
  availableClasses: string[];
  availableTeachers: string[];
  availableSubjects: string[];
  availableRooms?: string[];
  detectConflicts?: (lessonData: any, excludeId?: number) => any[];
}

export default function AddLessonModal({
  open,
  onOpenChange,
  onSubmit,
  editingLesson,
  availableClasses,
  availableTeachers,
  availableSubjects,
  availableRooms = ['Room 101', 'Room 102', 'Room 103', 'Lab A', 'Lab B', 'Gym'],
  detectConflicts
}: AddLessonModalProps) {
  const [formData, setFormData] = useState({
    subject: '',
    selectedClasses: [] as string[],
    selectedTeachers: [] as string[],
    selectedRooms: [] as string[],
    lessonsPerWeek: 1,
    lessonSequence: 'single', // 'single', 'double', 'triple'
    scheduleType: 'weekly', // 'weekly', 'bi-weekly'
    enableFixedPlacement: false,
    formats: [{ timesPerWeek: 1, duration: '45' }] // For compatibility with LessonsPage
  });

  const [conflicts, setConflicts] = useState<any[]>([]);
  const [classesOpen, setClassesOpen] = useState(false);
  const [teachersOpen, setTeachersOpen] = useState(false);
  const [roomsOpen, setRoomsOpen] = useState(false);
  const [classSearch, setClassSearch] = useState('');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [roomSearch, setRoomSearch] = useState('');

  // Reset form when modal opens/closes or editing lesson changes
  useEffect(() => {
    if (open) {
      if (editingLesson) {
        setFormData({
          subject: editingLesson.subject || '',
          selectedClasses: [editingLesson.class] || [],
          selectedTeachers: [editingLesson.teacher] || [],
          selectedRooms: editingLesson.rooms || [],
          lessonsPerWeek: editingLesson.lessonsPerWeek || 1,
          lessonSequence: editingLesson.lessonSequence || 'single',
          scheduleType: editingLesson.scheduleType || 'weekly',
          enableFixedPlacement: editingLesson.enableFixedPlacement || false,
          formats: [{ timesPerWeek: editingLesson.lessonsPerWeek || 1, duration: '45' }]
        });
      } else {
        setFormData({
          subject: '',
          selectedClasses: [],
          selectedTeachers: [],
          selectedRooms: [],
          lessonsPerWeek: 1,
          lessonSequence: 'single',
          scheduleType: 'weekly',
          enableFixedPlacement: false,
          formats: [{ timesPerWeek: 1, duration: '45' }]
        });
      }
      setConflicts([]);
    }
  }, [open, editingLesson]);

  // Check conflicts when key fields change
  useEffect(() => {
    if (formData.selectedClasses.length > 0 && formData.selectedTeachers.length > 0 && detectConflicts) {
      const detectedConflicts: any[] = [];
      setConflicts(detectedConflicts);
    }
  }, [formData.selectedClasses, formData.selectedTeachers, detectConflicts]);

  const handleClassToggle = (className: string) => {
    const newSelected = formData.selectedClasses.includes(className)
      ? formData.selectedClasses.filter(c => c !== className)
      : [...formData.selectedClasses, className];
    
    setFormData(prev => ({ ...prev, selectedClasses: newSelected }));
  };

  const handleTeacherToggle = (teacherName: string) => {
    const newSelected = formData.selectedTeachers.includes(teacherName)
      ? formData.selectedTeachers.filter(t => t !== teacherName)
      : [...formData.selectedTeachers, teacherName];
    
    setFormData(prev => ({ ...prev, selectedTeachers: newSelected }));
  };

  const handleRoomToggle = (roomName: string) => {
    const newSelected = formData.selectedRooms.includes(roomName)
      ? formData.selectedRooms.filter(r => r !== roomName)
      : [...formData.selectedRooms, roomName];
    
    setFormData(prev => ({ ...prev, selectedRooms: newSelected }));
  };

  const removeClass = (className: string) => {
    setFormData(prev => ({ 
      ...prev, 
      selectedClasses: prev.selectedClasses.filter(c => c !== className)
    }));
  };

  const removeTeacher = (teacherName: string) => {
    setFormData(prev => ({ 
      ...prev, 
      selectedTeachers: prev.selectedTeachers.filter(t => t !== teacherName)
    }));
  };

  const removeRoom = (roomName: string) => {
    setFormData(prev => ({ 
      ...prev, 
      selectedRooms: prev.selectedRooms.filter(r => r !== roomName)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject || formData.selectedClasses.length === 0 || formData.selectedTeachers.length === 0) {
      return;
    }

    onSubmit(formData);
  };

  const filteredClasses = availableClasses.filter(cls => 
    cls.toLowerCase().includes(classSearch.toLowerCase())
  );

  const filteredTeachers = availableTeachers.filter(teacher => 
    teacher.toLowerCase().includes(teacherSearch.toLowerCase())
  );

  const filteredRooms = availableRooms.filter(room => 
    room.toLowerCase().includes(roomSearch.toLowerCase())
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
              <Label htmlFor="subject">Subject *</Label>
              <Select 
                value={formData.subject} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}
              >
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {availableSubjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Classes Selection (Multi-Select) */}
            <div className="space-y-2">
              <Label>Classes *</Label>
              <p className="text-sm text-muted-foreground">
                Select which classes this lesson applies to (e.g., 5-A, 5-B, 5-C)
              </p>
              
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
                        {filteredClasses.map((className) => (
                          <CommandItem
                            key={className}
                            onSelect={() => handleClassToggle(className)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.selectedClasses.includes(className)
                                  ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {className}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Teachers Selection (Multi-Select) */}
            <div className="space-y-2">
              <Label>Teachers *</Label>
              <p className="text-sm text-muted-foreground">
                Select the teacher(s) for this lesson. Allows for co-teaching.
              </p>
              
              {/* Selected Teachers Chips */}
              {formData.selectedTeachers.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30">
                  {formData.selectedTeachers.map((teacherName) => (
                    <Badge key={teacherName} variant="secondary" className="flex items-center gap-1 px-2 py-1">
                      {teacherName}
                      <button
                        type="button"
                        onClick={() => removeTeacher(teacherName)}
                        className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <Popover open={teachersOpen} onOpenChange={setTeachersOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={teachersOpen}
                    className="w-full justify-between"
                  >
                    {formData.selectedTeachers.length > 0
                      ? `${formData.selectedTeachers.length} teacher${formData.selectedTeachers.length !== 1 ? 's' : ''} selected`
                      : "Select teachers..."}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Search teachers..." 
                      value={teacherSearch}
                      onValueChange={setTeacherSearch}
                    />
                    <CommandList>
                      <CommandEmpty>No teachers found.</CommandEmpty>
                      <CommandGroup>
                        {filteredTeachers.map((teacherName) => (
                          <CommandItem
                            key={teacherName}
                            onSelect={() => handleTeacherToggle(teacherName)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.selectedTeachers.includes(teacherName)
                                  ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {teacherName}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Rooms Selection (Multi-Select) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Allowed Rooms</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger type="button">
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Select multiple rooms to give the AI scheduler flexibility. The AI will choose the most optimal room from this list when generating the schedule.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              {/* Selected Rooms Chips */}
              {formData.selectedRooms.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30">
                  {formData.selectedRooms.map((roomName) => (
                    <Badge key={roomName} variant="secondary" className="flex items-center gap-1 px-2 py-1">
                      {roomName}
                      <button
                        type="button"
                        onClick={() => removeRoom(roomName)}
                        className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <Popover open={roomsOpen} onOpenChange={setRoomsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={roomsOpen}
                    className="w-full justify-between"
                  >
                    {formData.selectedRooms.length > 0
                      ? `${formData.selectedRooms.length} room${formData.selectedRooms.length !== 1 ? 's' : ''} selected`
                      : "Select allowed rooms..."}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Search rooms..." 
                      value={roomSearch}
                      onValueChange={setRoomSearch}
                    />
                    <CommandList>
                      <CommandEmpty>No rooms found.</CommandEmpty>
                      <CommandGroup>
                        {filteredRooms.map((roomName) => (
                          <CommandItem
                            key={roomName}
                            onSelect={() => handleRoomToggle(roomName)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.selectedRooms.includes(roomName)
                                  ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {roomName}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
                  onCheckedChange={(checked) => 
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
                formData.selectedTeachers.length === 0
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