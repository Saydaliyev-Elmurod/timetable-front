import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { organizationApi, CompanyResponse, LessonPeriod as ApiLessonPeriod } from '@/api/organizationApi';
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
import { Skeleton } from '../ui/skeleton';
import { 
  Plus, 
  Clock, 
  Coffee, 
  Trash2, 
  GripVertical, 
  Save,
  Building2,
  Calendar
} from 'lucide-react';

const LoadingSkeleton = () => {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="grid gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-24" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function OrganizationPage() {
  const { t } = useTranslation();
  const [organizationData, setOrganizationData] = useState({
    name: '',
    description: '',
  });

  const [workingDays, setWorkingDays] = useState({
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false,
  });

  const [periods, setPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<any | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchOrganizationData = async () => {
      try {
        setLoading(true);
        const data: CompanyResponse = await organizationApi.get();
        setOrganizationData({ 
          name: data.name || '', 
          description: data.description || '' 
        });

        const initialWorkingDays = {
          monday: false,
          tuesday: false,
          wednesday: false,
          thursday: false,
          friday: false,
          saturday: false,
          sunday: false,
        };
        data.daysOfWeek.forEach(day => {
          initialWorkingDays[day.toLowerCase()] = true;
        });
        setWorkingDays(initialWorkingDays);

        const newPeriods = data.periods.map((p, index) => ({
          id: index + 1,
          type: p.isBreak ? 'break' : 'period',
          name: p.name,
          startTime: p.startTime,
          endTime: p.endTime,
          duration: p.duration,
        }));
        setPeriods(newPeriods);
      } catch (error) {
        // Error is already handled by the api service with a toast
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizationData();
  }, []);

  const days = [
    { key: 'monday', label: t('organization.days.monday') },
    { key: 'tuesday', label: t('organization.days.tuesday') },
    { key: 'wednesday', label: t('organization.days.wednesday') },
    { key: 'thursday', label: t('organization.days.thursday') },
    { key: 'friday', label: t('organization.days.friday') },
    { key: 'saturday', label: t('organization.days.saturday') },
    { key: 'sunday', label: t('organization.days.sunday') },
  ];

  const updateOrganizationData = useCallback((field: string, value: string) => {
    setOrganizationData(prev => ({ ...prev, [field]: value }));
    setUnsavedChanges(true);
  }, []);

  const toggleWorkingDay = useCallback((day: string) => {
    setWorkingDays(prev => ({ ...prev, [day]: !prev[day] }));
    setUnsavedChanges(true);
  }, []);

  const selectAllDays = useCallback(() => {
    const allSelected = Object.values(workingDays).every(day => day);
    const newValue = !allSelected;
    const newWorkingDays: { [key: string]: boolean } = {};
    days.forEach(day => {
      newWorkingDays[day.key] = newValue;
    });
    setWorkingDays(newWorkingDays);
    setUnsavedChanges(true);
  }, [workingDays, days]);

  const addPeriod = useCallback(() => {
    const newPeriod = {
      id: periods.length > 0 ? Math.max(...periods.map(p => p.id)) + 1 : 1,
      type: 'period',
      name: `${t('organization.period')} ${periods.filter(p => p.type === 'period').length + 1}`,
      startTime: '15:00',
      endTime: '15:45'
    };
    setPeriods(prev => [...prev, newPeriod]);
    setUnsavedChanges(true);
  }, [periods, t]);

  const addBreak = useCallback((afterIndex: number) => {
    const newBreak = {
      id: periods.length > 0 ? Math.max(...periods.map(p => p.id)) + 1 : 1,
      type: 'break',
      name: t('organization.break'),
      duration: 15
    };
    const newPeriods = [...periods];
    newPeriods.splice(afterIndex + 1, 0, newBreak);
    setPeriods(newPeriods);
    setUnsavedChanges(true);
  }, [periods, t]);

  const updatePeriod = useCallback((id: number, field: string, value: string | number) => {
    setPeriods(prev => prev.map(period => 
      period.id === id ? { ...period, [field]: value } : period
    ));
    setUnsavedChanges(true);
  }, []);

  const deletePeriod = useCallback((id: number) => {
    setPeriods(prev => prev.filter(period => period.id !== id));
    setUnsavedChanges(true);
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, period: any) => {
    setDraggedItem(period);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetPeriod: any) => {
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

  const saveChanges = useCallback(async () => {
    setIsSaving(true);
    const daysOfWeek = Object.entries(workingDays)
      .filter(([, value]) => value)
      .map(([key]) => key.toUpperCase());

    const apiPeriods: ApiLessonPeriod[] = periods.map(p => ({
      name: p.name,
      startTime: p.startTime || '00:00',
      endTime: p.endTime || '00:00',
      duration: p.duration || 0,
      isBreak: p.type === 'break',
    }));

    const requestData = {
      ...organizationData,
      daysOfWeek,
      periods: apiPeriods,
    };

    try {
      await organizationApi.update(requestData);
      setUnsavedChanges(false);
    } catch (error) {
      // Error is handled by the api service with a toast
    } finally {
      setIsSaving(false);
    }
  }, [organizationData, workingDays, periods]);

  const selectedDaysCount = Object.values(workingDays).filter(Boolean).length;
  const allDaysSelected = selectedDaysCount === days.length;

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Building2 className="h-6 w-6" />
            {t('organization.title')}
          </h2>
          <p className="text-muted-foreground">{t('organization.description')}</p>
        </div>
        <Button 
          onClick={saveChanges} 
          disabled={!unsavedChanges || isSaving}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {isSaving ? (
            <>
              <Save className="mr-2 h-4 w-4 animate-spin" />
              {t('organization.saving')}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {t('organization.save_changes')}
            </>
          )}
        </Button>
      </div>

      {unsavedChanges && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-2">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
          <span className="text-amber-800">{t('organization.unsaved_changes')}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {t('organization.information_title')}
          </CardTitle>
          <CardDescription>{t('organization.information_description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="orgName">{t('organization.name_label')}</Label>
            <Input
              id="orgName"
              placeholder={t('organization.name_placeholder')}
              value={organizationData.name}
              onChange={(e) => updateOrganizationData('name', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="orgDescription">{t('organization.description_label')}</Label>
            <Textarea
              id="orgDescription"
              placeholder={t('organization.description_placeholder')}
              value={organizationData.description}
              onChange={(e) => updateOrganizationData('description', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('organization.working_days_title')}
          </CardTitle>
          <CardDescription>{t('organization.working_days_description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {t('organization.days_selected', { count: selectedDaysCount, total: days.length })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={selectAllDays}
            >
              {allDaysSelected ? t('organization.clear_all') : t('organization.select_all')}
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t('organization.time_management_title')}
          </CardTitle>
          <CardDescription>{t('organization.time_management_description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {t('organization.periods_and_breaks', { periods: periods.filter(p => p.type === 'period').length, breaks: periods.filter(p => p.type === 'break').length })}
            </span>
            <Button
              variant="outline"
              onClick={addPeriod}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('organization.add_period')}
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
                          placeholder={t('organization.period_name_placeholder')}
                          value={period.name}
                          onChange={(e) => updatePeriod(period.id, 'name', e.target.value)}
                          className="bg-white dark:bg-gray-900"
                        />
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground">{t('organization.start_time')}:</Label>
                          <Input
                            type="time"
                            lang="en-GB"
                            value={period.startTime}
                            onChange={(e) => updatePeriod(period.id, 'startTime', e.target.value)}
                            className="bg-white dark:bg-gray-900"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground">{t('organization.end_time')}:</Label>
                          <Input
                            type="time"
                            lang="en-GB"
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
                            {t('organization.add_break')}
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
                          placeholder={t('organization.break_name_placeholder')}
                          value={period.name}
                          onChange={(e) => updatePeriod(period.id, 'name', e.target.value)}
                          className="bg-white dark:bg-gray-900"
                        />
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground">{t('organization.duration')}:</Label>
                          <Input
                            type="number"
                            min="5"
                            max="120"
                            value={period.duration}
                            onChange={(e) => updatePeriod(period.id, 'duration', parseInt(e.target.value, 10))}
                            className="bg-white dark:bg-gray-900"
                          />
                          <span className="text-xs text-muted-foreground">{t('organization.minutes')}</span>
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
              <p>{t('organization.no_periods_configured')}</p>
              <p className="text-sm">{t('organization.click_add_period')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}