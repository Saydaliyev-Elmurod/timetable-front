import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from '@/i18n/index';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Card,
  CardContent,
} from '../ui/card';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { Plus, Trash2, Upload, Download, Copy, Calendar, Check, X, ChevronDown, HelpCircle, Loader2, Edit } from 'lucide-react';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
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

// API Types
interface TimeSlot {
  dayOfWeek: string;
  lessons: number[];
}

interface SubjectRequest {
  shortName: string;
  name: string;
  availabilities: TimeSlot[];
  emoji: string;
  color: string;
  weight: number;
}

interface SubjectResponse {
  id: number;
  shortName: string;
  name: string;
  availabilities: TimeSlot[];
  emoji?: string;
  color?: string;
  weight?: number;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// Import services
import { SubjectService } from '@/lib/subjects';

// Using SubjectService imported from @/lib/subjects

// Emoji recommendations for subjects - ~30 common subjects
const EMOJI_RECOMMENDATIONS: { [key: string]: string } = {
  'Matematika': '🔢',
  'Ingliz tili': '🇬🇧',
  'O\'zbek tili': '🇺🇿',
  'Fizika': '⚛️',
  'Kimya': '🧪',
  'Biologiya': '🦠',
  'Tarix': '📜',
  'Geografiya': '🌍',
  'Adabiyot': '📖',
  'Musiqa': '🎵',
  'Rasmni chizish': '🎨',
  'Jismoniy madaniyat': '🏃',
  'Informatika': '💻',
  'O\'z vatan tarixi': '🏛️',
  'Sharqiy tillar': '📚',
  'Fransuz tili': '🇫🇷',
  'Nemis tili': '🇩🇪',
  'Rus tili': '🇷🇺',
  'Yapon tili': '🇯🇵',
  'Xitoy tili': '🇨🇳',
  'Iqtisodiyot': '💼',
  'Huquq': '⚖️',
  'Psixologiya': '🧠',
  'Jamiyat fanlar': '👥',
  'Ekologiya': '🌱',
  'Astronomiya': '⭐',
  'Mehnat': '🔧',
  'Ruh va axloq': '✨',
  'Ingliz adabiyoti': '📕',
  'San\'at': '🖼️',
};

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
const convertFromTimeSlots = (timeSlots: TimeSlot[] | null | undefined): any => {
  const availability: any = {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  };

  if (!timeSlots) return availability;

  timeSlots.forEach((slot) => {
    const dayKey = slot.dayOfWeek.toLowerCase();
    if (dayKey in availability) {
      availability[dayKey] = slot.lessons;
    }
  });

  return availability;
};

export default function SubjectsPage() {
  const { t } = useTranslation();
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1); // UI uses 1-based; service calls use currentPage-1
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [deleteDialogSubject, setDeleteDialogSubject] = useState<SubjectResponse | null>(null);
  
  // Inline form state
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null);
  const [inlineFormData, setInlineFormData] = useState({
    name: '',
    shortName: '',
    emoji: '📖',
    color: '#3b82f6',
    difficulty: 5,
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
  
  // Availability view for existing subjects
  const [expandedAvailability, setExpandedAvailability] = useState<number | null>(null);

  type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
type AvailabilityMap = Record<DayOfWeek, number[]>;

const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const periods = [1, 2, 3, 4, 5, 6, 7];

  // Fetch subjects on mount and when pagination changes
  useEffect(() => {
    fetchSubjects();
  }, [currentPage, itemsPerPage]);

  const fetchSubjects = async () => {
    try {
      setIsLoading(true);
      const data = await SubjectService.getPaginated(currentPage - 1, itemsPerPage);
      setSubjects(data.content || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || (data.content ? data.content.length : 0));
      if (typeof (data as any).number === 'number') {
        const backendPage = (data as any).number + 1;
        if (backendPage !== currentPage) setCurrentPage(backendPage);
      }
    } catch (error) {
      toast.error('Failed to fetch subjects');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSubjects = React.useMemo(() => 
    subjects.filter(
      (subject) =>
        subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subject.shortName.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [subjects, searchQuery]
  );

  const generateShortName = useCallback((fullName: string) => {
    if (!fullName) return '';
    // Take first 4 uppercase letters from the name
    const cleaned = fullName.replace(/[^a-zA-Z]/g, '').toUpperCase();
    return cleaned.substring(0, 4);
  }, []);

  const handleAddSubject = () => {
    setShowInlineForm(true);
    setEditingSubjectId(null);
    setInlineFormData({
      name: '',
      shortName: '',
      emoji: '📖',
      color: '#3b82f6',
      difficulty: 5,
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

  const handleEdit = async (subject: SubjectResponse) => {
    try {
      setIsSaving(true);
      const subjectData = await SubjectService.getById(subject.id);
      setEditingSubjectId(subject.id);
      setInlineFormData({
        name: subjectData.name,
        shortName: subjectData.shortName,
        emoji: subjectData.emoji || '📖',
        color: subjectData.color || '#3b82f6',
        difficulty: subjectData.weight || 5,
        availability: convertFromTimeSlots(subjectData.availabilities),
      });
      setShowInlineForm(true);
      setShowAvailabilityInForm(false);
    } catch (error) {
      toast.error('Failed to load subject data');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClone = (subject: SubjectResponse) => {
    setShowInlineForm(true);
    setEditingSubjectId(null);
    setInlineFormData({
      name: `${subject.name} (Copy)`,
      shortName: `${subject.shortName}-C`,
      emoji: subject.emoji || '📖',
      color: subject.color || '#3b82f6',
      difficulty: subject.weight || 5,
      availability: convertFromTimeSlots(subject.availabilities),
    });
    setShowAvailabilityInForm(false);
  };

  const handleSaveInlineForm = async () => {
    if (!inlineFormData.name.trim()) {
      toast.error('Iltimos, fan nomini kiriting');
      return;
    }

    if (inlineFormData.difficulty < 1 || inlineFormData.difficulty > 10) {
      toast.error('Qiyinlik darajasi 1 dan 10 gacha bo\'lishi kerak');
      return;
    }

    const requestData: SubjectRequest = {
      name: inlineFormData.name.trim(),
      shortName: inlineFormData.shortName.trim() || generateShortName(inlineFormData.name.trim()),
      emoji: inlineFormData.emoji || '📖',
      color: inlineFormData.color || '#3b82f6',
      weight: inlineFormData.difficulty,
      availabilities: convertToTimeSlots(inlineFormData.availability),
    };

    try {
      setIsSaving(true);
      if (editingSubjectId) {
        await SubjectService.update(editingSubjectId, requestData);
        toast.success('Fan muvaffaqiyatli yangilandi');
      } else {
        await SubjectService.create(requestData);
        toast.success('Fan muvaffaqiyatli qo\'shildi');
      }
      setShowInlineForm(false);
      setShowAvailabilityInForm(false);
      setEditingSubjectId(null);
      await fetchSubjects();
    } catch (error) {
      toast.error(editingSubjectId ? 'Fanni yangilashda xatolik' : 'Fan qo\'shishda xatolik');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelInlineForm = () => {
    setShowInlineForm(false);
    setShowAvailabilityInForm(false);
    setEditingSubjectId(null);
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

  const handleDelete = (subject: SubjectResponse) => {
    setDeleteDialogSubject(subject);
  };

  const confirmDelete = async () => {
    if (deleteDialogSubject) {
      try {
        await SubjectService.delete(deleteDialogSubject.id);
        toast.success('Subject deleted successfully');
        setDeleteDialogSubject(null);
        await fetchSubjects();
      } catch (error) {
        toast.error('Failed to delete subject');
        console.error(error);
      }
    }
  };

  const handleImport = () => {
    setIsImportDialogOpen(true);
  };

  const handleDownloadTemplate = () => {
    toast.success('Template downloaded successfully');
  };

  const getTotalAvailablePeriods = (availabilities: TimeSlot[] | null | undefined) => {
    if (!availabilities) return 0;
    return availabilities.reduce((total, slot) => total + slot.lessons.length, 0);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2>{t('subjects.title')}</h2>
          <p className="text-muted-foreground">{t('subjects.description')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImport} size="sm">
            <Upload className="mr-2 h-4 w-4" />
            {t('subjects.import')}
          </Button>
          <Button onClick={handleAddSubject} size="sm" className="bg-green-600 hover:bg-green-700">
            <Plus className="mr-2 h-4 w-4" />
            {t('subjects.add_subject')}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
          <Input
            placeholder={t('subjects.search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
      </div>

      {/* Inline Add/Clone Form */}
      {showInlineForm && (
        <Card className="border-2 border-green-500 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fan nomi</Label>
                  <Input
                    placeholder="Masalan: Matematika"
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

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Qiyinlik darajasi (1-10)</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>
                            Bu fanning nisbiy qiyinligini bildiradi. Raqam qanchalik yuqori bo'lsa, fan shunchalik qiyin hisoblanadi. Ushbu ma'lumot sun'iy intellektga bir kunlik jadvalga og'ir fanlarni to'plab qo'ymaslik va darslarni to'g'ri taqsimlash uchun kerak bo'ladi. Masalan: Fizika uchun 9, Musiqa uchun 2.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    placeholder="1-10"
                    value={inlineFormData.difficulty}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      updateInlineFormField('difficulty', Math.min(10, Math.max(1, value)));
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Emoji</Label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-shrink-0"
                          title="Emoji tanlash"
                        >
                          {inlineFormData.emoji}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-3">
                        <div className="space-y-3">
                          <div className="text-sm font-medium">Fanga mos emoji tanlang</div>
                          <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto">
                            {Object.entries(EMOJI_RECOMMENDATIONS).map(([subject, emoji]) => (
                              <button
                                key={emoji}
                                onClick={() => updateInlineFormField('emoji', emoji)}
                                className={`p-2 rounded border transition-colors ${
                                  inlineFormData.emoji === emoji
                                    ? 'border-green-500 bg-green-50 dark:bg-green-950'
                                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900'
                                }`}
                                title={subject}
                              >
                                <span className="text-xl">{emoji}</span>
                              </button>
                            ))}
                          </div>
                          <div className="text-xs text-muted-foreground border-t pt-2">
                            Yoki quyida boshqacha emoji kiriting
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Input
                      type="text"
                      placeholder="📖"
                      value={inlineFormData.emoji}
                      onChange={(e) => updateInlineFormField('emoji', e.target.value)}
                      maxLength={2}
                      className="text-center text-2xl flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Rang</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={inlineFormData.color}
                      onChange={(e) => updateInlineFormField('color', e.target.value)}
                      className="h-10 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={inlineFormData.color}
                      onChange={(e) => updateInlineFormField('color', e.target.value)}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Inline Availability Grid */}
              {showAvailabilityInForm && (
                <div className="bg-white dark:bg-gray-950 rounded-lg border border-green-300 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Subject Availability</p>
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
                      {editingSubjectId ? 'Update Subject' : 'Save Subject'}
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
                <TableHead className="text-center">Difficulty</TableHead>
                <TableHead className="text-center">Availability</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No subjects found
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubjects.map((subject) => {
                  const totalPeriods = getTotalAvailablePeriods(subject.availabilities);
                  const isExpanded = expandedAvailability === subject.id;
                  const availability = convertFromTimeSlots(subject.availabilities);

                  return (
                    <React.Fragment key={subject.id}>
                      <TableRow className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                              style={{ backgroundColor: subject.color + '20', border: `2px solid ${subject.color}` }}
                            >
                              {subject.emoji}
                            </div>
                            <span>{subject.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary"
                            style={{ 
                              backgroundColor: subject.color + '15',
                              color: subject.color,
                              borderColor: subject.color + '40'
                            }}
                          >
                            {subject.shortName}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="flex gap-0.5">
                              {Array.from({ length: 10 }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-2 h-6 rounded-sm ${
                                    i < (subject.weight || 5)
                                      ? 'bg-gradient-to-t from-orange-500 to-yellow-400'
                                      : 'bg-gray-200 dark:bg-gray-700'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-muted-foreground ml-1">
                              {subject.weight || 5}/10
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedAvailability(isExpanded ? null : subject.id)}
                              className="h-8 px-2 text-green-700 hover:text-green-800 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950"
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
                              onClick={() => handleEdit(subject)}
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                              title={t('actions.edit')}
                              aria-label={t('actions.edit')}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleClone(subject)}
                              className="h-8 w-8 p-0 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                              title={t('actions.clone')}
                              aria-label={t('actions.clone')}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(subject)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title={t('actions.delete')}
                              aria-label={t('actions.delete')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Availability Row */}
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={5} className="bg-green-50/30 dark:bg-green-950/10 p-4">
                            <div className="bg-white dark:bg-gray-950 rounded-lg border border-green-200 dark:border-green-900 p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Calendar className="h-4 w-4 text-green-600" />
                                <h4 className="text-green-800 dark:text-green-300">Weekly Availability</h4>
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
                                              ? 'bg-green-500 border-green-600 text-white'
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
              Showing {currentPage * itemsPerPage + 1} to {Math.min((currentPage + 1) * itemsPerPage, totalElements)} of {totalElements} subjects
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
              {React.createElement(require('../ui/pagination').default, {
                currentPage,
                totalPages,
                onPageChange: (p: number) => setCurrentPage(p),
              })}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDialogSubject} onOpenChange={(open: boolean) => !open && setDeleteDialogSubject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteDialogSubject?.name}". This action cannot be undone.
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
            <DialogTitle>Import Subjects</DialogTitle>
            <DialogDescription>
              Upload an Excel file to import multiple subjects at once.
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
