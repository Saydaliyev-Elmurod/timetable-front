import React from 'react';
import {
  ArrowLeft,
  BookOpen,
  Building2,
  DoorOpen,
  FileDown,
  Grid3x3,
  Loader2,
  Maximize2,
  Minimize2,
  Redo2,
  Save,
  Undo2,
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
  // Fullscreen
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  // Tahrirlash (undo/redo/save)
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isDirty: boolean;
  isSaving: boolean;
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
  isFullscreen,
  onToggleFullscreen,
  onUndo,
  onRedo,
  onSave,
  canUndo,
  canRedo,
  isDirty,
  isSaving,
}: Props) {
  return (
    // Two-row responsive bar. Each row is its own wrap context and each control
    // cluster is `flex-wrap` + `min-w-0`, so nothing can overflow its row and
    // overlap a neighbour — clusters drop to the next line instead.
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-4 py-2 mb-2 sticky top-0 z-20">
      <div className="flex flex-col gap-2">
        {/* Row 1 — identity (left) + primary actions (right) */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
          <div className="flex items-center gap-3 min-w-0">
            {onNavigate && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onNavigate('timetables')}
                className="rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 shrink-0 h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <h1 className="text-lg font-bold text-gray-900 tracking-tight truncate">
              {timetableMeta?.name || 'Dars Jadvali'}
            </h1>
            {timetableMeta && (
              <TimetableMetaBadges meta={timetableMeta} scheduledFallback={scheduledCount} />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={onOptimize}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-8"
            >
              <Zap className="mr-1.5 h-3.5 w-3.5" />
              Optimize
            </Button>
            <Button
              variant="outline"
              onClick={onExport}
              size="sm"
              className="border-gray-200 bg-white text-gray-700 hover:bg-gray-50 h-8"
            >
              <FileDown className="mr-1.5 h-3.5 w-3.5" />
              Print / PDF
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onToggleFullscreen}
              title={isFullscreen ? "To'liq ekrandan chiqish" : "To'liq ekran"}
              aria-pressed={isFullscreen}
              className="h-8 w-8 rounded-lg border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        {/* Row 2 — view mode (left) + display/filter/edit controls (right) */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => value && onViewModeChange(value as ViewMode)}
            className="border rounded-lg bg-gray-50 flex-wrap h-8"
          >
            <ToggleGroupItem value="classes" aria-label="Classes View" className="gap-1.5 px-3 sm:px-4 h-7 text-xs">
              <Users className="h-3.5 w-3.5" /> Classes
            </ToggleGroupItem>
            <ToggleGroupItem value="teachers" aria-label="Teachers View" className="gap-1.5 px-3 sm:px-4 h-7 text-xs">
              <User className="h-3.5 w-3.5" /> Teachers
            </ToggleGroupItem>
            <ToggleGroupItem value="rooms" aria-label="Rooms View" className="gap-1.5 px-3 sm:px-4 h-7 text-xs">
              <Building2 className="h-3.5 w-3.5" /> Rooms
            </ToggleGroupItem>
            <ToggleGroupItem value="compact" aria-label="Compact View" className="gap-1.5 px-3 sm:px-4 h-7 text-xs">
              <Grid3x3 className="h-3.5 w-3.5" /> Compact
            </ToggleGroupItem>
          </ToggleGroup>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <Toggle
                pressed={displayOptions.showSubject}
                onPressedChange={(pressed) => onDisplayOptionsChange((p) => ({ ...p, showSubject: pressed }))}
                aria-label="Toggle Subject"
                size="sm"
                className="h-8 w-8 rounded-full p-0"
              >
                <BookOpen className="h-3.5 w-3.5" />
              </Toggle>
              <Toggle
                pressed={displayOptions.showTeacher}
                onPressedChange={(pressed) => onDisplayOptionsChange((p) => ({ ...p, showTeacher: pressed }))}
                aria-label="Toggle Teacher"
                size="sm"
                className="h-8 w-8 rounded-full p-0"
              >
                <User className="h-3.5 w-3.5" />
              </Toggle>
              <Toggle
                pressed={displayOptions.showRoom}
                onPressedChange={(pressed) => onDisplayOptionsChange((p) => ({ ...p, showRoom: pressed }))}
                aria-label="Toggle Room"
                size="sm"
                className="h-8 w-8 rounded-full p-0"
              >
                <DoorOpen className="h-3.5 w-3.5" />
              </Toggle>
            </div>

            <Separator orientation="vertical" className="h-6" />

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

            <Separator orientation="vertical" className="h-6" />

            {/* Undo / Redo / Save */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={onUndo}
                disabled={!canUndo || isSaving}
                title="Bekor qilish (Undo)"
                className="h-8 w-8 rounded-lg border-gray-200"
              >
                <Undo2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={onRedo}
                disabled={!canRedo || isSaving}
                title="Qaytarish (Redo)"
                className="h-8 w-8 rounded-lg border-gray-200"
              >
                <Redo2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                onClick={onSave}
                size="sm"
                disabled={!isDirty || isSaving}
                title="Saqlash"
                className={
                  (isDirty
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-500') + ' h-8'
                }
              >
                {isSaving ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                )}
                {isSaving ? 'Saqlanmoqda' : isDirty ? 'Saqlash *' : 'Saqlangan'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
