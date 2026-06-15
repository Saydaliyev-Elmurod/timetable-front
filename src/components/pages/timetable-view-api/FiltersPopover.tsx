import React from 'react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { Separator } from '../../ui/separator';
import { Filter } from 'lucide-react';

export type FilterBy = 'all' | 'class' | 'teacher' | 'room';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  filterBy: FilterBy;
  selectedEntity: string;
  onFilterByChange: (v: FilterBy) => void;
  onSelectedEntityChange: (v: string) => void;
  allClasses: string[];
  allTeachers: string[];
  allRooms: string[];
  // Stats
  timetableVersion: number;
  scheduleIntegrity: number;
  conflicts: number;
  unplacedCount: number;
}

export function FiltersPopover({
  open,
  onOpenChange,
  filterBy,
  selectedEntity,
  onFilterByChange,
  onSelectedEntityChange,
  allClasses,
  allTeachers,
  allRooms,
  timetableVersion,
  scheduleIntegrity,
  conflicts,
  unplacedCount,
}: Props) {
  const entityOptions =
    filterBy === 'class' ? allClasses : filterBy === 'teacher' ? allTeachers : allRooms;

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-gray-200 bg-white text-gray-700 hover:bg-gray-50 h-8"
        >
          <Filter className="h-4 w-4" />
          Filter
          {filterBy !== 'all' && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 bg-indigo-100 text-indigo-700">
              1
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-3">Filters</h4>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs">Filter By</Label>
              <Select
                value={filterBy}
                onValueChange={(value: any) => {
                  onFilterByChange(value);
                  if (value === 'all') {
                    onSelectedEntityChange('');
                  } else {
                    const options =
                      value === 'class' ? allClasses : value === 'teacher' ? allTeachers : allRooms;
                    onSelectedEntityChange(options[0] || '');
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="class">By Class</SelectItem>
                  <SelectItem value="teacher">By Teacher</SelectItem>
                  <SelectItem value="room">By Room</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filterBy !== 'all' && (
              <div className="space-y-2">
                <Label className="text-xs">
                  Select {filterBy === 'class' ? 'Class' : filterBy === 'teacher' ? 'Teacher' : 'Room'}
                </Label>
                <Select value={selectedEntity} onValueChange={onSelectedEntityChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {entityOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">Statistics</h4>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs">Version</span>
                <Badge variant="outline" className="text-xs">
                  v{timetableVersion}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs">Schedule Integrity</span>
                <span className="text-xs font-semibold text-green-600">{scheduleIntegrity}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs">Conflicts</span>
                <Badge variant={conflicts > 0 ? 'destructive' : 'secondary'} className="h-5 text-xs">
                  {conflicts}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs">Unplaced</span>
                <Badge variant="secondary" className="h-5 text-xs">
                  {unplacedCount}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
