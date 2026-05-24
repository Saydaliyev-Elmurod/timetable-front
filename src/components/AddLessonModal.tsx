import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
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
  Alert,
  AlertDescription,
  AlertTitle,
} from './ui/alert';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n/index';
import { GroupLessonDetail } from '@/types/api';
import {
  GroupLessonConfig,
  AddLessonFormData,
  INITIAL_FORM_DATA,
} from './add-lesson/types';
import { useAddLessonData } from './add-lesson/useAddLessonData';
import { MultiSelectCombobox } from './add-lesson/MultiSelectCombobox';
import { GroupConfigRow } from './add-lesson/GroupConfigRow';

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
  const { teachers, subjects, classes, rooms } = useAddLessonData(open);

  const [formData, setFormData] = useState<AddLessonFormData>(INITIAL_FORM_DATA);

  const [isGroupMode, setIsGroupMode] = useState(false);
  const [groupLessonConfigs, setGroupLessonConfigs] = useState<GroupLessonConfig[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);

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
                    subjectId: detail.subject?.id || null,
                    subjectName: detail.subject?.name || '',
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
        setFormData(INITIAL_FORM_DATA);
        setIsGroupMode(false);
        setGroupLessonConfigs([]);
        setConflicts([]);
      }
    }
  }, [open, editingLesson, classes, teachers]); // Depend on classes/teachers to ensure we can map IDs

  // Sync group configurations whenever selected classes change.
  // Uses a ref to read the latest configs without triggering the effect on every config edit
  // (which would create an infinite loop).
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
            subjectId: null,
            subjectName: '',
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

  const removeRoom = (roomId: number) => {
    setFormData(prev => ({
      ...prev,
      roomIds: prev.roomIds.filter(r => r !== roomId)
    }));
  };

  const toggleRoom = (roomId: number) => {
    setFormData(prev => ({
      ...prev,
      roomIds: prev.roomIds.includes(roomId)
        ? prev.roomIds.filter(r => r !== roomId)
        : [...prev.roomIds, roomId]
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

    // Subject is common to both modes (shared by all groups in group mode).
    if (!formData.subject || formData.selectedClasses.length === 0) {
      toast.error('Fan va sinf(lar) tanlang');
      return;
    }

    if (isGroupMode) {
      // Group Mode Validation — each selected group needs a teacher (subject is shared).
      const selectedGroups = groupLessonConfigs.filter(g => g.isSelected);
      if (selectedGroups.length === 0) {
        toast.error('Kamida bitta guruh tanlang');
        return;
      }
      if (selectedGroups.some(g => !g.teacherId)) {
        toast.error("Har bir tanlangan guruhga o'qituvchi tayinlang");
        return;
      }
    } else {
      // Regular Mode Validation
      if (!formData.selectedTeacherId) {
        toast.error("O'qituvchi tanlang");
        return;
      }
    }

    const commonSubjectId = parseInt(formData.subject);
    const selectedGroups = groupLessonConfigs.filter(g => g.isSelected);

    // All groups share the common class subject.
    const groupDetails: GroupLessonDetail[] = selectedGroups.map(g => ({
      groupId: g.groupId,
      teacherId: g.teacherId!,
      subjectId: commonSubjectId,
      roomIds: g.roomIds
    }));

    // map formData.frequency to API enum format
    const frequencyUpper = (formData.frequency || 'WEEKLY').toUpperCase();

    // Top-level teacherId still required by the request shape; in group mode use
    // the first group's teacher as the nominal main teacher.
    const firstGroup = groupDetails.length > 0 ? groupDetails[0] : null;

    const lessonData = {
      // Direct mappings
      classId: formData.selectedClasses,
      roomIds: formData.roomIds,
      lessonCount: formData.lessonsPerWeek,

      // Conditional mappings based on mode
      groups: isGroupMode ? groupDetails : undefined,

      // Subject is the common class subject in both modes.
      subjectId: commonSubjectId,

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[95vw] max-h-[92vh] overflow-y-auto">
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
              <MultiSelectCombobox
                items={classes}
                selectedIds={formData.selectedClasses}
                onToggle={handleClassToggle}
                onRemove={removeClass}
                placeholder="Select classes..."
                triggerLabel={(count) =>
                  count > 0
                    ? `${count} class${count !== 1 ? 'es' : ''} selected`
                    : 'Select classes...'
                }
                searchPlaceholder="Search classes..."
                emptyMessage="No classes found."
              />
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

            {/* Subject Selection — common for the whole class.
                In group mode both groups teach the SAME subject. */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              {isGroupMode && (
                <p className="text-sm text-muted-foreground">
                  Fan butun sinf uchun bitta — har ikkala guruh ham shu fanni o'tadi
                </p>
              )}
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

            {/* Main Teacher — standard mode only (each group has its own teacher) */}
            {!isGroupMode && (
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
                <MultiSelectCombobox
                  items={rooms}
                  selectedIds={formData.roomIds}
                  onToggle={toggleRoom}
                  onRemove={removeRoom}
                  placeholder="Select rooms..."
                  triggerLabel={(count) =>
                    count > 0
                      ? `${count} room${count !== 1 ? 's' : ''} selected`
                      : 'Select rooms...'
                  }
                  searchPlaceholder="Search rooms..."
                  emptyMessage="No rooms found."
                />
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
                    <GroupConfigRow
                      key={groupConfig.groupId}
                      config={groupConfig}
                      teachers={teachers}
                      rooms={rooms}
                      onToggle={handleGroupToggle}
                      onTeacherChange={handleGroupTeacherChange}
                      onRoomToggle={handleGroupRoomToggle}
                      onRoomRemove={removeGroupRoom}
                    />
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
                !formData.subject || formData.selectedClasses.length === 0 || (
                  isGroupMode
                    ? groupLessonConfigs.filter(g => g.isSelected).length === 0
                    : !formData.selectedTeacherId
                )
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