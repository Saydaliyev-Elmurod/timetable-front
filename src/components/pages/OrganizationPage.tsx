import React, { useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Switch } from '../ui/switch';
import { 
  Plus, 
  Clock, 
  Coffee, 
  Trash2, 
  GripVertical, 
  Save,
  Building2,
  Calendar,
  Settings
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export default function OrganizationPage() {
  const [organizationData, setOrganizationData] = useState({
    name: 'Lincoln High School',
    description: 'A premier educational institution dedicated to academic excellence and holistic development of students.',
  });

  const [workingDays, setWorkingDays] = useState({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  });

  const [periods, setPeriods] = useState([
    { id: 1, type: 'period', name: 'Period 1', startTime: '08:00', endTime: '08:45' },
    { id: 2, type: 'break', name: 'Morning Break', duration: 15 },
    { id: 3, type: 'period', name: 'Period 2', startTime: '09:00', endTime: '09:45' },
    { id: 4, type: 'period', name: 'Period 3', startTime: '09:45', endTime: '10:30' },
    { id: 5, type: 'break', name: 'Long Break', duration: 30 },
    { id: 6, type: 'period', name: 'Period 4', startTime: '11:00', endTime: '11:45' },
    { id: 7, type: 'period', name: 'Period 5', startTime: '11:45', endTime: '12:30' },
    { id: 8, type: 'break', name: 'Lunch Break', duration: 45 },
    { id: 9, type: 'period', name: 'Period 6', startTime: '13:15', endTime: '14:00' },
    { id: 10, type: 'period', name: 'Period 7', startTime: '14:00', endTime: '14:45' },
  ]);

  const [draggedItem, setDraggedItem] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];

  const updateOrganizationData = useCallback((field, value) => {
    setOrganizationData(prev => ({ ...prev, [field]: value }));
    setUnsavedChanges(true);
  }, []);

  const toggleWorkingDay = useCallback((day) => {
    setWorkingDays(prev => ({ ...prev, [day]: !prev[day] }));
    setUnsavedChanges(true);
  }, []);

  const selectAllDays = useCallback(() => {
    const allSelected = Object.values(workingDays).every(day => day);
    const newValue = !allSelected;
    const newWorkingDays = {};
    days.forEach(day => {
      newWorkingDays[day.key] = newValue;
    });
    setWorkingDays(newWorkingDays);
    setUnsavedChanges(true);
  }, [workingDays, days]);

  const addPeriod = useCallback(() => {
    const newPeriod = {
      id: Math.max(...periods.map(p => p.id)) + 1,
      type: 'period',
      name: `Period ${periods.filter(p => p.type === 'period').length + 1}`,
      startTime: '15:00',
      endTime: '15:45'
    };
    setPeriods(prev => [...prev, newPeriod]);
    setUnsavedChanges(true);
  }, [periods]);

  const addBreak = useCallback((afterIndex) => {
    const newBreak = {
      id: Math.max(...periods.map(p => p.id)) + 1,
      type: 'break',
      name: 'Break',
      duration: 15
    };
    const newPeriods = [...periods];
    newPeriods.splice(afterIndex + 1, 0, newBreak);
    setPeriods(newPeriods);
    setUnsavedChanges(true);
  }, [periods]);

  const updatePeriod = useCallback((id, field, value) => {
    setPeriods(prev => prev.map(period => 
      period.id === id ? { ...period, [field]: value } : period
    ));
    setUnsavedChanges(true);
  }, []);

  const deletePeriod = useCallback((id) => {
    setPeriods(prev => prev.filter(period => period.id !== id));
    setUnsavedChanges(true);
  }, []);

  const handleDragStart = useCallback((e, period) => {
    setDraggedItem(period);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e, targetPeriod) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetPeriod.id) return;

    const draggedIndex = periods.findIndex(p => p.id === draggedItem.id);
    const targetIndex = periods.findIndex(p => p.id === targetPeriod.id);

    const newPeriods = [...periods];
    newPeriods.splice(draggedIndex, 1);
    newPeriods.splice(targetIndex, 0, draggedItem);

    setPeriods(newPeriods);
    setDraggedItem(null);
    setUnsavedChanges(true);
  }, [draggedItem, periods]);

  const saveChanges = useCallback(() => {
    // Simulate saving to backend
    setTimeout(() => {
      setUnsavedChanges(false);
      toast('Organization settings saved successfully!', {
        description: 'All changes have been applied.',
        className: 'border-green-200 bg-green-50 text-green-800',
      });
    }, 500);
  }, []);

  const selectedDaysCount = Object.values(workingDays).filter(Boolean).length;
  const allDaysSelected = selectedDaysCount === days.length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Organization Settings
          </h2>
          <p className="text-muted-foreground">Manage your school organization details and configurations</p>
        </div>
        <Button 
          onClick={saveChanges} 
          disabled={!unsavedChanges}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>

      {unsavedChanges && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-2">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
          <span className="text-amber-800">You have unsaved changes</span>
        </div>
      )}

      {/* Organization Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Information
          </CardTitle>
          <CardDescription>Basic information about your educational institution</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="orgName">Organization Name</Label>
            <Input
              id="orgName"
              placeholder="Enter organization name..."
              value={organizationData.name}
              onChange={(e) => updateOrganizationData('name', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="orgDescription">Description</Label>
            <Textarea
              id="orgDescription"
              placeholder="Enter organization description..."
              value={organizationData.description}
              onChange={(e) => updateOrganizationData('description', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Working Days Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            School Working Days
          </CardTitle>
          <CardDescription>Configure which days of the week your school operates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {selectedDaysCount} of {days.length} days selected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={selectAllDays}
            >
              {allDaysSelected ? 'Clear All' : 'Select All'}
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {days.map((day) => (
              <div
                key={day.key}
                className={`flex items-center space-x-2 p-3 rounded-lg border transition-colors ${
                  workingDays[day.key]
                    ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                    : 'bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700'
                }`}
              >
                <Checkbox
                  id={day.key}
                  checked={workingDays[day.key]}
                  onCheckedChange={() => toggleWorkingDay(day.key)}
                />
                <Label
                  htmlFor={day.key}
                  className={`cursor-pointer ${
                    workingDays[day.key] ? 'text-green-800 dark:text-green-200' : ''
                  }`}
                >
                  {day.label}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Class Time Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Class Time Management
          </CardTitle>
          <CardDescription>Configure daily periods and breaks with precise timing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {periods.filter(p => p.type === 'period').length} periods, {periods.filter(p => p.type === 'break').length} breaks
            </span>
            <Button
              variant="outline"
              onClick={addPeriod}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Period
            </Button>
          </div>

          <div className="space-y-3">
            {periods.map((period, index) => (
              <div
                key={period.id}
                draggable
                onDragStart={(e) => handleDragStart(e, period)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, period)}
                className={`group relative p-4 rounded-lg border-2 border-dashed transition-all cursor-move ${
                  period.type === 'period'
                    ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
                    : 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                  
                  {period.type === 'period' ? (
                    <>
                      <Clock className="h-4 w-4 text-blue-600" />
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                        <Input
                          placeholder="Period name"
                          value={period.name}
                          onChange={(e) => updatePeriod(period.id, 'name', e.target.value)}
                          className="bg-white dark:bg-gray-900"
                        />
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground">Start:</Label>
                          <Input
                            type="time"
                            value={period.startTime}
                            onChange={(e) => updatePeriod(period.id, 'startTime', e.target.value)}
                            className="bg-white dark:bg-gray-900"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground">End:</Label>
                          <Input
                            type="time"
                            value={period.endTime}
                            onChange={(e) => updatePeriod(period.id, 'endTime', e.target.value)}
                            className="bg-white dark:bg-gray-900"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addBreak(index)}
                            className="text-orange-600 border-orange-200 hover:bg-orange-50"
                          >
                            <Coffee className="mr-1 h-3 w-3" />
                            Add Break
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deletePeriod(period.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <Coffee className="h-4 w-4 text-orange-600" />
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                        <Input
                          placeholder="Break name"
                          value={period.name}
                          onChange={(e) => updatePeriod(period.id, 'name', e.target.value)}
                          className="bg-white dark:bg-gray-900"
                        />
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground">Duration:</Label>
                          <Input
                            type="number"
                            min="5"
                            max="120"
                            value={period.duration}
                            onChange={(e) => updatePeriod(period.id, 'duration', parseInt(e.target.value))}
                            className="bg-white dark:bg-gray-900"
                          />
                          <span className="text-xs text-muted-foreground">minutes</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deletePeriod(period.id)}
                          className="text-red-600 hover:bg-red-50 justify-self-end"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {periods.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No periods configured yet</p>
              <p className="text-sm">Click "Add Period" to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}