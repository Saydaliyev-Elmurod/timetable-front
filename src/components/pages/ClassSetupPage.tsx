import React, { useState, useCallback } from 'react';
import { Trash2, Plus, Upload, ArrowUpDown, Info, ChevronRight, X, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Badge } from '../ui/badge';
import { toast } from 'sonner@2.0.3';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

interface ClassRow {
  id: string;
  name: string;
  shortName: string;
  teacher: string;
  availability: 'all' | 'timeoff';
  availabilitySchedule?: Record<string, Record<number, boolean>>;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

export default function ClassSetupPage({ onNavigate }) {
  const [showShortNames, setShowShortNames] = useState(true);
  const [classes, setClasses] = useState<ClassRow[]>([
    { id: '1', name: '10th Grade', shortName: '10th', teacher: '', availability: 'all' },
    { id: '2', name: '12th Grade', shortName: '12th', teacher: '', availability: 'all' },
    { id: '3', name: '1-A', shortName: '1-A', teacher: '', availability: 'timeoff', availabilitySchedule: {} },
    { id: '4', name: '1-a', shortName: '1-A', teacher: '', availability: 'all' },
    { id: '5', name: '12 th grade', shortName: '11G', teacher: '', availability: 'all' },
  ]);
  const [selectedClassForAvailability, setSelectedClassForAvailability] = useState<ClassRow | null>(null);
  const [showTips, setShowTips] = useState(true);

  // Mock teachers data
  const teachers = [
    'Mrs. Davis',
    'Mr. Johnson',
    'Ms. Smith',
    'Dr. Brown',
  ];

  const generateShortName = useCallback((name: string) => {
    // Auto-generate short name logic
    if (name.includes('Grade')) {
      const match = name.match(/(\d+)(st|nd|rd|th)?\s*Grade/i);
      if (match) return match[1] + 'G';
    }
    return name.slice(0, 3).toUpperCase();
  }, []);

  const handleClassChange = useCallback((id: string, field: keyof ClassRow, value: string) => {
    setClasses(prev => prev.map(cls => {
      if (cls.id === id) {
        const updated = { ...cls, [field]: value };
        // Auto-update short name if name changes
        if (field === 'name' && !cls.shortName) {
          updated.shortName = generateShortName(value);
        }
        return updated;
      }
      return cls;
    }));
  }, [generateShortName]);

  const handleDeleteClass = useCallback((id: string) => {
    if (classes.length === 1) {
      toast.error('You must have at least one class');
      return;
    }
    setClasses(prev => prev.filter(cls => cls.id !== id));
    toast.success('Class removed');
  }, [classes.length]);

  const handleAddClass = useCallback(() => {
    const newClass: ClassRow = {
      id: Date.now().toString(),
      name: '',
      shortName: '',
      teacher: '',
      availability: 'all',
    };
    setClasses(prev => [...prev, newClass]);
  }, []);

  const handleSortAZ = useCallback(() => {
    setClasses(prev => [...prev].sort((a, b) => a.name.localeCompare(b.name)));
    toast.success('Classes sorted alphabetically');
  }, []);

  const handleBulkImport = useCallback(() => {
    toast.info('Bulk import feature coming soon');
  }, []);

  const handleSaveAndContinue = useCallback(() => {
    // Validate classes
    const emptyNames = classes.filter(cls => !cls.name.trim());
    if (emptyNames.length > 0) {
      toast.error('Please fill in all class names');
      return;
    }
    
    // Check for duplicates
    const names = classes.map(cls => cls.name.toLowerCase());
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
    if (duplicates.length > 0) {
      toast.error('Duplicate class names detected');
      return;
    }

    toast.success('Classes saved successfully!');
    // Navigate to next step or save to database
  }, [classes]);

  const toggleAvailability = useCallback((classRow: ClassRow, day: string, period: number) => {
    if (!classRow.availabilitySchedule) {
      classRow.availabilitySchedule = {};
    }
    if (!classRow.availabilitySchedule[day]) {
      classRow.availabilitySchedule[day] = {};
    }
    
    const isCurrentlyAvailable = classRow.availabilitySchedule[day][period] !== false;
    classRow.availabilitySchedule[day][period] = !isCurrentlyAvailable;
    
    setClasses(prev => prev.map(cls => 
      cls.id === classRow.id ? { ...classRow } : cls
    ));
  }, []);

  const isPeriodAvailable = (classRow: ClassRow | null, day: string, period: number) => {
    if (!classRow || !classRow.availabilitySchedule || !classRow.availabilitySchedule[day]) {
      return true;
    }
    return classRow.availabilitySchedule[day][period] !== false;
  };

  return (
    <div className="flex gap-6 h-full">
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  Classes/Groups
                </CardTitle>
                <CardDescription className="mt-2">
                  Add classes or groups or grades and assign class teachers. You can also set time off for them.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="show-short-names" className="text-sm cursor-pointer">
                  Show Short Names
                </Label>
                <Switch
                  id="show-short-names"
                  checked={showShortNames}
                  onCheckedChange={setShowShortNames}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Table Header */}
              <div className="grid gap-4" style={{ gridTemplateColumns: showShortNames ? '2fr 1.5fr 1.5fr 1.5fr 80px' : '3fr 2fr 2fr 80px' }}>
                <Label className="text-muted-foreground uppercase text-xs">Name</Label>
                {showShortNames && <Label className="text-muted-foreground uppercase text-xs">Short Name</Label>}
                <div className="flex items-center gap-2">
                  <Label className="text-muted-foreground uppercase text-xs">Class Teacher</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Assign class teachers to ensure they get the first period with their class each day</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Label className="text-muted-foreground uppercase text-xs">Availability</Label>
                <Label className="text-muted-foreground uppercase text-xs">Actions</Label>
              </div>

              {/* Class Rows */}
              <div className="space-y-3">
                {classes.map((classRow) => (
                  <div
                    key={classRow.id}
                    className="grid gap-4 items-center p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                    style={{ gridTemplateColumns: showShortNames ? '2fr 1.5fr 1.5fr 1.5fr 80px' : '3fr 2fr 2fr 80px' }}
                  >
                    <Input
                      placeholder="e.g., 10th Grade"
                      value={classRow.name}
                      onChange={(e) => handleClassChange(classRow.id, 'name', e.target.value)}
                      className="bg-background"
                    />
                    {showShortNames && (
                      <Input
                        placeholder="e.g., 10th"
                        value={classRow.shortName}
                        onChange={(e) => handleClassChange(classRow.id, 'shortName', e.target.value)}
                        className="bg-background"
                      />
                    )}
                    <div className="relative">
                      <Select
                        value={classRow.teacher}
                        onValueChange={(value) => handleClassChange(classRow.id, 'teacher', value)}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="..." />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers.map((teacher) => (
                            <SelectItem key={teacher} value={teacher}>
                              {teacher}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Badge variant="secondary" className="absolute -top-2 -right-2 text-xs px-1.5 py-0 h-5 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                        PRO
                      </Badge>
                    </div>
                    <Button
                      variant={classRow.availability === 'timeoff' ? 'destructive' : 'secondary'}
                      size="sm"
                      onClick={() => setSelectedClassForAvailability(classRow)}
                      className="justify-start gap-2"
                    >
                      {classRow.availability === 'all' ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-xs">All Available</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-4 w-4" />
                          <span className="text-xs">Time Off</span>
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClass(classRow.id)}
                      className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleSortAZ}>
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    Sort A-Z
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleBulkImport}>
                    <Upload className="h-4 w-4 mr-2" />
                    Bulk Import
                  </Button>
                  <Button variant="default" size="sm" onClick={handleAddClass}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Class
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => onNavigate?.('classes')}>
            ← Back to Classes
          </Button>
          <Button onClick={handleSaveAndContinue} size="lg">
            Save & Continue →
          </Button>
        </div>
      </div>

      {/* Tips & Tricks Sidebar */}
      {showTips && (
        <Card className="w-80 h-fit sticky top-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Tips & Tricks</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowTips(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
              <div className="flex gap-2">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="h-5 w-5 rounded-full bg-yellow-200 dark:bg-yellow-800 flex items-center justify-center text-yellow-700 dark:text-yellow-300 text-xs">
                    💡
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Class Teacher Feature</h4>
                  <p className="text-xs text-muted-foreground">
                    Optionally assign class teachers (Pro feature) to ensure they get the first period with their class each day.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <div className="flex gap-2">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="h-5 w-5 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center text-blue-700 dark:text-blue-300 text-xs">
                    ℹ️
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Short Names Toggle</h4>
                  <p className="text-xs text-muted-foreground">
                    Use the settings toggle to show/hide short name columns. Short names auto-generate but can be customized.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <div className="flex gap-2">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="h-5 w-5 rounded-full bg-green-200 dark:bg-green-800 flex items-center justify-center text-green-700 dark:text-green-300 text-xs">
                    📅
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Time-Off Management</h4>
                  <p className="text-xs text-muted-foreground">
                    Set availability for classes if some periods are reserved (like lunch, assembly, etc.)
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg">❓</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium">Need help?</h4>
                  <p className="text-xs text-muted-foreground">
                    A timetable assistant will be there to answer your questions.
                  </p>
                </div>
              </div>
              <Button variant="default" className="w-full mt-3">
                Schedule a Call
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Availability Dialog */}
      <Dialog open={!!selectedClassForAvailability} onOpenChange={() => setSelectedClassForAvailability(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedClassForAvailability && (
            <>
              <DialogHeader>
                <DialogTitle>Manage Availability for Class {selectedClassForAvailability.name}</DialogTitle>
                <DialogDescription>
                  Mark periods when <span className="font-medium">Class {selectedClassForAvailability.name}</span> is <span className="font-medium text-destructive">not available</span> for scheduling. Click any cell to toggle availability, or click headers to toggle entire rows/columns.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
            <div className="flex items-center gap-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <Info className="h-5 w-5 text-blue-600" />
              <p className="text-sm text-blue-900 dark:text-blue-100">
                Schedule: <span className="font-medium">Default Schedule</span> (Weekly) • 6 working days • 7 maximum periods
              </p>
            </div>

            <div className="flex items-center gap-6 p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-green-100 dark:bg-green-900 border-2 border-green-500 flex items-center justify-center">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                </div>
                <span className="text-sm">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-red-100 dark:bg-red-900 border-2 border-red-500 flex items-center justify-center">
                  <X className="h-3 w-3 text-red-600" />
                </div>
                <span className="text-sm">Time Off</span>
              </div>
            </div>

            {/* Availability Grid */}
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-3 text-left text-sm font-medium border-r">Period/Day</th>
                      {DAYS.map((day) => (
                        <th key={day} className="p-3 text-center text-sm font-medium border-r last:border-r-0">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PERIODS.map((period) => (
                      <tr key={period} className="border-t">
                        <td className="p-3 font-medium text-sm border-r bg-muted/50">
                          Period {period}
                        </td>
                        {DAYS.map((day) => {
                          const isAvailable = isPeriodAvailable(selectedClassForAvailability, day, period);
                          return (
                            <td
                              key={`${day}-${period}`}
                              className="p-2 text-center border-r last:border-r-0 cursor-pointer hover:bg-accent/50 transition-colors"
                              onClick={() => selectedClassForAvailability && toggleAvailability(selectedClassForAvailability, day, period)}
                            >
                              <div className={`
                                h-12 rounded flex items-center justify-center transition-all
                                ${isAvailable 
                                  ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500 hover:bg-green-200' 
                                  : 'bg-red-100 dark:bg-red-900/30 border-2 border-red-500 hover:bg-red-200'
                                }
                              `}>
                                {isAvailable ? (
                                  <div className="text-center">
                                    <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                                    <span className="text-xs text-green-700 dark:text-green-400">
                                      {(9 + Math.floor((period - 1) * 1.5)).toString().padStart(2, '0')}:00 - {(9 + Math.floor(period * 1.5)).toString().padStart(2, '0')}:45
                                    </span>
                                  </div>
                                ) : (
                                  <div className="text-center">
                                    <X className="h-4 w-4 text-red-600 mx-auto" />
                                    <span className="text-xs text-red-700 dark:text-red-400">
                                      {(9 + Math.floor((period - 1) * 1.5)).toString().padStart(2, '0')}:00 - {(9 + Math.floor(period * 1.5)).toString().padStart(2, '0')}:45
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setSelectedClassForAvailability(null)}>
                Cancel
              </Button>
              <Button onClick={() => {
                const hasTimeOff = selectedClassForAvailability?.availabilitySchedule && 
                  Object.values(selectedClassForAvailability.availabilitySchedule).some(day => 
                    Object.values(day).some(available => available === false)
                  );
                
                setClasses(prev => prev.map(cls => 
                  cls.id === selectedClassForAvailability?.id 
                    ? { ...cls, availability: hasTimeOff ? 'timeoff' : 'all' }
                    : cls
                ));
                setSelectedClassForAvailability(null);
                toast.success('Availability updated');
              }}>
                Save Changes
              </Button>
            </div>
          </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
