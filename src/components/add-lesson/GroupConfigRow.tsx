import React from 'react';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { MultiSelectCombobox } from './MultiSelectCombobox';
import { GroupLessonConfig } from './types';

interface GroupConfigRowProps {
  config: GroupLessonConfig;
  teachers: any[];
  rooms: any[];
  onToggle: (groupId: number) => void;
  onTeacherChange: (groupId: number, teacherId: number | null, teacherName?: string) => void;
  onRoomToggle: (groupId: number, roomId: number) => void;
  onRoomRemove: (groupId: number, roomId: number) => void;
}

export function GroupConfigRow({
  config,
  teachers,
  rooms,
  onToggle,
  onTeacherChange,
  onRoomToggle,
  onRoomRemove,
}: GroupConfigRowProps) {
  const teacherFieldId = `group-teacher-${config.groupId}`;

  return (
    <div className="p-3 border rounded-lg bg-white dark:bg-slate-900">
      <div className="flex items-center gap-3 mb-3">
        <Checkbox
          id={`group-${config.groupId}`}
          checked={config.isSelected}
          onCheckedChange={() => onToggle(config.groupId)}
        />
        <Label htmlFor={`group-${config.groupId}`} className="font-semibold cursor-pointer">
          {config.groupName}
        </Label>
      </div>

      {config.isSelected && (
        <div className="ml-6 space-y-3">
          <div className="space-y-1">
            <Label htmlFor={teacherFieldId} className="text-sm">
              Teacher
            </Label>
            <Select
              value={config.teacherId?.toString() || ''}
              onValueChange={(value) => {
                const teacherId = parseInt(value);
                const teacher = teachers.find((t) => t.id === teacherId);
                onTeacherChange(config.groupId, teacherId, teacher?.fullName);
              }}
            >
              <SelectTrigger id={teacherFieldId} className="text-sm">
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

          <div className="space-y-1">
            <Label className="text-sm">Rooms</Label>
            <MultiSelectCombobox
              items={rooms}
              selectedIds={config.roomIds}
              onToggle={(roomId) => onRoomToggle(config.groupId, roomId)}
              onRemove={(roomId) => onRoomRemove(config.groupId, roomId)}
              placeholder="Add rooms"
              triggerLabel={(count) => (count > 0 ? 'Edit rooms' : 'Add rooms')}
              searchPlaceholder="Search rooms..."
              emptyMessage="No rooms found."
              size="sm"
              popoverWidth="w-48"
            />
          </div>
        </div>
      )}
    </div>
  );
}
