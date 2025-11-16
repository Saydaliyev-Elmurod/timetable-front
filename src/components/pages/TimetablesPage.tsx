import { apiCall } from '../../lib/api';
import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n/index';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
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
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';
import { Plus, Download, Eye, Trash2, FileSpreadsheet, FileText, Printer, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Alert, AlertDescription } from '../ui/alert';

// API Types
interface TimetableEntity {
  id: string;
  orgId: number;
  taskId: string;
  name: string;
  deleted: boolean;
  createdDate: string;
  updatedDate: string;
}

export default function TimetablesPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { t } = useTranslation();
  const [timetables, setTimetables] = useState<TimetableEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTimetable, setSelectedTimetable] = useState<TimetableEntity | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterClass, setFilterClass] = useState('all');
  const [filterTeacher, setFilterTeacher] = useState('all');
  const itemsPerPage = 10;

  // Fetch timetables from API
  useEffect(() => {
    fetchTimetables();
  }, []);

  const fetchTimetables = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiCall<TimetableEntity[]>('http://localhost:8080/api/timetable/v1/timetable');
      
      if (response.error) {
        throw new Error(`Failed to fetch timetables: ${response.error.message}`);
      }
      
      const data = response.data || [];
      console.log('API Response:', data);
      
      // Filter out deleted timetables
      const activeTimetables = data.filter(t => !t.deleted);
      console.log('Active Timetables:', activeTimetables);
      setTimetables(activeTimetables);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch timetables';
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Fallback to mock data for demo purposes
      setTimetables([
        {
          id: '1',
          orgId: 1,
          taskId: 'task-1',
          name: 'Semester 1 - 2024',
          deleted: false,
          createdDate: new Date('2024-09-15T10:30:00').toISOString(),
          updatedDate: new Date('2024-09-15T10:30:00').toISOString(),
        },
        {
          id: '2',
          orgId: 1,
          taskId: 'task-2',
          name: 'Semester 2 - 2024',
          deleted: false,
          createdDate: new Date('2024-09-20T14:15:00').toISOString(),
          updatedDate: new Date('2024-09-20T14:15:00').toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTimetables = React.useMemo(() => {
    if (!searchQuery) return timetables;
    return timetables.filter((timetable) =>
      (timetable.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [timetables, searchQuery]);

  const totalPages = Math.ceil(filteredTimetables.length / itemsPerPage);
  const paginatedTimetables = React.useMemo(() => {
    const paginated = filteredTimetables.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
    console.log('Paginated Timetables:', paginated);
    return paginated;
  }, [filteredTimetables, currentPage, itemsPerPage]);

  const handleView = (timetable: TimetableEntity) => {
    if (onNavigate) {
      // Navigate to the full-page timetable view with actual ID
      onNavigate(`timetable-view-${timetable.id}`);
    } else {
      // Fallback to modal if onNavigate is not available
      setSelectedTimetable(timetable);
      setIsViewDialogOpen(true);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // In a real implementation, you would call DELETE API
      // For now, we'll just remove from the list
      setTimetables(timetables.filter((t) => t.id !== id));
      toast.success(t('timetables.deleted_success'));
    } catch (err) {
      toast.error(t('timetables.delete_failed'));
    }
  };

  const handleExportExcel = (timetable: TimetableEntity) => {
    toast(t('timetables.exporting_excel').replace('{{name}}', timetable.name));
  };

  const handleExportPDF = (timetable: TimetableEntity) => {
    toast(t('timetables.exporting_pdf').replace('{{name}}', timetable.name));
  };

  const handlePrint = () => {
    window.print();
    toast(t('timetables.opening_print'));
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2>{t('timetables.title')}</h2>
          <p className="text-muted-foreground">{t('timetables.description')}</p>
        </div>
        <div className="flex gap-3">
          {onNavigate && (
            <Button 
              variant="outline"
              onClick={() => onNavigate('timetable-view')}
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <Eye className="mr-2 h-4 w-4" />
              {t('timetables.interactive_view')}
            </Button>
          )}
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('timetables.generate')}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error} - {t('timetables.showing_demo')}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{t('timetables.all_title')}</CardTitle>
              <CardDescription>{t('timetables.all_description')}</CardDescription>
            </div>
            <Input
              placeholder={t('timetables.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">{t('timetables.loading')}</span>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Updated At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTimetables.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        No timetables found. Create your first timetable to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedTimetables.map((timetable) => (
                      <TableRow key={timetable.id}>
                        <TableCell>
                          <Badge variant="outline">{timetable.id.substring(0, 8)}</Badge>
                        </TableCell>
                        <TableCell>{timetable.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(timetable.createdDate)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(timetable.updatedDate)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleView(timetable)}
                              title="View Timetable"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleExportExcel(timetable)}
                              title="Export to Excel"
                            >
                              <FileSpreadsheet className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleExportPDF(timetable)}
                              title="Export to PDF"
                            >
                              <FileText className="h-4 w-4 text-red-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(timetable.id)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {paginatedTimetables.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-muted-foreground">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                    {Math.min(currentPage * itemsPerPage, filteredTimetables.length)} of{' '}
                    {filteredTimetables.length} timetables
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* View Timetable Dialog - This is a simplified preview */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedTimetable?.name}</DialogTitle>
            <DialogDescription>
              Created on {selectedTimetable && formatDate(selectedTimetable.createdDate)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-muted-foreground mb-4">
              Click the button below to view the full interactive timetable.
            </p>
            <Button 
              className="w-full"
              onClick={() => {
                if (selectedTimetable && onNavigate) {
                  onNavigate(`timetable-view-${selectedTimetable.id}`);
                  setIsViewDialogOpen(false);
                }
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              Open Interactive View
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}