/**
 * TimetableToolbar Component
 * 
 * Header toolbar with view mode, display options, filters, and actions
 * 
 * @module components/timetable/TimetableToolbar
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import {
    FileDown,
    Zap,
    ArrowLeft,
    User,
    DoorOpen,
    BookOpen,
    Filter,
    Users,
    Building2,
    Grid3x3,
} from 'lucide-react';
import { TimetableToolbarProps, ViewMode, FilterBy } from './types';

export function TimetableToolbar({
    viewMode,
    onViewModeChange,
    displayOptions,
    onDisplayOptionsChange,
    filterBy,
    onFilterByChange,
    selectedEntity,
    onSelectedEntityChange,
    allClasses,
    allTeachers,
    allRooms,
    onOptimize,
    onExport,
    onNavigate,
    timetableVersion,
    scheduleIntegrity,
    conflicts,
    unplacedCount,
}: TimetableToolbarProps) {
    const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);

    const handleFilterByChange = (value: FilterBy) => {
        onFilterByChange(value);
        if (value === 'all') {
            onSelectedEntityChange('');
        } else {
            const options =
                value === 'class' ? allClasses : value === 'teacher' ? allTeachers : allRooms;
            onSelectedEntityChange(options[0] || '');
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4 mb-6 sticky top-0 z-10">
            <div className="flex items-center justify-between gap-6">
                {/* Left: Page Title */}
                <div className="flex items-center gap-3">
                    {onNavigate && (
                        <Button variant="ghost" size="icon" onClick={() => onNavigate('timetables')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    )}
                    <h1>Timetable</h1>
                </div>

                {/* Center: View Mode Switcher */}
                <ToggleGroup
                    type="single"
                    value={viewMode}
                    onValueChange={(value) => value && onViewModeChange(value as ViewMode)}
                    className="border rounded-lg bg-gray-50"
                >
                    <ToggleGroupItem value="classes" aria-label="Classes View" className="gap-2 px-4">
                        <Users className="h-4 w-4" />
                        Classes
                    </ToggleGroupItem>
                    <ToggleGroupItem value="teachers" aria-label="Teachers View" className="gap-2 px-4">
                        <User className="h-4 w-4" />
                        Teachers
                    </ToggleGroupItem>
                    <ToggleGroupItem value="rooms" aria-label="Rooms View" className="gap-2 px-4">
                        <Building2 className="h-4 w-4" />
                        Rooms
                    </ToggleGroupItem>
                    <ToggleGroupItem value="compact" aria-label="Compact View" className="gap-2 px-4">
                        <Grid3x3 className="h-4 w-4" />
                        Compact
                    </ToggleGroupItem>
                </ToggleGroup>

                {/* Right: Display Options + Filter + Actions */}
                <div className="flex items-center gap-2">
                    {/* Display Options */}
                    <div className="flex items-center gap-1 mr-2">
                        <Toggle
                            pressed={displayOptions.showSubject}
                            onPressedChange={(pressed) =>
                                onDisplayOptionsChange({ ...displayOptions, showSubject: pressed })
                            }
                            aria-label="Toggle Subject"
                            size="sm"
                            className="h-9 w-9 rounded-full p-0"
                        >
                            <BookOpen className="h-4 w-4" />
                        </Toggle>
                        <Toggle
                            pressed={displayOptions.showTeacher}
                            onPressedChange={(pressed) =>
                                onDisplayOptionsChange({ ...displayOptions, showTeacher: pressed })
                            }
                            aria-label="Toggle Teacher"
                            size="sm"
                            className="h-9 w-9 rounded-full p-0"
                        >
                            <User className="h-4 w-4" />
                        </Toggle>
                        <Toggle
                            pressed={displayOptions.showRoom}
                            onPressedChange={(pressed) =>
                                onDisplayOptionsChange({ ...displayOptions, showRoom: pressed })
                            }
                            aria-label="Toggle Room"
                            size="sm"
                            className="h-9 w-9 rounded-full p-0"
                        >
                            <DoorOpen className="h-4 w-4" />
                        </Toggle>
                    </div>

                    <Separator orientation="vertical" className="h-8" />

                    {/* Filter Button */}
                    <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Filter className="h-4 w-4" />
                                Filter
                                {filterBy !== 'all' && (
                                    <Badge variant="secondary" className="ml-1 h-5 px-1.5">
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
                                        <Select value={filterBy} onValueChange={(v: any) => handleFilterByChange(v)}>
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
                                                    {(filterBy === 'class'
                                                        ? allClasses
                                                        : filterBy === 'teacher'
                                                            ? allTeachers
                                                            : allRooms
                                                    ).map((option) => (
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

                                {/* Statistics */}
                                <div className="space-y-2">
                                    <h4 className="text-xs font-medium text-muted-foreground">Statistics</h4>
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs">Version</span>
                                            <Badge variant="outline" className="text-xs">
                                                v{timetableVersion}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs">Schedule Integrity</span>
                                            <span className="text-xs font-semibold text-green-600">
                                                {scheduleIntegrity}%
                                            </span>
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

                    <Separator orientation="vertical" className="h-8" />

                    {/* Action Buttons */}
                    <Button
                        onClick={onOptimize}
                        size="sm"
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                    >
                        <Zap className="mr-2 h-4 w-4" />
                        Optimize
                    </Button>
                    <Button variant="outline" onClick={onExport} size="sm">
                        <FileDown className="mr-2 h-4 w-4" />
                        Print / PDF
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default TimetableToolbar;
