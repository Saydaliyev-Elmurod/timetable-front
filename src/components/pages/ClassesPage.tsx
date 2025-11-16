import { apiCall } from '../../lib/api';
import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Plus, Trash2, Upload, Download, Copy, Calendar, Check, X, ChevronDown, Sparkles, Share2, HelpCircle, ChevronLeft, ChevronRight, Lightbulb, ExternalLink, FileText, Info, Edit, RefreshCw } from 'lucide-react';
import { Badge } from '../ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { Switch } from '../ui/switch';
import { Checkbox } from '../ui/checkbox';
import { toast } from 'sonner@2.0.3';
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';

const API_BASE_URL = 'http://localhost:8080';

export default function ClassesPage({ onNavigate }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [csvData, setCsvData] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [deleteDialogClass, setDeleteDialogClass] = useState(null);
  const [isImportTipsSidebarOpen, setIsImportTipsSidebarOpen] = useState(true);
  
  // Batch Create states
  const [isBatchCreateOpen, setIsBatchCreateOpen] = useState(false);
  const [batchCharacterSet, setBatchCharacterSet] = useState('latin'); // 'latin' or 'cyrillic'
  const [gradeList, setGradeList] = useState([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  const [gradeQuantities, setGradeQuantities] = useState({
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0
  });
  const [generatedClasses, setGeneratedClasses] = useState([]);
  const [batchMode, setBatchMode] = useState('simple'); // 'simple' or 'quick'
  
  // Class Availability states
  const [changedClassAvailability, setChangedClassAvailability] = useState(null); // { classId, availability }
  const [isApplyToOthersOpen, setIsApplyToOthersOpen] = useState(false);
  const [selectedClassesForApply, setSelectedClassesForApply] = useState([]);
  
  // Tips & Tricks sidebar state
  const [isTipsSidebarOpen, setIsTipsSidebarOpen] = useState(false);
  
  // Inline form state
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [inlineFormData, setInlineFormData] = useState({
    name: '',
    shortName: '',
    classTeacher: '',
    roomIds: [],
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
  const [showAvailabilityInForm, setShowAvailabilityInForm] = useState(false);
  const [editingClassId, setEditingClassId] = useState(null);
  
  // Availability view for existing classes
  const [expandedAvailability, setExpandedAvailability] = useState(null);

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const periods = [1, 2, 3, 4, 5, 6, 7];

  // API helper functions
  const convertToTimeSlots = (availability) => {
    const dayMapping = {
      monday: 'MONDAY',
      tuesday: 'TUESDAY',
      wednesday: 'WEDNESDAY',
      thursday: 'THURSDAY',
      friday: 'FRIDAY',
      saturday: 'SATURDAY',
      sunday: 'SUNDAY'
    };
    
    const timeSlots = [];
    Object.entries(availability).forEach(([day, lessons]) => {
      if (lessons && lessons.length > 0) {
        timeSlots.push({
          dayOfWeek: dayMapping[day],
          lessons: lessons.sort((a, b) => a - b)
        });
      }
    });
    return timeSlots;
  };

  const convertFromTimeSlots = (timeSlots) => {
    const dayMapping = {
      MONDAY: 'monday',
      TUESDAY: 'tuesday',
      WEDNESDAY: 'wednesday',
      THURSDAY: 'thursday',
      FRIDAY: 'friday',
      SATURDAY: 'saturday',
      SUNDAY: 'sunday'
    };
    
    const availability = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    };
    
    if (timeSlots) {
      timeSlots.forEach(slot => {
        const day = dayMapping[slot.dayOfWeek];
        if (day) {
          availability[day] = slot.lessons || [];
        }
      });
    }
    
    return availability;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Fetch teachers from API
  const fetchTeachers = useCallback(async () => {
    try {
      const response = await apiCall<any>(`${API_BASE_URL}/api/teachers/v1/all`);
      if (!response.error && response.data) {
        const teacherList = Array.isArray(response.data) ? response.data : [];
        setTeachers(teacherList.map((t: any) => ({
          id: t?.id,
          name: t?.fullName || t?.name || 'Unknown'
        })));
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  }, []);

  // Fetch rooms from API
  const fetchRooms = useCallback(async () => {
    try {
      const response = await apiCall<any>(`${API_BASE_URL}/api/rooms/v1/all`);
      if (!response.error && response.data) {
        const roomList = Array.isArray(response.data) ? response.data : [];
        setRooms(roomList.map((r: any) => ({
          id: r?.id,
          name: r?.name || 'Unknown Room',
          capacity: r?.capacity || 0
        })));
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  }, []);

  // Fetch classes from API
  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiCall<any>(`${API_BASE_URL}/api/classes/v1?page=${currentPage - 1}&size=${itemsPerPage}`);
      
      if (response.error) {
        throw new Error('Failed to fetch classes');
      }
      
      const data = response.data;

      if (!data) {
        console.error('fetchClasses: API returned no data', response);
        setClasses([]);
        return;
      }

      // If paginated response is expected, protect against missing content
      const content = Array.isArray(data.content) ? data.content : [];

      // Convert API response to local format (safely)
      const convertedClasses = content.map((cls: any) => ({
        id: cls?.id ?? 0,
        name: cls?.name ?? 'Unnamed Class',
        shortName: cls?.shortName ?? '',
        isActive: cls?.isActive ?? true,
        classTeacher: cls?.teacher?.id?.toString() || '',
        roomIds: Array.isArray(cls?.rooms) ? cls.rooms.map((r: any) => String(r?.id ?? '')) : [],
        availability: convertFromTimeSlots(cls?.availabilities),
        updatedDate: cls?.updatedDate,
        createdDate: cls?.createdDate
      }));

      setClasses(convertedClasses);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage]);

  // Fetch data on mount and when pagination changes
  useEffect(() => {
    fetchClasses();
    fetchTeachers();
    fetchRooms();
  }, [fetchClasses, fetchTeachers, fetchRooms]);

  const filteredClasses = React.useMemo(() => 
    classes.filter(
      (cls) =>
        cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.shortName.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [classes, searchQuery]
  );

  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);
  const paginatedClasses = React.useMemo(() =>
    filteredClasses.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    ),
    [filteredClasses, currentPage, itemsPerPage]
  );

  const generateShortName = useCallback((fullName) => {
    if (!fullName) return '';
    
    const gradeMatch = fullName.match(/grade\s*(\d+)/i);
    const grade = gradeMatch ? gradeMatch[1] : '';
    
    const subjectMap = {
      'mathematics': 'MA',
      'math': 'MA', 
      'science': 'SC',
      'english': 'EN',
      'history': 'HI',
      'geography': 'GE',
      'physics': 'PH',
      'chemistry': 'CH',
      'biology': 'BI',
      'literature': 'LI',
      'art': 'AR',
      'music': 'MU',
      'physical education': 'PE',
      'computer science': 'CS'
    };
    
    let subject = '';
    for (const [key, value] of Object.entries(subjectMap)) {
      if (fullName.toLowerCase().includes(key)) {
        subject = value;
        break;
      }
    }
    
    if (!subject) {
      const words = fullName.split(' ').filter(word => 
        !['grade', 'class', 'year', 'level'].includes(word.toLowerCase())
      );
      if (words.length > 0) {
        subject = words[0].substring(0, 2).toUpperCase();
      }
    }
    
    return grade && subject ? `${grade}-${subject}` : fullName.substring(0, 6).toUpperCase();
  }, []);

  const handleAddClass = () => {
    setShowInlineForm(true);
    setEditingClassId(null);
    setInlineFormData({
      name: '',
      shortName: '',
      classTeacher: '',
      roomIds: [],
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

  const handleEdit = (classItem) => {
    setShowInlineForm(true);
    setEditingClassId(classItem.id);
    setInlineFormData({
      name: classItem.name,
      shortName: classItem.shortName,
      classTeacher: classItem.classTeacher || '',
      roomIds: classItem.roomIds || [],
      availability: JSON.parse(JSON.stringify(classItem.availability)),
    });
    setShowAvailabilityInForm(false);
  };

  const handleClone = (classItem) => {
    setShowInlineForm(true);
    setEditingClassId(null);
    setInlineFormData({
      name: `${classItem.name} (Copy)`,
      shortName: `${classItem.shortName}-C`,
      classTeacher: classItem.classTeacher || '',
      roomIds: classItem.roomIds || [],
      availability: JSON.parse(JSON.stringify(classItem.availability)),
    });
    setShowAvailabilityInForm(false);
  };

  const handleSaveInlineForm = async () => {
    if (!inlineFormData.name.trim()) {
      toast.error('Please enter a class name');
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        name: inlineFormData.name.trim(),
        shortName: inlineFormData.shortName.trim() || generateShortName(inlineFormData.name.trim()),
        availabilities: convertToTimeSlots(inlineFormData.availability),
        teacherId: null,
        rooms: []
      };

      const isEdit = editingClassId !== null;
      const url = isEdit 
        ? `${API_BASE_URL}/api/classes/v1/${editingClassId}`
        : `${API_BASE_URL}/api/classes/v1`;
      const method = isEdit ? 'PUT' : 'POST';

      const response = await apiCall(url, {
        method: method,
        body: JSON.stringify(requestData),
      });

      if (response.error) {
        throw new Error(`Failed to ${isEdit ? 'update' : 'create'} class`);
      }

      toast.success(`Class ${isEdit ? 'updated' : 'added'} successfully`);
      setShowInlineForm(false);
      setShowAvailabilityInForm(false);
      setEditingClassId(null);
      fetchClasses();
    } catch (error) {
      console.error('Error saving class:', error);
      toast.error(`Failed to ${editingClassId ? 'update' : 'create'} class`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInlineForm = () => {
    setShowInlineForm(false);
    setShowAvailabilityInForm(false);
    setEditingClassId(null);
  };

  const updateInlineFormField = (field, value) => {
    setInlineFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'name' && value) {
        updated.shortName = generateShortName(value);
      }
      return updated;
    });
  };

  const toggleInlineAvailability = (day, period) => {
    setInlineFormData(prev => {
      const dayPeriods = prev.availability[day];
      const newPeriods = dayPeriods.includes(period)
        ? dayPeriods.filter(p => p !== period)
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

  const toggleInlineDay = (day) => {
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

  const toggleInlinePeriodAcrossDays = (period) => {
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
    const newAvailability = {};
    days.forEach(day => {
      newAvailability[day] = [...periods];
    });
    
    setInlineFormData(prev => ({
      ...prev,
      availability: newAvailability
    }));
  };

  const clearAllInlineAvailability = () => {
    const newAvailability = {};
    days.forEach(day => {
      newAvailability[day] = [];
    });
    
    setInlineFormData(prev => ({
      ...prev,
      availability: newAvailability
    }));
  };

  const handleDelete = (classItem) => {
    setDeleteDialogClass(classItem);
  };

  const confirmDelete = async () => {
    if (!deleteDialogClass) return;

    setLoading(true);
    try {
      const response = await apiCall(`${API_BASE_URL}/api/classes/v1/${deleteDialogClass.id}`, {
        method: 'DELETE',
      });

      if (response.error) {
        throw new Error('Failed to delete class');
      }

      toast.success('Class deleted successfully');
      setDeleteDialogClass(null);
      fetchClasses();
    } catch (error) {
      console.error('Error deleting class:', error);
      toast.error('Failed to delete class');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    setIsImportDialogOpen(true);
    setCsvData('');
    setSelectedFile(null);
  };

  const handleDownloadTemplate = () => {
    // Create CSV template
    const headers = 'Name,Short Name,Teacher ID,Room IDs,Is Active,Mon Periods,Tue Periods,Wed Periods,Thu Periods,Fri Periods,Sat Periods,Sun Periods';
    const example1 = 'Grade 10 Mathematics,10-MA,1,1;2,true,1;2;3;4;5,1;2;3;4;5,1;2;3;4;5,1;2;3;4;5,1;2;3;4;5,,';
    const example2 = 'Grade 9 Science,9-SC,2,5;6;7,true,1;2;3;4;5;6;7,1;2;3;4;5;6;7,1;2;3;4;5;6;7,1;2;3;4;5;6;7,1;2;3;4;5;6;7,,';
    const csv = [headers, example1, example2].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'classes_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Template downloaded successfully');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setCsvData(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  const handleProcessImport = () => {
    if (!csvData.trim()) {
      toast.error('Please upload a file or paste CSV data');
      return;
    }

    try {
      const lines = csvData.trim().split('\n');
      if (lines.length < 2) {
        toast.error('CSV file must contain at least a header row and one data row');
        return;
      }

      const headers = lines[0].split(',');
      const importedClasses = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length < 2 || !values[0].trim()) continue;

        const availability = {
          monday: values[5] ? values[5].split(';').map(Number).filter(n => !isNaN(n)) : [],
          tuesday: values[6] ? values[6].split(';').map(Number).filter(n => !isNaN(n)) : [],
          wednesday: values[7] ? values[7].split(';').map(Number).filter(n => !isNaN(n)) : [],
          thursday: values[8] ? values[8].split(';').map(Number).filter(n => !isNaN(n)) : [],
          friday: values[9] ? values[9].split(';').map(Number).filter(n => !isNaN(n)) : [],
          saturday: values[10] ? values[10].split(';').map(Number).filter(n => !isNaN(n)) : [],
          sunday: values[11] ? values[11].split(';').map(Number).filter(n => !isNaN(n)) : [],
        };

        // Parse room IDs (semicolon-separated)
        const roomIds = values[3]?.trim() ? values[3].trim().split(';').filter(id => id.trim()) : [];

        const newClass = {
          id: Math.max(0, ...classes.map(c => c.id)) + importedClasses.length + 1,
          name: values[0].trim(),
          shortName: values[1]?.trim() || generateShortName(values[0].trim()),
          classTeacher: values[2]?.trim() || '',
          roomIds: roomIds,
          isActive: values[4]?.toLowerCase() === 'true',
          availability,
        };

        importedClasses.push(newClass);
      }

      setClasses(prev => [...prev, ...importedClasses]);
      toast.success(`Successfully imported ${importedClasses.length} ${importedClasses.length === 1 ? 'class' : 'classes'}`);
      setIsImportDialogOpen(false);
      setCsvData('');
      setSelectedFile(null);
    } catch (error) {
      toast.error('Error processing CSV file. Please check the format.');
      console.error(error);
    }
  };

  const getTotalAvailablePeriods = (availability) => {
    return Object.values(availability).flat().length;
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  // Batch Create Functions
  const getLetterSequence = (index, characterSet) => {
    if (characterSet === 'latin') {
      return String.fromCharCode(65 + index); // A, B, C, D...
    } else {
      // Cyrillic: А, Б, В, Г, Д, Е, Ё, Ж, З, И, К, Л, М, Н, О, П, Р, С, Т, У, Ф, Х, Ц, Ч, Ш, Щ, Э, Ю, Я
      const cyrillicLetters = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ё', 'Ж', 'З', 'И', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Щ', 'Э', 'Ю', 'Я'];
      return cyrillicLetters[index] || '';
    }
  };

  const handleBatchGenerate = () => {
    const newClasses = [];
    
    Object.entries(gradeQuantities).forEach(([grade, quantity]) => {
      const numQuantity = parseInt(quantity) || 0;
      for (let i = 0; i < numQuantity; i++) {
        const letter = getLetterSequence(i, batchCharacterSet);
        const className = `${grade}-${letter}`;
        newClasses.push({
          grade: parseInt(grade),
          letter,
          name: className,
          fullName: `Grade ${grade} ${letter}`
        });
      }
    });
    
    setGeneratedClasses(newClasses);
  };

  const handleBatchCreate = async () => {
    const newClasses = [];
    
    Object.entries(gradeQuantities).forEach(([grade, quantity]) => {
      const numQuantity = parseInt(quantity) || 0;
      for (let i = 0; i < numQuantity; i++) {
        const letter = getLetterSequence(i, batchCharacterSet);
        const className = `${grade}-${letter}`;
        newClasses.push({
          name: `Grade ${grade} ${letter}`,
          shortName: className,
          availabilities: convertToTimeSlots({
            monday: [1, 2, 3, 4, 5, 6, 7],
            tuesday: [1, 2, 3, 4, 5, 6, 7],
            wednesday: [1, 2, 3, 4, 5, 6, 7],
            thursday: [1, 2, 3, 4, 5, 6, 7],
            friday: [1, 2, 3, 4, 5, 6, 7],
            saturday: [],
            sunday: [],
          }),
          teacherId: null,
          rooms: []
        });
      }
    });

    if (newClasses.length === 0) {
      toast.error('Please set quantities for at least one grade');
      return;
    }

    setLoading(true);
    try {
      // Create all classes via API
      const promises = newClasses.map(classData =>
        apiCall(`${API_BASE_URL}/api/classes/v1`, {
          method: 'POST',
          body: JSON.stringify(classData),
        })
      );

      const responses = await Promise.all(promises);
      const failedCount = responses.filter(r => r.error).length;

      if (failedCount > 0) {
        toast.error(`Failed to create ${failedCount} of ${newClasses.length} classes`);
      } else {
        toast.success(`${newClasses.length} classes created successfully`);
      }

      setIsBatchCreateOpen(false);
      setGradeQuantities({
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0
      });
      fetchClasses();
    } catch (error) {
      console.error('Error creating batch classes:', error);
      toast.error('Failed to create batch classes');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchReset = () => {
    const resetQuantities = {};
    gradeList.forEach(grade => {
      resetQuantities[grade] = 0;
    });
    setGradeQuantities(resetQuantities);
    setGeneratedClasses([]);
  };

  const handleAddGrade = () => {
    const maxGrade = Math.max(...gradeList);
    const newGrade = maxGrade + 1;
    setGradeList(prev => [...prev, newGrade]);
    setGradeQuantities(prev => ({ ...prev, [newGrade]: 0 }));
  };

  const handleRemoveGrade = () => {
    if (gradeList.length <= 1) {
      toast.error('Must have at least one grade level');
      return;
    }
    const maxGrade = Math.max(...gradeList);
    setGradeList(prev => prev.filter(g => g !== maxGrade));
    setGradeQuantities(prev => {
      const newQuantities = { ...prev };
      delete newQuantities[maxGrade];
      return newQuantities;
    });
  };

  const handleQuickSetup = (preset) => {
    const newQuantities = {};
    gradeList.forEach(grade => {
      newQuantities[grade] = preset;
    });
    setGradeQuantities(newQuantities);
  };

  // Class Availability Functions
  const handleOpenApplyToOthers = () => {
    setIsApplyToOthersOpen(true);
    setSelectedClassesForApply([]);
  };

  const handleToggleClassForApply = (classId) => {
    setSelectedClassesForApply(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const handleSelectAllForApply = () => {
    const otherClasses = classes
      .filter(cls => cls.id !== changedClassAvailability?.classId)
      .map(cls => cls.id);
    setSelectedClassesForApply(otherClasses);
  };

  const handleDeselectAllForApply = () => {
    setSelectedClassesForApply([]);
  };

  const handleApplyToSelectedClasses = async () => {
    if (selectedClassesForApply.length === 0) {
      toast.error('Please select at least one class');
      return;
    }

    setLoading(true);
    try {
      const sourceAvailability = changedClassAvailability.availability;
      const availabilities = convertToTimeSlots(sourceAvailability);

      // Update all selected classes
      const promises = selectedClassesForApply.map(classId => {
        const classItem = classes.find(c => c.id === classId);
        if (!classItem) return Promise.resolve();

        const requestData = {
          name: classItem.name,
          shortName: classItem.shortName,
          availabilities: availabilities,
          teacherId: null,
          rooms: []
        };

        return apiCall(`${API_BASE_URL}/api/classes/v1/${classId}`, {
          method: 'PUT',
          body: JSON.stringify(requestData),
        });
      });

      const responses = await Promise.all(promises);
      const failedCount = responses.filter(r => r && r.error).length;

      if (failedCount > 0) {
        toast.error(`Failed to update ${failedCount} of ${selectedClassesForApply.length} classes`);
      } else {
        toast.success(`Availability settings applied to ${selectedClassesForApply.length} ${selectedClassesForApply.length === 1 ? 'class' : 'classes'}`);
      }

      setIsApplyToOthersOpen(false);
      setChangedClassAvailability(null);
      setSelectedClassesForApply([]);
      fetchClasses();
    } catch (error) {
      console.error('Error applying availability:', error);
      toast.error('Failed to apply availability settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-6 p-6 relative">
      {/* Main Content */}
      <div className={`flex-1 space-y-4 transition-all duration-300 ${isTipsSidebarOpen ? 'mr-0' : 'mr-0'}`}>
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2>Classes</h2>
            <p className="text-muted-foreground">Manage class schedules and availability</p>
          </div>
          <div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={fetchClasses} 
                size="sm"
                disabled={loading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" onClick={handleImport} size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
              <Button variant="outline" onClick={() => setIsBatchCreateOpen(true)} size="sm" className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 text-purple-700 hover:from-purple-100 hover:to-blue-100">
                <Sparkles className="mr-2 h-4 w-4" />
                Batch Create
              </Button>
              <Button onClick={handleAddClass} size="sm" className="bg-green-600 hover:bg-green-700">
                <Plus className="mr-2 h-4 w-4" />
                Add Class
              </Button>
            </div>
          </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search classes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Inline Add/Clone/Edit Form */}
      {showInlineForm && (
        <Card className="border-2 border-green-500 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {editingClassId ? 'Edit Class' : 'Add New Class'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Class Name</Label>
                  <Input
                    placeholder="e.g., Grade 10 Mathematics"
                    value={inlineFormData.name}
                    onChange={(e) => updateInlineFormField('name', e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label>Short Name</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Auto-generated"
                      value={inlineFormData.shortName}
                      onChange={(e) => updateInlineFormField('shortName', e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowAvailabilityInForm(!showAvailabilityInForm)}
                      className={`flex-shrink-0 ${showAvailabilityInForm ? 'bg-green-100 border-green-500 text-green-700' : 'border-green-300 text-green-600'}`}
                      title="Toggle availability"
                    >
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Class Teacher Field */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Class Teacher</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                          <HelpCircle className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-sm">
                          "Class Teacher" is an optional field. If you select a teacher here, that teacher will automatically appear as the default one when adding new lessons to this class. This helps you save time when scheduling lessons for the same teacher.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Select
                  value={inlineFormData.classTeacher || undefined}
                  onValueChange={(value) => updateInlineFormField('classTeacher', value)}
                  disabled={!teachers || teachers.length === 0} // Disable if no teachers
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a teacher (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers && teachers.length > 0 ? (
                      teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id.toString()}>
                          {teacher.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectLabel>
                        No teachers available
                      </SelectLabel>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Rooms Field (Multi-select) */}
              <div className="space-y-2">
                <Label>Rooms (optional)</Label>
                <div className="border rounded-lg p-3 bg-card max-h-48 overflow-y-auto">
                  <div className="space-y-2">
                    {rooms && rooms.length > 0 ? (
                      rooms.map((room) => (
                        <div key={room.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`room-${room.id}`}
                            checked={inlineFormData.roomIds?.includes(room.id.toString())}
                            onCheckedChange={(checked) => {
                              const currentRooms = inlineFormData.roomIds || [];
                              const roomIdStr = room.id.toString();
                              if (checked) {
                                updateInlineFormField('roomIds', [...currentRooms, roomIdStr]);
                              } else {
                                updateInlineFormField('roomIds', currentRooms.filter(id => id !== roomIdStr));
                              }
                            }}
                          />
                          <label
                            htmlFor={`room-${room.id}`}
                            className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {room.name} <span className="text-muted-foreground">(Capacity: {room.capacity})</span>
                          </label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No rooms available</p>
                    )}
                  </div>
                </div>
                {inlineFormData.roomIds && inlineFormData.roomIds.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {inlineFormData.roomIds.length} room{inlineFormData.roomIds.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>

              {/* Inline Availability Grid */}
              {showAvailabilityInForm && (
                <div className="bg-white dark:bg-gray-950 rounded-lg border border-green-300 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Class Availability</p>
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
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      {editingClassId ? 'Updating...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      {editingClassId ? 'Update Class' : 'Save Class'}
                    </>
                  )}
                </Button>
                <Button 
                  onClick={handleCancelInlineForm} 
                  variant="outline" 
                  size="sm"
                  disabled={loading}
                >
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
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead>Short Name</TableHead>
              <TableHead>Teacher of Class</TableHead>
              <TableHead>Rooms</TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <span>Availability</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                          <HelpCircle className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-sm">
                          "Availability" defines the class time slots when lessons can be scheduled. You can configure which days and periods this class is available for lessons. For example, you might allow classes from Monday to Friday, 08:00–14:00, excluding breaks. These time slots will appear automatically when you create or edit lessons for this class.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableHead>
              <TableHead>Updated Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                </TableCell>
              </TableRow>
            ) : paginatedClasses.map((classItem) => {
              const totalPeriods = getTotalAvailablePeriods(classItem.availability);
              const isExpanded = expandedAvailability === classItem.id;

              return (
                <React.Fragment key={classItem.id}>
                  <TableRow className="hover:bg-muted/50">
                    <TableCell className="font-medium">{classItem.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{classItem.shortName}</Badge>
                    </TableCell>
                    <TableCell>
                      {classItem.classTeacher ? (
                        <span>{teachers.find(t => t.id?.toString() === classItem.classTeacher)?.name || 'Unknown Teacher'}</span>
                      ) : (
                        <span className="text-muted-foreground italic">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {classItem.roomIds && classItem.roomIds.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {classItem.roomIds.map(roomId => {
                            const room = rooms.find(r => r.id?.toString() === roomId);
                            return room ? (
                              <Badge key={roomId} variant="outline" className="text-xs">
                                {room.name}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">No rooms assigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-3 flex-wrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedAvailability(isExpanded ? null : classItem.id)}
                          className="h-8 px-2 text-green-700 hover:text-green-800 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950"
                        >
                          <Calendar className="h-4 w-4 mr-1" />
                          {totalPeriods} periods
                          <ChevronDown className={`ml-1 h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </Button>
                        {isExpanded && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setChangedClassAvailability({ classId: classItem.id, availability: classItem.availability });
                              handleOpenApplyToOthers();
                            }}
                            className="h-8 px-3 bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/20 dark:border-blue-800 dark:text-blue-400 animate-in fade-in slide-in-from-left-2"
                          >
                            <Share2 className="h-3 w-3 mr-1" />
                            Apply to others
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(classItem.updatedDate)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(classItem)}
                          className="h-8 px-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleClone(classItem)}
                          className="h-8 px-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Clone
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(classItem)}
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
                      <TableCell colSpan={7} className="bg-green-50/30 dark:bg-green-950/10 p-4">
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
                                <div className="p-1 text-xs font-medium capitalize flex items-center">
                                  {dayLabels[dayIndex]}
                                </div>
                                {periods.map((period) => {
                                  const isAvailable = classItem.availability[day].includes(period);
                                  return (
                                    <div
                                      key={period}
                                      className={`p-1 text-center rounded border text-xs ${
                                        isAvailable
                                          ? 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/50 dark:border-green-700 dark:text-green-200'
                                          : 'bg-gray-50 border-gray-200 text-gray-400 dark:bg-gray-900 dark:border-gray-800'
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
            })}

            {paginatedClasses.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-muted-foreground">
                      {searchQuery ? 'No classes found matching your search' : 'No classes yet'}
                    </p>
                    {!searchQuery && (
                      <Button onClick={handleAddClass} size="sm" variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        Add your first class
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {filteredClasses.length > 0 && (
          <div className="border-t p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredClasses.length)} of{' '}
                  {filteredClasses.length} classes
                </p>
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground">Items per page:</Label>
                  <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                {/* Page numbers */}
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={i}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDialogClass} onOpenChange={() => setDeleteDialogClass(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialogClass?.name}"? This action cannot be undone.
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

      {/* Import CSV Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={(open) => {
        setIsImportDialogOpen(open);
        if (!open) {
          setCsvData('');
          setSelectedFile(null);
        }
      }}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0 gap-0">
          {/* Header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-600 text-white">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle>Bulk Import Classes</DialogTitle>
                  <DialogDescription>
                    Import multiple classes from CSV format
                  </DialogDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setIsImportDialogOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex">
            {/* Main Content */}
            <div className="flex-1 px-6 py-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
              <div className="space-y-6">
                {/* CSV Format Section */}
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-600 text-white rounded">
                        <Info className="h-3.5 w-3.5" />
                      </div>
                      <h3 className="text-base">CSV Format</h3>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadTemplate}
                      className="gap-2 bg-white dark:bg-gray-900 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download Template
                    </Button>
                  </div>

                  <p className="text-sm mb-4 text-blue-900 dark:text-blue-100">
                    Import classes using CSV format. Only <span className="font-medium text-blue-700 dark:text-blue-300">Name</span> is required, all other fields are optional.
                  </p>

                  {/* Column Order */}
                  <div className="space-y-2 mb-4">
                    <Label className="text-sm text-blue-900 dark:text-blue-100">Column Order:</Label>
                    <div className="bg-white dark:bg-gray-900 p-3 rounded border border-blue-200 dark:border-blue-900">
                      <code className="text-xs font-mono text-gray-700 dark:text-gray-300">
                        Name, Short Name, Teacher ID, Room IDs, Is Active, Mon Periods, Tue Periods, Wed Periods, Thu Periods, Fri Periods, Sat Periods, Sun Periods
                      </code>
                    </div>
                  </div>

                  {/* Field Requirements */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></div>
                      <div className="text-sm">
                        <span className="font-medium text-blue-900 dark:text-blue-100">Name:</span>{' '}
                        <span className="text-blue-700 dark:text-blue-300">Required</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-600 mt-1.5 flex-shrink-0"></div>
                      <div className="text-sm">
                        <span className="font-medium text-blue-900 dark:text-blue-100">Short Name:</span>{' '}
                        <span className="text-blue-700 dark:text-blue-300">Optional (auto-generated)</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-600 mt-1.5 flex-shrink-0"></div>
                      <div className="text-sm">
                        <span className="font-medium text-blue-900 dark:text-blue-100">Teacher ID:</span>{' '}
                        <span className="text-blue-700 dark:text-blue-300">Optional</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-600 mt-1.5 flex-shrink-0"></div>
                      <div className="text-sm">
                        <span className="font-medium text-blue-900 dark:text-blue-100">Room IDs:</span>{' '}
                        <span className="text-blue-700 dark:text-blue-300">Optional (1;2;3 format)</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-600 mt-1.5 flex-shrink-0"></div>
                      <div className="text-sm">
                        <span className="font-medium text-blue-900 dark:text-blue-100">Is Active:</span>{' '}
                        <span className="text-blue-700 dark:text-blue-300">Optional (defaults to true)</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-600 mt-1.5 flex-shrink-0"></div>
                      <div className="text-sm">
                        <span className="font-medium text-blue-900 dark:text-blue-100">Mon-Sun Periods:</span>{' '}
                        <span className="text-blue-700 dark:text-blue-300">Optional (semicolon-separated)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upload Section */}
                <div className="border-2 border-dashed border-blue-300 dark:border-blue-800 rounded-lg p-10 text-center bg-white dark:bg-gray-950">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
                    Upload a CSV file or paste CSV data below
                  </p>
                  <div className="flex justify-center">
                    <label htmlFor="csv-upload">
                      <Button 
                        variant="default" 
                        className="bg-blue-600 hover:bg-blue-700 cursor-pointer" 
                        asChild
                      >
                        <span>
                          <Download className="mr-2 h-4 w-4" />
                          Choose CSV File
                        </span>
                      </Button>
                      <Input
                        id="csv-upload"
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {selectedFile && (
                    <p className="text-sm text-blue-600 mt-4 flex items-center justify-center gap-2">
                      <Check className="h-4 w-4" />
                      {selectedFile.name}
                    </p>
                  )}
                </div>

                {/* Paste CSV Data */}
                <div className="space-y-2">
                  <Label className="text-sm">Or paste CSV data here</Label>
                  <textarea
                    value={csvData}
                    onChange={(e) => setCsvData(e.target.value)}
                    placeholder="Grade 10A,10A,1,1;2,true,1;2;3;4;5,1;2;3;4;5,1;2;3;4;5,1;2;3;4;5,1;2;3;4;5,,&#10;Grade 9 Science,9-SC,2,5;6,true,1;2;3;4;5;6;7,1;2;3;4;5;6;7,1;2;3;4;5;6;7,1;2;3;4;5;6;7,1;2;3;4;5;6;7,,&#10;Grade 11 Math,11-MA,,,true,1;2;3;4;5,1;2;3;4;5,1;2;3;4;5,1;2;3;4;5,1;2;3;4;5,,"
                    className="w-full min-h-[140px] p-3 border border-border rounded-lg font-mono text-xs resize-y bg-card focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>
              </div>
            </div>

            {/* Tips & Tricks Sidebar */}
            <div 
              className={`border-l bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 transition-all duration-300 overflow-y-auto ${
                isImportTipsSidebarOpen ? 'w-80' : 'w-0'
              }`}
              style={{ maxHeight: 'calc(90vh - 140px)' }}
            >
              {isImportTipsSidebarOpen && (
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-amber-600" />
                      <h3 className="text-base">Tips & Tricks</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setIsImportTipsSidebarOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {/* Tip 1 */}
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center flex-shrink-0 text-xs">
                          1
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm mb-1">Use the Template</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Download the CSV template to see the exact format required. It includes examples to guide you.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Tip 2 */}
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center flex-shrink-0 text-xs">
                          2
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm mb-1">Name is Mandatory</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            The only required field is the class name. All other fields will auto-generate or use defaults.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Tip 3 */}
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center flex-shrink-0 text-xs">
                          3
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm mb-1">Period Format</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Use semicolons to separate period numbers: <code className="text-xs bg-amber-100 dark:bg-amber-900/30 px-1 py-0.5 rounded">1;2;3;4;5</code>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Tip 4 */}
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center flex-shrink-0 text-xs">
                          4
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm mb-1">Comma Separated</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Ensure all fields are separated by commas. Don't use commas within field values.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Tip 5 */}
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center flex-shrink-0 text-xs">
                          5
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm mb-1">Excel to CSV</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            If you have data in Excel, use "Save As" and choose "CSV (Comma delimited)" format.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Tip 6 */}
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center flex-shrink-0 text-xs">
                          6
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm mb-1">Test with Small Batch</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Import 2-3 classes first to verify the format is correct before importing large datasets.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Tip 7 */}
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center flex-shrink-0 text-xs">
                          7
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm mb-1">Empty Fields</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Leave optional fields empty by using consecutive commas: <code className="text-xs bg-amber-100 dark:bg-amber-900/30 px-1 py-0.5 rounded">name,,,,</code>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Toggle Tips Button */}
            {!isImportTipsSidebarOpen && (
              <div className="w-10 flex items-start justify-center pt-6 border-l bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/10 dark:to-orange-950/10">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover:bg-amber-100 dark:hover:bg-amber-900/20"
                  onClick={() => setIsImportTipsSidebarOpen(true)}
                >
                  <Lightbulb className="h-5 w-5 text-amber-600" />
                </Button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-gray-50 dark:bg-gray-900/50 flex items-center justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsImportDialogOpen(false);
                setCsvData('');
                setSelectedFile(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleProcessImport}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!csvData.trim()}
            >
              Import Classes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Batch Create Dialog */}
      <Dialog open={isBatchCreateOpen} onOpenChange={setIsBatchCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Batch Create Classes
            </DialogTitle>
            <DialogDescription>
              Choose a mode to automatically generate class names
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Mode Selection */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg">
              <Button
                variant={batchMode === 'simple' ? 'default' : 'ghost'}
                className="flex-1"
                onClick={() => setBatchMode('simple')}
              >
                Simple Mode
              </Button>
              <Button
                variant={batchMode === 'quick' ? 'default' : 'ghost'}
                className="flex-1"
                onClick={() => setBatchMode('quick')}
              >
                Quick Setup
              </Button>
            </div>

            {batchMode === 'simple' ? (
              <>
                {/* Character Set Selection */}
                <div className="space-y-3">
                  <RadioGroup value={batchCharacterSet} onValueChange={setBatchCharacterSet}>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="latin" id="latin" />
                        <Label htmlFor="latin" className="cursor-pointer font-normal">
                          ABC (Latin)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cyrillic" id="cyrillic" />
                        <Label htmlFor="cyrillic" className="cursor-pointer font-normal">
                          АБВГД (Cyrillic)
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* Grade Levels List */}
                <div className="space-y-3">
                  <div className="grid grid-cols-[60px_120px_1fr] gap-4 items-center pb-2 border-b">
                    <Label className="text-sm text-muted-foreground">Grade</Label>
                    <Label className="text-sm text-muted-foreground text-center">Quantity</Label>
                    <Label className="text-sm text-muted-foreground">Preview</Label>
                  </div>
                  
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                    {gradeList.map(grade => {
                      const quantity = gradeQuantities[grade] || 0;
                      const preview = quantity > 0 
                        ? Array.from({ length: quantity }, (_, i) => 
                            `${grade}-${getLetterSequence(i, batchCharacterSet)}`
                          ).join(', ')
                        : '';
                      
                      return (
                        <div key={grade} className="grid grid-cols-[60px_120px_1fr] gap-4 items-center">
                          <div className="flex items-center justify-center h-12 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            <span className="font-medium">{grade}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-12 w-12 shrink-0"
                              onClick={() => {
                                setGradeQuantities(prev => ({
                                  ...prev,
                                  [grade]: Math.max(0, (prev[grade] || 0) - 1)
                                }));
                              }}
                            >
                              -
                            </Button>
                            <Input
                              type="number"
                              min="0"
                              max="26"
                              value={gradeQuantities[grade] || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                const numValue = value === '' ? 0 : Math.max(0, Math.min(26, parseInt(value) || 0));
                                setGradeQuantities(prev => ({
                                  ...prev,
                                  [grade]: numValue
                                }));
                              }}
                              className="h-12 w-16 text-center p-0"
                              placeholder="0"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-12 w-12 shrink-0"
                              onClick={() => {
                                setGradeQuantities(prev => ({
                                  ...prev,
                                  [grade]: Math.min(26, (prev[grade] || 0) + 1)
                                }));
                              }}
                            >
                              +
                            </Button>
                          </div>
                          
                          <div className="flex items-center h-12 px-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg min-h-[48px]">
                            <span className="text-sm text-muted-foreground truncate">
                              {preview || '—'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add/Remove Grade Buttons */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveGrade}
                      disabled={gradeList.length <= 1}
                      className="flex-1"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Remove Grade {Math.max(...gradeList)}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddGrade}
                      className="flex-1 bg-green-50 border-green-300 text-green-700 hover:bg-green-100 dark:bg-green-950/20 dark:border-green-800 dark:text-green-400"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Grade {Math.max(...gradeList) + 1}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Quick Setup Mode */}
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label>Character Set</Label>
                    <RadioGroup value={batchCharacterSet} onValueChange={setBatchCharacterSet}>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="latin" id="latin-quick" />
                          <Label htmlFor="latin-quick" className="cursor-pointer font-normal">
                            ABC (Latin)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="cyrillic" id="cyrillic-quick" />
                          <Label htmlFor="cyrillic-quick" className="cursor-pointer font-normal">
                            АБВГД (Cyrillic)
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-3">
                    <Label>Quick Presets</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Card className="p-4 cursor-pointer hover:bg-accent transition-colors border-2 hover:border-purple-300" onClick={() => handleQuickSetup(2)}>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                              <span className="text-lg">2️⃣</span>
                            </div>
                            <div>
                              <h4 className="text-sm">2 Classes per Grade</h4>
                              <p className="text-xs text-muted-foreground">Standard dual-stream</p>
                            </div>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-4 cursor-pointer hover:bg-accent transition-colors border-2 hover:border-purple-300" onClick={() => handleQuickSetup(3)}>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                              <span className="text-lg">3️⃣</span>
                            </div>
                            <div>
                              <h4 className="text-sm">3 Classes per Grade</h4>
                              <p className="text-xs text-muted-foreground">Medium school</p>
                            </div>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-4 cursor-pointer hover:bg-accent transition-colors border-2 hover:border-purple-300" onClick={() => handleQuickSetup(4)}>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                              <span className="text-lg">4️⃣</span>
                            </div>
                            <div>
                              <h4 className="text-sm">4 Classes per Grade</h4>
                              <p className="text-xs text-muted-foreground">Large school</p>
                            </div>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-4 cursor-pointer hover:bg-accent transition-colors border-2 hover:border-purple-300" onClick={() => handleQuickSetup(5)}>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                              <span className="text-lg">5️⃣</span>
                            </div>
                            <div>
                              <h4 className="text-sm">5 Classes per Grade</h4>
                              <p className="text-xs text-muted-foreground">Very large school</p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>

                  {/* Preview in Quick Mode */}
                  {Object.values(gradeQuantities).some(q => q > 0) && (
                    <div className="space-y-3">
                      <Label>Preview ({Object.values(gradeQuantities).reduce((sum, q) => sum + (q || 0), 0)} classes)</Label>
                      <div className="border rounded-lg p-4 bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20 max-h-60 overflow-y-auto">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {gradeList.map(grade => {
                            const quantity = gradeQuantities[grade] || 0;
                            if (quantity === 0) return null;
                            
                            const classes = Array.from({ length: quantity }, (_, i) => 
                              `${grade}-${getLetterSequence(i, batchCharacterSet)}`
                            );
                            
                            return (
                              <div key={grade} className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">Grade {grade}</p>
                                <div className="flex flex-wrap gap-1">
                                  {classes.map((cls, idx) => (
                                    <Badge key={idx} variant="outline" className="bg-white dark:bg-gray-900 border-purple-200 text-purple-700 dark:text-purple-300 text-xs">
                                      {cls}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Summary */}
            {Object.values(gradeQuantities).some(q => q > 0) && batchMode === 'simple' && (
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Total classes to create:</span>
                </div>
                <Badge className="bg-purple-600 text-white">
                  {Object.values(gradeQuantities).reduce((sum, q) => sum + (q || 0), 0)} classes
                </Badge>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setIsBatchCreateOpen(false);
              handleBatchReset();
            }}>
              Cancel
            </Button>
            {Object.values(gradeQuantities).some(q => q > 0) && (
              <Button onClick={() => {
                handleBatchGenerate();
                handleBatchCreate();
              }} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <Check className="mr-2 h-4 w-4" />
                Create {Object.values(gradeQuantities).reduce((sum, q) => sum + (q || 0), 0)} Classes
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apply to Other Classes Dialog */}
      <Dialog open={isApplyToOthersOpen} onOpenChange={setIsApplyToOthersOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-blue-600" />
              Apply Availability to Other Classes
            </DialogTitle>
            <DialogDescription>
              {changedClassAvailability && (
                <>
                  Copy availability settings from <span className="font-medium text-blue-600">
                    {classes.find(c => c.id === changedClassAvailability.classId)?.shortName}
                  </span> to other classes
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Action buttons */}
            <div className="flex items-center justify-between pb-2 border-b">
              <p className="text-sm text-muted-foreground">
                Select classes to apply this change
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllForApply}
                  className="h-8 text-xs"
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeselectAllForApply}
                  className="h-8 text-xs"
                >
                  Clear All
                </Button>
              </div>
            </div>

            {/* Classes list */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {classes
                .filter(cls => cls.id !== changedClassAvailability?.classId)
                .sort((a, b) => a.shortName.localeCompare(b.shortName))
                .map(classItem => (
                  <div
                    key={classItem.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-950/20 ${
                      selectedClassesForApply.includes(classItem.id)
                        ? 'bg-blue-50 border-blue-300 dark:bg-blue-950/30 dark:border-blue-700'
                        : 'bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-700'
                    }`}
                    onClick={() => handleToggleClassForApply(classItem.id)}
                  >
                    <Checkbox
                      checked={selectedClassesForApply.includes(classItem.id)}
                      onCheckedChange={() => handleToggleClassForApply(classItem.id)}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{classItem.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {classItem.shortName}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className="text-xs bg-gray-50 text-gray-600 border-gray-300 dark:bg-gray-900"
                          >
                            {getTotalAvailablePeriods(classItem.availability)} periods
                          </Badge>
                        </div>
                      </div>
                      {selectedClassesForApply.includes(classItem.id) && (
                        <div className="flex items-center gap-2 text-blue-600 animate-in fade-in slide-in-from-right-2">
                          <span className="text-sm">Will be updated</span>
                          <Badge className="bg-blue-600 text-white">
                            {changedClassAvailability && getTotalAvailablePeriods(changedClassAvailability.availability)} periods
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            {/* Summary */}
            {selectedClassesForApply.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Selected:</span>
                </div>
                <Badge className="bg-blue-600 text-white">
                  {selectedClassesForApply.length} {selectedClassesForApply.length === 1 ? 'class' : 'classes'}
                </Badge>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsApplyToOthersOpen(false);
                setSelectedClassesForApply([]);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleApplyToSelectedClasses}
              disabled={selectedClassesForApply.length === 0}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              <Check className="mr-2 h-4 w-4" />
              Apply to {selectedClassesForApply.length} {selectedClassesForApply.length === 1 ? 'Class' : 'Classes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>

      {/* Tips & Tricks Sidebar */}
      <div className={`fixed top-0 right-0 h-screen transition-all duration-300 ease-in-out z-40 ${
        isTipsSidebarOpen ? 'translate-x-0' : 'translate-x-[284px]'
      }`} style={{ paddingTop: '80px' }}>
        <div className="relative h-full">
          {/* Toggle Button */}
          <button
            onClick={() => setIsTipsSidebarOpen(!isTipsSidebarOpen)}
            className="absolute left-0 top-8 -translate-x-full bg-card border border-r-0 border-border rounded-l-lg p-2 hover:bg-accent transition-colors shadow-sm"
            aria-label={isTipsSidebarOpen ? 'Close tips' : 'Open tips'}
          >
            {isTipsSidebarOpen ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <ChevronLeft className="h-4 w-4" />
              </div>
            )}
          </button>

          {/* Sidebar Content */}
          <Card className="w-[300px] h-full rounded-none border-l border-y-0 border-r-0 shadow-lg overflow-hidden flex flex-col">
            <CardHeader className="border-b bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                <span>Tips & Tricks</span>
              </CardTitle>
              <CardDescription>
                Quick tips to help you work faster
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {/* Tip 1 */}
                <div className="flex gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex-shrink-0 mt-0.5">
                    <span className="text-lg">💡</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      You can assign a default teacher to speed up lesson creation.
                    </p>
                  </div>
                </div>

                {/* Tip 2 */}
                <div className="flex gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex-shrink-0 mt-0.5">
                    <span className="text-lg">🕒</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      Use Availability to control when lessons can be scheduled.
                    </p>
                  </div>
                </div>

                {/* Tip 3 */}
                <div className="flex gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex-shrink-0 mt-0.5">
                    <span className="text-lg">🧭</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      Click the "?" icons to see detailed explanations of each field.
                    </p>
                  </div>
                </div>

                {/* Tip 4 */}
                <div className="flex gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex-shrink-0 mt-0.5">
                    <span className="text-lg">🧩</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      Use the Clone button to quickly duplicate a class with all its settings.
                    </p>
                  </div>
                </div>

                {/* Tip 5 */}
                <div className="flex gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex-shrink-0 mt-0.5">
                    <span className="text-lg">⚡</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      Use batch creation to quickly set up multiple classes for different grades.
                    </p>
                  </div>
                </div>

                {/* Tip 6 */}
                <div className="flex gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex-shrink-0 mt-0.5">
                    <span className="text-lg">🎯</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      Click on the periods count to expand and view the full weekly availability grid.
                    </p>
                  </div>
                </div>

                {/* Tip 7 */}
                <div className="flex gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex-shrink-0 mt-0.5">
                    <span className="text-lg">📋</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      Export your class list to Excel for easy sharing or backup.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <div className="border-t p-4">
              <Button
                variant="outline"
                className="w-full justify-between hover:bg-accent"
                onClick={() => onNavigate && onNavigate('docs-classes')}
              >
                <span>View Full Documentation</span>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
