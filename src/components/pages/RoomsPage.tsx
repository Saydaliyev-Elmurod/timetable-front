import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from '@/i18n/index';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Plus, Trash2, Upload, Download, Copy, Check, X, HelpCircle, Building2, Users, Settings2, Edit, Calendar, ChevronDown, Loader2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { Switch } from '../ui/switch';

// Import services and types
import {
  RoomService,
  RoomRequest,
  RoomResponse,
  RoomType,
  ROOM_TYPE_DEFINITIONS
} from '@/lib/rooms';
import { TimeSlot } from '@/lib/teachers';
import { SubjectService } from '@/lib/subjects';
import type { PaginatedResponse } from '@/lib/api';

// Using RoomService imported from @/lib/rooms

// Helper function to convert old format to new API format
const convertToTimeSlots = (availability: any): TimeSlot[] => {
  const dayMap: Record<string, string> = {
    monday: 'MONDAY',
    tuesday: 'TUESDAY',
    wednesday: 'WEDNESDAY',
    thursday: 'THURSDAY',
    friday: 'FRIDAY',
    saturday: 'SATURDAY',
    sunday: 'SUNDAY',
  };

  return Object.entries(availability).map(([day, lessons]) => ({
    dayOfWeek: dayMap[day] || day.toUpperCase(),
    lessons: lessons as number[],
  }));
};

// Helper function to convert API format to old format
const convertFromTimeSlots = (timeSlots: TimeSlot[]): any => {
  const availability: any = {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  };

  timeSlots.forEach((slot) => {
    const dayKey = slot.dayOfWeek.toLowerCase();
    availability[dayKey] = slot.lessons;
  });

  return availability;
};

export default function RoomsPage() {
  const { t } = useTranslation();
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0); // API uses 0-based indexing
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [deleteDialogRoom, setDeleteDialogRoom] = useState<RoomResponse | null>(null);
  
  // Inline form state
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [inlineFormData, setInlineFormData] = useState({
    name: '',
    shortName: '',
    type: RoomType.SHARED,
    allowedSubjectIds: [] as number[],
    availability: {
      monday: [1, 2, 3, 4, 5, 6, 7],
      tuesday: [1, 2, 3, 4, 5, 6, 7],
      wednesday: [1, 2, 3, 4, 5, 6, 7],
      thursday: [1, 2, 3, 4, 5, 6, 7],
      friday: [1, 2, 3, 4, 5, 6, 7],
      saturday: [1, 2, 3, 4, 5, 6, 7],
      sunday: [1, 2, 3, 4, 5, 6, 7],
    },
  });
  const [showAvailabilityInForm, setShowAvailabilityInForm] = useState(true);
  
  // Availability view for existing rooms
  const [expandedAvailability, setExpandedAvailability] = useState<number | null>(null);

  type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const periods = [1, 2, 3, 4, 5, 6, 7];

  // Fetch rooms on mount and when pagination changes
  useEffect(() => {
    fetchRooms();
    fetchSubjects();
  }, [currentPage, itemsPerPage]);

  const fetchSubjects = async () => {
    try {
      const data = await SubjectService.getPaginated(0, 1000);
      setAvailableSubjects(data.content);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    }
  };

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      const data = await RoomService.getPaginated(currentPage, itemsPerPage);
      setRooms(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (error) {
      toast.error('Failed to fetch rooms');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRooms = React.useMemo(() => 
    rooms.filter(
      (room) =>
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.shortName.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [rooms, searchQuery]
  );

  const generateShortName = useCallback((fullName: string) => {
    if (!fullName) return '';
    // Take first 4 uppercase letters from the name
    const cleaned = fullName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return cleaned.substring(0, 4);
  }, []);

  const handleAddRoom = () => {
    setShowInlineForm(true);
    setEditingRoomId(null);
    setInlineFormData({
      name: '',
      shortName: '',
      type: RoomType.SHARED,
      allowedSubjectIds: [],
      availability: {
        monday: [1, 2, 3, 4, 5, 6, 7],
        tuesday: [1, 2, 3, 4, 5, 6, 7],
        wednesday: [1, 2, 3, 4, 5, 6, 7],
        thursday: [1, 2, 3, 4, 5, 6, 7],
        friday: [1, 2, 3, 4, 5, 6, 7],
        saturday: [1, 2, 3, 4, 5, 6, 7],
        sunday: [1, 2, 3, 4, 5, 6, 7],
      },
    });
    setShowAvailabilityInForm(false);
  };

  const handleEdit = (room: RoomResponse) => {
    setEditingRoomId(room.id);
    setInlineFormData({
      name: room.name,
      shortName: room.shortName,
      type: room.type || RoomType.SHARED,
      allowedSubjectIds: room.allowedSubjectIds || [],
      availability: convertFromTimeSlots(room.availabilities),
    });
    setShowInlineForm(true);
    setShowAvailabilityInForm(false);
  };

  const handleClone = (room: RoomResponse) => {
    setShowInlineForm(true);
    setEditingRoomId(null);
    setInlineFormData({
      name: `${room.name} (Copy)`,
      shortName: `${room.shortName}-C`,
      type: room.type || RoomType.SHARED,
      allowedSubjectIds: room.allowedSubjectIds || [],
      availability: convertFromTimeSlots(room.availabilities),
    });
    setShowAvailabilityInForm(false);
  };

  const handleSaveInlineForm = async () => {
    if (!inlineFormData.name.trim()) {
      toast.error('Iltimos, xona nomini kiriting');
      return;
    }

    const requestData: RoomRequest = {
      name: inlineFormData.name.trim(),
      shortName: inlineFormData.shortName.trim() || generateShortName(inlineFormData.name.trim()),
      type: inlineFormData.type,
      availabilities: convertToTimeSlots(inlineFormData.availability),
      allowedSubjectIds: inlineFormData.type === RoomType.SPECIAL ? inlineFormData.allowedSubjectIds : undefined,
    };

    try {
      setIsSaving(true);
      if (editingRoomId) {
        await RoomService.update(editingRoomId, requestData);
        toast.success('Xona muvaffaqiyatli yangilandi');
      } else {
        await RoomService.create(requestData);
        toast.success('Xona muvaffaqiyatli qo\'shildi');
      }
      setShowInlineForm(false);
      setShowAvailabilityInForm(false);
      setEditingRoomId(null);
      await fetchRooms();
    } catch (error) {
      toast.error(editingRoomId ? 'Xonani yangilashda xatolik' : 'Xona qo\'shishda xatolik');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelInlineForm = () => {
    setShowInlineForm(false);
    setShowAvailabilityInForm(false);
    setEditingRoomId(null);
  };

  const updateInlineFormField = (field: string, value: any) => {
    setInlineFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'name' && value) {
        updated.shortName = generateShortName(value);
      }
      return updated;
    });
  };

  const toggleInlineAvailability = (day: DayOfWeek, period: number) => {
    setInlineFormData(prev => {
      const dayPeriods = prev.availability[day];
      const newPeriods = dayPeriods.includes(period)
        ? dayPeriods.filter((p: number) => p !== period)
        : [...dayPeriods, period].sort((a, b) => a - b);
      
      return {
        ...prev,
        availability: {
          ...prev.availability,
          [day]: newPeriods
        }
      };
    });
  };

  const toggleInlineDay = (day: DayOfWeek) => {
    const currentPeriods = inlineFormData.availability[day];
    const allSelected = periods.every(p => currentPeriods.includes(p));
    
    setInlineFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: allSelected ? [] : [...periods]
      }
    }));
  };

  const toggleInlinePeriodAcrossDays = (period: number) => {
    const isSelected = days.some(day => inlineFormData.availability[day].includes(period));
    const newAvailability = { ...inlineFormData.availability };
    
    days.forEach(day => {
      if (isSelected) {
        newAvailability[day] = newAvailability[day].filter(p => p !== period);
      } else {
        if (!newAvailability[day].includes(period)) {
          newAvailability[day] = [...newAvailability[day], period].sort((a, b) => a - b);
        }
      }
    });
    
    setInlineFormData(prev => ({
      ...prev,
      availability: newAvailability
    }));
  };

  const selectAllInlineAvailability = () => {
    const newAvailability: any = {};
    days.forEach(day => {
      newAvailability[day] = [...periods];
    });
    
    setInlineFormData(prev => ({
      ...prev,
      availability: newAvailability
    }));
  };

  const clearAllInlineAvailability = () => {
    const newAvailability: any = {};
    days.forEach(day => {
      newAvailability[day] = [];
    });
    
    setInlineFormData(prev => ({
      ...prev,
      availability: newAvailability
    }));
  };

  const handleDelete = (room: RoomResponse) => {
    setDeleteDialogRoom(room);
  };

  const confirmDelete = async () => {
    if (deleteDialogRoom) {
      try {
        await RoomService.delete(deleteDialogRoom.id);
        toast.success('Xona muvaffaqiyatli o\'chirildi');
        setDeleteDialogRoom(null);
        await fetchRooms();
      } catch (error) {
        toast.error('Failed to delete room');
        console.error(error);
      }
    }
  };

  const handleImport = () => {
    setIsImportDialogOpen(true);
  };

  const handleDownloadTemplate = () => {
    toast.success('Shablon muvaffaqiyatli yuklandi');
  };

  const getTotalAvailablePeriods = (availabilities: TimeSlot[]) => {
    return availabilities.reduce((total, slot) => total + slot.lessons.length, 0);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(0);
  };

  return (
    <div className="space-y-4 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2>{t('rooms.title')}</h2>
          <p className="text-muted-foreground">{t('rooms.description')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImport} size="sm">
            <Upload className="mr-2 h-4 w-4" />
            {t('rooms.import')}
          </Button>
          <Button onClick={handleAddRoom} size="sm" className="bg-green-600 hover:bg-green-700">
            <Plus className="mr-2 h-4 w-4" />
            {t('rooms.add_room')}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search rooms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Inline Add/Edit/Clone Form */}
      {showInlineForm && (
        <Card className="border-2 border-green-500 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Xona nomi</Label>
                  <Input
                    placeholder="Masalan: 101-xona"
                    value={inlineFormData.name}
                    onChange={(e) => updateInlineFormField('name', e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label>Qisqa nomi</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Avtomatik yaratiladi"
                      value={inlineFormData.shortName}
                      onChange={(e) => updateInlineFormField('shortName', e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowAvailabilityInForm(!showAvailabilityInForm)}
                      className={`flex-shrink-0 ${showAvailabilityInForm ? 'bg-green-100 border-green-500 text-green-700' : 'border-green-300 text-green-600'}`}
                      title="Mavjudlikni ko'rsatish/yashirish"
                    >
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Room Type Selection */}
              <div className="space-y-2">
                <Label>Xona turi</Label>
                <Select 
                  value={inlineFormData.type} 
                  onValueChange={(value) => updateInlineFormField('type', value as RoomType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={RoomType.SHARED}>
                      {ROOM_TYPE_DEFINITIONS[RoomType.SHARED].label}
                    </SelectItem>
                    <SelectItem value={RoomType.SPECIAL}>
                      {ROOM_TYPE_DEFINITIONS[RoomType.SPECIAL].label}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {ROOM_TYPE_DEFINITIONS[inlineFormData.type].description}
                </p>
              </div>

              {showAvailabilityInForm && (
                <div className="bg-white dark:bg-gray-950 rounded-lg border border-green-300 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Room Availability</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAllInlineAvailability}
                        className="h-7 text-xs text-green-600 border-green-300 hover:bg-green-50"
                      >
                        Select All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearAllInlineAvailability}
                        className="h-7 text-xs text-red-600 border-red-300 hover:bg-red-50"
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    {/* Period headers */}
                    <div className="grid grid-cols-8 gap-1">
                      <div className="p-1"></div>
                      {periods.map((period) => (
                        <button
                          key={period}
                          onClick={() => toggleInlinePeriodAcrossDays(period)}
                          className="p-1 text-center text-xs font-medium rounded border border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          P{period}
                        </button>
                      ))}
                    </div>
                    
                    {/* Days and periods */}
                    {days.map((day, dayIndex) => (
                      <div key={day} className="grid grid-cols-8 gap-1">
                        <button
                          onClick={() => toggleInlineDay(day)}
                          className="p-1 text-xs font-medium capitalize text-left rounded border border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          {dayLabels[dayIndex]}
                        </button>
                        {periods.map((period) => {
                          const isAvailable = inlineFormData.availability[day].includes(period);
                          return (
                            <button
                              key={period}
                              onClick={() => toggleInlineAvailability(day, period)}
                              className={`p-1 text-center rounded border text-xs transition-colors ${
                                isAvailable
                                  ? 'bg-green-500 border-green-600 text-white hover:bg-green-600'
                                  : 'bg-gray-100 border-gray-300 text-gray-400 hover:bg-gray-200 dark:bg-gray-800 dark:border-gray-700'
                              }`}
                            >
                              {isAvailable ? '✓' : '—'}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  onClick={handleSaveInlineForm} 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      {editingRoomId ? 'Update Room' : 'Save Room'}
                    </>
                  )}
                </Button>
                <Button onClick={handleCancelInlineForm} variant="outline" size="sm" disabled={isSaving}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Short Name</TableHead>
                <TableHead>Xona turi</TableHead>
                <TableHead className="text-center">Availability</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRooms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No rooms found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRooms.map((room) => {
                  const totalPeriods = getTotalAvailablePeriods(room.availabilities);
                  const isExpanded = expandedAvailability === room.id;
                  const availability = convertFromTimeSlots(room.availabilities);

                  return (
                    <React.Fragment key={room.id}>
                      <TableRow className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                            <span>{room.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{room.shortName}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge 
                              className={room.type === RoomType.SHARED ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'}
                            >
                              {ROOM_TYPE_DEFINITIONS[room.type || RoomType.SHARED].label}
                            </Badge>
                            {room.type === RoomType.SPECIAL && room.allowedSubjectIds && room.allowedSubjectIds.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {room.allowedSubjectIds.length} fan
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedAvailability(isExpanded ? null : room.id)}
                              className="h-8 px-2 text-blue-700 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
                            >
                              <Calendar className="h-4 w-4 mr-1" />
                              {totalPeriods} periods
                              <ChevronDown className={`ml-1 h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(room)}
                              className="h-8 px-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleClone(room)}
                              className="h-8 px-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                            >
                              <Copy className="h-4 w-4 mr-1" />
                              Clone
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(room)}
                              className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Availability Row */}
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={5} className="bg-blue-50/30 dark:bg-blue-950/10 p-4">
                            <div className="bg-white dark:bg-gray-950 rounded-lg border border-blue-200 dark:border-blue-900 p-4">
                              {/* Room Type Info */}
                              <div className="mb-4">
                                <h4 className="text-sm font-semibold mb-2">Xona turi: {ROOM_TYPE_DEFINITIONS[room.type || RoomType.SHARED].label}</h4>
                                {room.type === RoomType.SPECIAL && room.allowedSubjectIds && room.allowedSubjectIds.length > 0 && (
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-1">Ruxsat etilgan fanlar:</p>
                                    <div className="flex flex-wrap gap-2">
                                      {room.allowedSubjectIds.map(subjectId => {
                                        const subject = availableSubjects.find(s => s.id === subjectId);
                                        return (
                                          <Badge key={subjectId} variant="outline">
                                            {subject?.name || `Fan #${subjectId}`}
                                          </Badge>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 mb-3">
                                <Calendar className="h-4 w-4 text-blue-600" />
                                <h4 className="text-blue-800 dark:text-blue-300">Weekly Availability</h4>
                              </div>
                              
                              <div className="grid gap-2">
                                {/* Period headers */}
                                <div className="grid grid-cols-8 gap-1">
                                  <div className="p-1"></div>
                                  {periods.map((period) => (
                                    <div
                                      key={period}
                                      className="p-1 text-center text-xs font-medium text-muted-foreground"
                                    >
                                      P{period}
                                    </div>
                                  ))}
                                </div>
                                
                                {/* Days and availability */}
                                {days.map((day, dayIndex) => (
                                  <div key={day} className="grid grid-cols-8 gap-1">
                                    <div className="p-1 text-xs font-medium capitalize text-muted-foreground">
                                      {dayLabels[dayIndex]}
                                    </div>
                                    {periods.map((period) => {
                                      const isAvailable = availability[day]?.includes(period);
                                      return (
                                        <div
                                          key={period}
                                          className={`p-1 text-center rounded border text-xs ${
                                            isAvailable
                                              ? 'bg-blue-500 border-blue-600 text-white'
                                              : 'bg-gray-100 border-gray-300 text-gray-400 dark:bg-gray-800 dark:border-gray-700'
                                          }`}
                                        >
                                          {isAvailable ? '✓' : '—'}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Pagination */}
      {!isLoading && totalElements > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Showing {currentPage * itemsPerPage + 1} to {Math.min((currentPage + 1) * itemsPerPage, totalElements)} of {totalElements} rooms
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage >= totalPages - 1}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDialogRoom} onOpenChange={(open: boolean) => !open && setDeleteDialogRoom(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteDialogRoom?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Rooms</DialogTitle>
            <DialogDescription>
              Upload an Excel file to import multiple rooms at once.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Drag and drop your Excel file here, or click to browse
              </p>
              <Button variant="outline" className="mt-4">
                Select File
              </Button>
            </div>
            <Button variant="outline" onClick={handleDownloadTemplate} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsImportDialogOpen(false)}>
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
