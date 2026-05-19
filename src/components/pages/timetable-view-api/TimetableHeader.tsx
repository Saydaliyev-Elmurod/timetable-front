import React from 'react';
import {
  ArrowLeft,
  BookOpen,
  Building2,
  DoorOpen,
  FileDown,
  Grid3x3,
  User,
  Users,
  Zap,
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Separator } from '../../ui/separator';
import { Toggle } from '../../ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '../../ui/toggle-group';
import { DisplayOptions, TimetableMeta } from '../timetable-view/types';
import { TimetableMetaBadges } from './TimetableMetaBadges';
import { FilterBy, FiltersPopover } from './FiltersPopover';

export type ViewMode = 'classes' | 'teachers' | 'rooms' | 'compact';

interface Props {
  // Navigation
  onNavigate?: (page: string) => void;
  // Meta + title
  timetableMeta: TimetableMeta | null;
  scheduledCount: number;
  // View mode
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  // Display toggles
  displayOptions: DisplayOptions;
  onDisplayOptionsChange: React.Dispatch<React.SetStateAction<DisplayOptions>>;
  // Filter
  filterPopoverOpen: boolean;
  onFilterPopoverOpenChange: (v: boolean) => void;
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
  // Actions
  onOptimize: () => void;
  onExport: () => void;
}

export function TimetableHeader({
  onNavigate,
  timetableMeta,
  scheduledCount,
  viewMode,
  onViewModeChange,
  displayOptions,
  onDisplayOptionsChange,
  filterPopoverOpen,
  onFilterPopoverOpenChange,
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
  onOptimize,
  onExport,
}: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 px-6 py-4 mb-6 sticky top-0 z-10">
      <div className="flex items-center justify-between gap-6">
        {/* Left: title + badges */}
        <div className="flex items-center gap-4">
          {onNavigate && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate('timetables')}
              className="rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              {timetableMeta?.name || 'Dars Jadvali'}
            </h1>
          </div>
          {timetableMeta && (
            <TimetableMetaBadges meta={timetableMeta} scheduledFallback={scheduledCount} />
          )}
        </div>

        {/* Center: view mode toggle */}
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(value) => value && onViewModeChange(value as ViewMode)}
          className="border rounded-lg bg-gray-50"
        >
          <ToggleGroupItem value="classes" aria-label="Classes View" className="gap-2 px-4">
            <Users className="h-4 w-4" /> Classes
          </ToggleGroupItem>
          <ToggleGroupItem value="teachers" aria-label="Teachers View" className="gap-2 px-4">
            <User className="h-4 w-4" /> Teachers
          </ToggleGroupItem>
          <ToggleGroupItem value="rooms" aria-label="Rooms View" className="gap-2 px-4">
            <Building2 className="h-4 w-4" /> Rooms
          </ToggleGroupItem>
          <ToggleGroupItem value="compact" aria-label="Compact View" className="gap-2 px-4">
            <Grid3x3 className="h-4 w-4" /> Compact
          </ToggleGroupItem>
        </ToggleGroup>

        {/* Right: display toggles + filter + actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 mr-2">
            <Toggle
              pressed={displayOptions.showSubject}
              onPressedChange={(pressed) => onDisplayOptionsChange((p) => ({ ...p, showSubject: pressed }))}
              aria-label="Toggle Subject"
              size="sm"
              className="h-9 w-9 rounded-full p-0"
            >
              <BookOpen className="h-4 w-4" />
            </Toggle>
            <Toggle
              pressed={displayOptions.showTeacher}
              onPressedChange={(pressed) => onDisplayOptionsChange((p) => ({ ...p, showTeacher: pressed }))}
              aria-label="Toggle Teacher"
              size="sm"
              className="h-9 w-9 rounded-full p-0"
            >
              <User className="h-4 w-4" />
            </Toggle>
            <Toggle
              pressed={displayOptions.showRoom}
              onPressedChange={(pressed) => onDisplayOptionsChange((p) => ({ ...p, showRoom: pressed }))}
              aria-label="Toggle Room"
              size="sm"
              className="h-9 w-9 rounded-full p-0"
            >
              <DoorOpen className="h-4 w-4" />
            </Toggle>
          </div>

          <Separator orientation="vertical" className="h-8" />

          <FiltersPopover
            open={filterPopoverOpen}
            onOpenChange={onFilterPopoverOpenChange}
            filterBy={filterBy}
            selectedEntity={selectedEntity}
            onFilterByChange={onFilterByChange}
            onSelectedEntityChange={onSelectedEntityChange}
            allClasses={allClasses}
            allTeachers={allTeachers}
            allRooms={allRooms}
            timetableVersion={timetableVersion}
            scheduleIntegrity={scheduleIntegrity}
            conflicts={conflicts}
            unplacedCount={unplacedCount}
          />

          <Separator orientation="vertical" className="h-8" />

          <Button
            onClick={onOptimize}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
          >
            <Zap className="mr-2 h-4 w-4" />
            Optimize
          </Button>
          <Button
            variant="outline"
            onClick={onExport}
            size="sm"
            className="border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
          >
            <FileDown className="mr-2 h-4 w-4" />
            Print / PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
