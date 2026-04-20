import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Checkbox } from './ui/checkbox';
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
import { RoomService } from '@/lib/rooms';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n/index';
import { GroupLessonDetail } from '@/types/api';

interface GroupLessonConfig {
  groupId: number;
  groupName: string;
  isSelected: boolean;
  teacherId: number | null;
  teacherName?: string;
  teacherName?: string;
  roomIds: number[];
  roomNames?: string[];
}

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
  const { t } = useTranslation();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    subject: '',
    selectedClasses: [] as number[],
    selectedTeacher: '',
    selectedTeacherId: null as number | null,
    lessonsPerWeek: 1,
    lessonSequence: 'single',
    scheduleType: 'weekly',
    enableFixedPlacement: false,
    dayOfWeek: 'MONDAY',
    hour: 1,
    roomIds: [] as number[],
    period: 1, // Default period
    frequency: 'WEEKLY' as 'WEEKLY' | 'BI_WEEKLY' | 'TRI_WEEKLY',
    formats: [{ timesPerWeek: 1, duration: '45' }]
  });

  const [isGroupMode, setIsGroupMode] = useState(false);
  const [groupLessonConfigs, setGroupLessonConfigs] = useState<GroupLessonConfig[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [classesOpen, setClassesOpen] = useState(false);
  const [classSearch, setClassSearch] = useState('');
  const [roomsOpen, setRoomsOpen] = useState(false);
  const [roomSearch, setRoomSearch] = useState('');

  // Fetch data from API on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [teachersData, subjectsData, classesData, roomsData] = await Promise.all([
          TeacherService.getAll(),
          SubjectService.getAll(),
          ClassService.getAll(),
          RoomService.getAll()
        ]);

        setTeachers(teachersData);
        setSubjects(subjectsData);
        setClasses(classesData);
        setRooms(roomsData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to load teachers, subjects, classes, or rooms');
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open]);

  // Initialization Effect
  useEffect(() => {
    if (open && classes.length > 0) {
      if (editingLesson) {
        // Edit Mode Initialization
        const raw = editingLesson.raw || {};

        // Determine classes
        let initialClasses: number[] = [];
        if (editingLesson.classId) {
          initialClasses = [editingLesson.classId];
        } else if (raw.class?.id) {
          initialClasses = [raw.class.id];
        }

        // Find Teacher
        const teacherId = raw.teacher?.id || editingLesson.teacherId || null;
        let teacherName = '';
        if (teacherId) {
          const t = teachers.find(x => x.id === teacherId);
          teacherName = t?.fullName || raw.teacher?.fullName || '';
        }

        // Determine Subject
        const subjectId = raw.subject?.id ? raw.subject.id.toString() : '';

        // Rooms
        const initialRoomIds = raw.rooms ? raw.rooms.map((r: any) => r.id) : [];

        setFormData({
          subject: subjectId,
          selectedClasses: initialClasses,
          selectedTeacher: teacherName,
          selectedTeacherId: teacherId,
          lessonsPerWeek: raw.lessonCount || 1,
          lessonSequence: raw.period > 1 ? (raw.period === 2 ? 'double' : 'triple') : 'single',
          scheduleType: (raw.frequency || 'WEEKLY').toLowerCase(),
          enableFixedPlacement: false, // Not standard in response yet?
          dayOfWeek: raw.dayOfWeek || null,
          hour: raw.hour || null,
          roomIds: initialRoomIds,
          period: raw.period || 1,
          frequency: raw.frequency || 'WEEKLY',
          formats: [{ timesPerWeek: raw.lessonCount || 1, duration: '45' }]
        });

        // Handle Group Details
        if (raw.groupDetails && raw.groupDetails.length > 0) {
          const configs: GroupLessonConfig[] = [];
          // We need to iterate over relevant classes to find the group names
          initialClasses.forEach(cId => {
            const cls = classes.find(c => c.id === cId);
            if (cls && cls.groups) {
              cls.groups.forEach((grp: any) => {
                const detail = raw.groupDetails.find((d: any) => d.group?.id === grp.id);
                if (detail) {
                  configs.push({
                    groupId: grp.id,
                    groupName: grp.name,
                    isSelected: true,
                    teacherId: detail.teacher?.id || null,
                    teacherName: detail.teacher?.fullName || '',
                    roomIds: detail.rooms ? detail.rooms.map((r: any) => r.id) : [],
                    roomNames: detail.rooms ? detail.rooms.map((r: any) => r.name) : []
                  });
                }
              });
            }
          });
          setGroupLessonConfigs(configs); // Seed with existing
        } else {
          // If no group details, we let the other effect handle default population (which is empty selected)
          // But we might want to clear any previous state
          setGroupLessonConfigs([]);
        }

      } else {
        // Add Mode Reset
        setFormData({
          subject: '',
          selectedClasses: [] as number[],
          selectedTeacher: '',
          selectedTeacherId: null as number | null,
          lessonsPerWeek: 1,
          lessonSequence: 'single',
          scheduleType: 'weekly',
          enableFixedPlacement: false,
          dayOfWeek: 'MONDAY',
          hour: 1,
          roomIds: [] as number[],
          period: 1,
          frequency: 'WEEKLY',
          formats: [{ timesPerWeek: 1, duration: '45' }]
        });
        setIsGroupMode(false);
        setGroupLessonConfigs([]);
        setConflicts([]);
      }
    }
  }, [open, editingLesson, classes, teachers]); // Depend on classes/teachers to ensure we can map IDs

  // Update group configurations when classes change
  // This logic ensures that when I select a class, its groups appear in the config list.
  // It preserves any existing config (Selection, Teacher, etc.) if the group was already there.
  useEffect(() => {
    if (classes.length === 0) return;

    const newConfigs: GroupLessonConfig[] = [];

    formData.selectedClasses.forEach(classId => {
      const selectedClass = classes.find(c => c.id === classId);

      if (selectedClass && selectedClass.groups) {
        selectedClass.groups.forEach((group: any) => {
          // Check if we already have this group in state (e.g. from initialization or previous interaction)
          const existing = groupLessonConfigs.find(g => g.groupId === group.id);

          if (existing) {
            newConfigs.push(existing);
          } else {
            // New default config
            newConfigs.push({
              groupId: group.id,
              groupName: group.name,
              isSelected: false,
              teacherId: null, // Default to null, user must select
              teacherName: '',
              roomIds: [],
              roomNames: []
            });
          }
        });
      }
    });

    // Only update if length or content different to avoid infinite loops if strict equality fails?
    // JSON stringify comparison is cheap enough for small arrays
    if (JSON.stringify(newConfigs) !== JSON.stringify(groupLessonConfigs)) {
      setGroupLessonConfigs(newConfigs);
    }
  }, [formData.selectedClasses, classes]);
  // removed groupLessonConfigs from deps to avoid loop, but we need it. 
  // To solve this: use functional state update or refs. 
  // But strictly, we want to REBUILD the list based on selectedClasses.
  // The logic "find existing" relies on the CURRENT state.
  // If I don't include it in deps, it uses stale state.
  // Correct pattern: use functional update for setGroupLessonConfigs?
  // No, because we need to calculate `newConfigs` completely.
  // Let's rely on the fact that `groupLessonConfigs` is updated via initialization.
  // If user adds a class, reference `groupLessonConfigs` from REF or just include in deps but add guard?

  // Actually, the best way for the "sync" effect:
  // It runs when `selectedClasses` changes.
  // It needs access to the *latest* `groupLessonConfigs` to preserve data.
  // We can use a ref to track the latest configs to read from, to avoid dependency loop.

  const groupsRef = React.useRef(groupLessonConfigs);
  useEffect(() => {
    groupsRef.current = groupLessonConfigs;
  }, [groupLessonConfigs]);

  useEffect(() => {
    if (classes.length === 0) return;

    const newConfigs: GroupLessonConfig[] = [];

    formData.selectedClasses.forEach(classId => {
      const selectedClass = classes.find(c => c.id === classId);

      if (selectedClass && selectedClass.groups) {
        selectedClass.groups.forEach((group: any) => {
          const existing = groupsRef.current.find(g => g.groupId === group.id);
          newConfigs.push(existing || {
            groupId: group.id,
            groupName: group.name,
            isSelected: false,
            teacherId: null,
            teacherName: '',
            roomIds: [],
            roomNames: []
          });
        });
      }
    });

    if (JSON.stringify(newConfigs) !== JSON.stringify(groupsRef.current)) {
      setGroupLessonConfigs(newConfigs);
    }
  }, [formData.selectedClasses, classes]);


  const handleClassToggle = (classId: number) => {
    const newSelected = formData.selectedClasses.includes(classId)
      ? formData.selectedClasses.filter(c => c !== classId)
      : [...formData.selectedClasses, classId];

    setFormData(prev => ({ ...prev, selectedClasses: newSelected }));
  };

  const handleGroupToggle = (groupId: number) => {
    setGroupLessonConfigs(prev =>
      prev.map(g =>
        g.groupId === groupId
          ? { ...g, isSelected: !g.isSelected }
          : g
      )
    );
  };

  const handleGroupTeacherChange = (groupId: number, teacherId: number | null, teacherName?: string) => {
    setGroupLessonConfigs(prev =>
      prev.map(g =>
        g.groupId === groupId
          ? { ...g, teacherId, teacherName: teacherName || '' }
          : g
      )
    );
  };

  const handleGroupRoomToggle = (groupId: number, roomId: number) => {
    setGroupLessonConfigs(prev =>
      prev.map(g => {
        if (g.groupId === groupId) {
          const newRoomIds = g.roomIds.includes(roomId)
            ? g.roomIds.filter(r => r !== roomId)
            : [...g.roomIds, roomId];

          const newRoomNames = rooms
            .filter(r => newRoomIds.includes(r.id))
            .map(r => r.name);

          return { ...g, roomIds: newRoomIds, roomNames: newRoomNames };
        }
        return g;
      })
    );
  };

  const removeClass = (classId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedClasses: prev.selectedClasses.filter(c => c !== classId)
    }));
  };

  const removeGroupRoom = (groupId: number, roomId: number) => {
    setGroupLessonConfigs(prev =>
      prev.map(g => {
        if (g.groupId === groupId) {
          const newRoomIds = g.roomIds.filter(r => r !== roomId);
          const newRoomNames = rooms
            .filter(r => newRoomIds.includes(r.id))
            .map(r => r.name);
          return { ...g, roomIds: newRoomIds, roomNames: newRoomNames };
        }
        return g;
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isGroupMode) {
      // Group Mode Validation
      const selectedGroups = groupLessonConfigs.filter(g => g.isSelected);
      if (selectedGroups.length === 0) {
        toast.error('Please select at least one group');
        return;
      }
      const incomplete = selectedGroups.some(g => !g.teacherId);
      if (incomplete) {
        toast.error('All selected groups must have a teacher assigned');
        return;
      }
    } else {
      // Regular Mode Validation
      if (!formData.subject || formData.selectedClasses.length === 0 || !formData.selectedTeacherId) {
        toast.error('Please fill in all required fields (Subject, Main Teacher, Classes)');
        return;
      }
    }

    const selectedGroups = groupLessonConfigs.filter(g => g.isSelected);

    const groupDetails: GroupLessonDetail[] = selectedGroups.map(g => ({
      groupId: g.groupId,
      teacherId: g.teacherId!,
      roomIds: g.roomIds
    }));

    // map formData.frequency to API enum format
    const frequencyUpper = (formData.frequency || 'WEEKLY').toUpperCase();

    // If group is selected, we must provide valid teacherId/subjectId to pass backend validation
    // We'll peek at the first selected group for this.
    const firstGroup = groupDetails.length > 0 ? groupDetails[0] : null;

    const lessonData = {
      // Direct mappings
      classId: formData.selectedClasses,
      roomIds: formData.roomIds,
      lessonCount: formData.lessonsPerWeek,

      // Conditional mappings based on mode
      groups: isGroupMode ? groupDetails : undefined,

      subjectId: parseInt(formData.subject),

      teacherId: isGroupMode
        ? (firstGroup?.teacherId)
        : parseInt(formData.selectedTeacherId?.toString() || '0'),

      frequency: frequencyUpper,
      period: formData.period,
      dayOfWeek: null,
      hour: null
    };

    onSubmit(lessonData);
  };

  const filteredClasses = classes.filter((cls: any) =>
    cls.name.toLowerCase().includes(classSearch.toLowerCase())
  );

  const filteredRooms = rooms.filter((room: any) =>
    room.name.toLowerCase().includes(roomSearch.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-11/12 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingLesson ? 'Edit Lesson' : 'Add Lesson'}
          </DialogTitle>
          <DialogDescription>
            {editingLesson
              ? 'Update the lesson details below.'
              : 'Enter the details for the new lesson. You can assign individual lessons to specific groups.'}
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


            {/* Classes Selection */}
            <div className="space-y-2">
              <Label>Classes *</Label>
              <p className="text-sm text-muted-foreground">
                Select which classes this lesson applies to
              </p>

              {/* Selected Classes Chips */}
              {formData.selectedClasses.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30">
                  {formData.selectedClasses.map((classId) => {
                    const cls = classes.find(c => c.id === classId);
                    return (
                      <Badge key={classId} variant="secondary" className="flex items-center gap-1 px-2 py-1">
                        {cls?.name}
                        <button
                          type="button"
                          onClick={() => removeClass(classId)}
                          className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
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
                            onSelect={() => handleClassToggle(cls.id)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.selectedClasses.includes(cls.id)
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
            </div>

            {/* Group Mode Toggle */}
            <div className="flex items-center space-x-2 py-2">
              <Switch
                id="group-mode"
                checked={isGroupMode}
                onCheckedChange={(checked: boolean) => {
                  setIsGroupMode(checked);
                  // Auto-select removed as per user request
                }}
              />
              <Label htmlFor="group-mode">Split into Groups / Divide Class</Label>
            </div>

            {/* Standard Mode Fields */}
            {/* Subject Selection (Always visible, as subject applies to all groups) */}
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
                  {subjects.map((subject: any) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Standard Mode Fields */}
            {!isGroupMode && (
              <>
                {/* Teachers Selection */}
                <div className="space-y-2">
                  <Label htmlFor="teacher">Main Teacher *</Label>
                  <Select
                    value={formData.selectedTeacherId?.toString() || ''}
                    onValueChange={(value) => {
                      const teacherId = parseInt(value);
                      const teacher = teachers.find(t => t.id === teacherId);
                      setFormData(prev => ({
                        ...prev,
                        selectedTeacherId: teacherId,
                        selectedTeacher: teacher?.fullName || ''
                      }));
                    }}
                  >
                    <SelectTrigger id="teacher">
                      <SelectValue placeholder="Select main teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher: any) => (
                        <SelectItem key={teacher.id} value={teacher.id.toString()}>
                          {teacher.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Day and Hour inputs removed per user request */}
            {/* 
            <div className="grid grid-cols-2 gap-4">
              ...
            </div> 
            */}

            {/* Number of Lessons per Week */}
            <div className="space-y-2">
              <Label htmlFor="lessonsPerWeek">Number of Lessons per Week</Label>
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

            {/* Rooms Selection */}
            {!isGroupMode && (
              <div className="space-y-2">
                <Label>Rooms (Main Lesson)</Label>
                <p className="text-sm text-muted-foreground">
                  Select rooms for the main lesson (optional - can be overridden per group)
                </p>

                {formData.roomIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30">
                    {formData.roomIds.map((roomId) => {
                      const room = rooms.find(r => r.id === roomId);
                      return (
                        <Badge key={roomId} variant="secondary" className="flex items-center gap-1 px-2 py-1">
                          {room?.name}
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              roomIds: prev.roomIds.filter(r => r !== roomId)
                            }))}
                            className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}

                <Popover open={roomsOpen} onOpenChange={setRoomsOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={roomsOpen}
                      className="w-full justify-between"
                    >
                      {formData.roomIds.length > 0
                        ? `${formData.roomIds.length} room${formData.roomIds.length !== 1 ? 's' : ''} selected`
                        : "Select rooms..."}
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
                          {filteredRooms.map((room: any) => (
                            <CommandItem
                              key={room.id}
                              onSelect={() => {
                                const newRoomIds = formData.roomIds.includes(room.id)
                                  ? formData.roomIds.filter(r => r !== room.id)
                                  : [...formData.roomIds, room.id];
                                setFormData(prev => ({ ...prev, roomIds: newRoomIds }));
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.roomIds.includes(room.id)
                                    ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {room.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Group Lesson Configuration */}
            {isGroupMode && groupLessonConfigs.length === 0 && formData.selectedClasses.length > 0 && (
              <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 text-sm mb-4">
                <div className="font-semibold text-yellow-800 dark:text-yellow-200">No groups found</div>
                <p className="text-yellow-700 dark:text-yellow-300">
                  The selected classes do not have any groups assigned. Please ensure groups are created for these classes.
                </p>
              </div>
            )}

            {groupLessonConfigs.length > 0 && (
              <div className="space-y-3 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
                <div className="flex items-center gap-2">
                  <Label className="text-base font-semibold">Assign Lessons to Groups (Optional)</Label>
                  <p className="text-sm text-muted-foreground">
                    Select groups to assign specific teachers, subjects, or rooms
                  </p>
                </div>

                <div className="space-y-3">
                  {groupLessonConfigs.map((groupConfig) => (
                    <div key={groupConfig.groupId} className="p-3 border rounded-lg bg-white dark:bg-slate-900">
                      {/* Group Checkbox */}
                      <div className="flex items-center gap-3 mb-3">
                        <Checkbox
                          id={`group-${groupConfig.groupId}`}
                          checked={groupConfig.isSelected}
                          onCheckedChange={() => handleGroupToggle(groupConfig.groupId)}
                        />
                        <Label htmlFor={`group-${groupConfig.groupId}`} className="font-semibold cursor-pointer">
                          {groupConfig.groupName}
                        </Label>
                      </div>

                      {/* Group Details - Only show if selected */}
                      {groupConfig.isSelected && (
                        <div className="ml-6 space-y-3">
                          {/* Teacher Selection for Group */}
                          <div className="space-y-1">
                            <Label htmlFor={`group-teacher-${groupConfig.groupId}`} className="text-sm">
                              Teacher
                            </Label>
                            <Select
                              value={groupConfig.teacherId?.toString() || ''}
                              onValueChange={(value) => {
                                const teacherId = parseInt(value);
                                const teacher = teachers.find(t => t.id === teacherId);
                                handleGroupTeacherChange(groupConfig.groupId, teacherId, teacher?.fullName);
                              }}
                            >
                              <SelectTrigger id={`group-teacher-${groupConfig.groupId}`} className="text-sm">
                                <SelectValue placeholder="Select teacher" />
                              </SelectTrigger>
                              <SelectContent>
                                {teachers.map((teacher: any) => (
                                  <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                    {teacher.fullName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Rooms Selection for Group */}
                          <div className="space-y-1">
                            <Label className="text-sm">Rooms</Label>
                            {groupConfig.roomIds.length > 0 && (
                              <div className="flex flex-wrap gap-2 p-2 border rounded bg-muted/50">
                                {groupConfig.roomIds.map((roomId) => {
                                  const room = rooms.find(r => r.id === roomId);
                                  return (
                                    <Badge key={roomId} variant="secondary" className="flex items-center gap-1 px-2 py-0.5 text-xs">
                                      {room?.name}
                                      <button
                                        type="button"
                                        onClick={() => removeGroupRoom(groupConfig.groupId, roomId)}
                                        className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0"
                                      >
                                        <X className="h-2.5 w-2.5" />
                                      </button>
                                    </Badge>
                                  );
                                })}
                              </div>
                            )}
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button type="button" variant="outline" size="sm" className="w-full text-xs">
                                  {groupConfig.roomIds.length > 0 ? 'Edit rooms' : 'Add rooms'}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-48 p-0" align="start">
                                <Command>
                                  <CommandInput placeholder="Search rooms..." />
                                  <CommandList>
                                    <CommandEmpty>No rooms found.</CommandEmpty>
                                    <CommandGroup>
                                      {rooms.map((room: any) => (
                                        <CommandItem
                                          key={room.id}
                                          onSelect={() => handleGroupRoomToggle(groupConfig.groupId, room.id)}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              groupConfig.roomIds.includes(room.id)
                                                ? "opacity-100" : "opacity-0"
                                            )}
                                          />
                                          {room.name}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                isGroupMode
                  ? groupLessonConfigs.filter(g => g.isSelected).length === 0
                  : (!formData.subject || formData.selectedClasses.length === 0 || !formData.selectedTeacherId)
              }
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              Save Lesson
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog >
  );
}