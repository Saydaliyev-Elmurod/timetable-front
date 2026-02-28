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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';
import {
  Plus,
  Eye,
  Trash2,
  FileSpreadsheet,
  FileText,
  Loader2,
  AlertCircle,
  Zap,
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '../ui/alert';

// API Types — TimetableResponse.java dan olingan
interface TimetableEntity {
  id: string;
  taskId: string;
  name: string;
  scheduled: number | null;
  unscheduled: number | null;
  score: number | null;
  teacherGaps: number | null;
  classGaps: number | null;
  deleted: boolean;
  createdDate: string;
  updatedDate: string;
}

// Score rangini aniqlash
const getScoreColor = (score: number | null): string => {
  if (score === null || score === undefined) return 'text-gray-400';
  if (score >= 90) return 'text-emerald-600';
  if (score >= 70) return 'text-green-600';
  if (score >= 50) return 'text-yellow-600';
  if (score >= 30) return 'text-orange-500';
  return 'text-red-500';
};

const getScoreBg = (score: number | null): string => {
  if (score === null || score === undefined) return 'bg-gray-100 text-gray-500';
  if (score >= 90) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (score >= 70) return 'bg-green-50 text-green-700 border-green-200';
  if (score >= 50) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
  if (score >= 30) return 'bg-orange-50 text-orange-700 border-orange-200';
  return 'bg-red-50 text-red-700 border-red-200';
};

const getScoreLabel = (score: number | null): string => {
  if (score === null || score === undefined) return '—';
  if (score >= 90) return "A'lo";
  if (score >= 70) return 'Yaxshi';
  if (score >= 50) return "O'rta";
  if (score >= 30) return 'Past';
  return 'Yomon';
};

export default function TimetablesPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { t } = useTranslation();
  const [timetables, setTimetables] = useState<TimetableEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [generateName, setGenerateName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
      const activeTimetables = data.filter(t => !t.deleted);
      setTimetables(activeTimetables);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch timetables';
      setError(errorMessage);
      toast.error(errorMessage);
      setTimetables([]);
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
    return filteredTimetables.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredTimetables, currentPage, itemsPerPage]);

  const handleView = (timetable: TimetableEntity) => {
    if (onNavigate) {
      onNavigate(`timetable-view-${timetable.id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('timetables.delete_confirm') || "Rostdan ham bu jadvalni o'chirmoqchimisiz?")) {
      return;
    }
    try {
      const response = await apiCall<void>(`http://localhost:8080/api/timetable/v1/timetable/${id}`, {
        method: 'DELETE',
      });
      if (response.error) throw new Error(response.error.message);
      setTimetables(prev => prev.filter((t) => t.id !== id));
      toast.success("Jadval muvaffaqiyatli o'chirildi");
    } catch (err) {
      console.error('Delete error:', err);
      toast.error("Jadvalni o'chirishda xatolik");
    }
  };

  const handleExportExcel = async (timetable: TimetableEntity) => {
    try {
      toast.info(`"${timetable.name}" Excel formatda yuklanmoqda...`);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:8080/api/timetable/v1/timetable/export/${timetable.id}`, {
        method: 'GET',
        headers: { 'Authorization': token ? `Bearer ${token}` : '' },
      });
      if (!response.ok) throw new Error(`Export failed: ${response.statusText}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${timetable.name || 'timetable'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`"${timetable.name}" Excel formatda yuklandi!`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Excel eksport xatolik');
    }
  };

  const handleExportPDF = async (timetable: TimetableEntity) => {
    try {
      toast.info(`"${timetable.name}" PDF formatda yuklanmoqda...`);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:8080/api/timetable/v1/timetable/export/pdf/${timetable.id}`, {
        method: 'GET',
        headers: { 'Authorization': token ? `Bearer ${token}` : '' },
      });
      if (!response.ok) throw new Error(`PDF export failed: ${response.statusText}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${timetable.name || 'timetable'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`"${timetable.name}" PDF formatda yuklandi!`);
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('PDF eksport xatolik');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('uz-UZ', {
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
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Dars Jadvallari
          </h2>
          <p className="text-muted-foreground mt-1">
            Barcha yaratilgan dars jadvallarini boshqaring
          </p>
        </div>
        <Button
          onClick={() => setIsGenerateOpen(true)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-200 transition-all hover:shadow-xl hover:shadow-indigo-300"
          size="lg"
        >
          <Plus className="mr-2 h-5 w-5" />
          Yangi Jadval Yaratish
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Table Card */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Jadvallar ro'yxati</CardTitle>
              <CardDescription>
                Jami {filteredTimetables.length} ta jadval
              </CardDescription>
            </div>
            <Input
              placeholder="Jadval nomini qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs h-10 rounded-lg"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mr-3" />
              <span className="text-muted-foreground">Jadvallar yuklanmoqda...</span>
            </div>
          ) : paginatedTimetables.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-indigo-400" />
              </div>
              <p className="font-medium text-gray-700 mb-1">Hali jadval yaratilmagan</p>
              <p className="text-sm">Birinchi dars jadvalingizni yaratish uchun yuqoridagi tugmani bosing.</p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/80">
                      <TableHead className="font-semibold text-gray-700">Nomi</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-center w-[100px]">
                        <div className="flex items-center justify-center gap-1">
                          <Trophy className="h-3.5 w-3.5 text-amber-500" />
                          Ball
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 text-center w-[110px]">
                        <div className="flex items-center justify-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          Joylashgan
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 text-center w-[120px]">
                        <div className="flex items-center justify-center gap-1">
                          <XCircle className="h-3.5 w-3.5 text-red-400" />
                          Joylashmagan
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 text-center w-[110px]">
                        O'qit. Oynalari
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 text-center w-[100px]">
                        Sinf Oynalari
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 w-[160px]">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          Yaratilgan
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 text-right w-[180px]">Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTimetables.map((timetable) => {
                      const totalLessons = (timetable.scheduled || 0) + (timetable.unscheduled || 0);
                      const integrity = totalLessons > 0
                        ? Math.round(((timetable.scheduled || 0) / totalLessons) * 100)
                        : 0;

                      return (
                        <TableRow
                          key={timetable.id}
                          className="group hover:bg-indigo-50/40 transition-colors cursor-pointer"
                          onClick={() => handleView(timetable)}
                        >
                          {/* Nomi */}
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-800 group-hover:text-indigo-700 transition-colors truncate">
                                  {timetable.name}
                                </p>
                                {/* Mini progress bar */}
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${integrity >= 90
                                          ? 'bg-emerald-400'
                                          : integrity >= 50
                                            ? 'bg-yellow-400'
                                            : 'bg-red-400'
                                        }`}
                                      style={{ width: `${integrity}%` }}
                                    />
                                  </div>
                                  <span className="text-[11px] text-gray-400">{integrity}%</span>
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          {/* Score */}
                          <TableCell className="text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${getScoreBg(timetable.score)}`}>
                              {timetable.score !== null && timetable.score !== undefined ? (
                                <>
                                  {timetable.score}
                                  <span className="text-[10px] font-medium opacity-75">
                                    {getScoreLabel(timetable.score)}
                                  </span>
                                </>
                              ) : '—'}
                            </span>
                          </TableCell>

                          {/* Scheduled */}
                          <TableCell className="text-center">
                            <span className="text-sm font-semibold text-green-700">
                              {timetable.scheduled ?? 0}
                            </span>
                          </TableCell>

                          {/* Unscheduled */}
                          <TableCell className="text-center">
                            <span className={`text-sm font-semibold ${(timetable.unscheduled ?? 0) > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                              {timetable.unscheduled ?? 0}
                            </span>
                          </TableCell>

                          {/* Teacher Gaps */}
                          <TableCell className="text-center">
                            <span className={`text-sm font-medium ${(timetable.teacherGaps ?? 0) > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                              {timetable.teacherGaps ?? 0}
                            </span>
                          </TableCell>

                          {/* Class Gaps */}
                          <TableCell className="text-center">
                            <span className={`text-sm font-medium ${(timetable.classGaps ?? 0) > 0 ? 'text-purple-600' : 'text-gray-400'}`}>
                              {timetable.classGaps ?? 0}
                            </span>
                          </TableCell>

                          {/* Date */}
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDate(timetable.createdDate)}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 gap-1.5"
                                onClick={(e) => { e.stopPropagation(); handleView(timetable); }}
                              >
                                <Eye className="h-4 w-4" />
                                Ko'rish
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={(e) => { e.stopPropagation(); handleExportExcel(timetable); }}
                                title="Excel eksport"
                              >
                                <FileSpreadsheet className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={(e) => { e.stopPropagation(); handleExportPDF(timetable); }}
                                title="PDF eksport"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                onClick={(e) => { e.stopPropagation(); handleDelete(timetable.id); }}
                                title="O'chirish"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredTimetables.length)} / {filteredTimetables.length} jadval
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Oldingi
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Keyingi
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Generate Timetable Dialog */}
      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                <Zap className="h-5 w-5 text-white" />
              </div>
              Yangi Jadval Yaratish
            </DialogTitle>
            <DialogDescription>
              Tashkilot ma'lumotlari asosida avtomatik dars jadvali yaratiladi.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Jadval nomi</label>
              <Input
                placeholder="Masalan: 2024-yil 1-semester"
                value={generateName}
                onChange={(e) => setGenerateName(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsGenerateOpen(false)}>
                Bekor qilish
              </Button>
              <Button
                onClick={async () => {
                  if (!generateName.trim()) {
                    toast.error('Jadval nomini kiriting');
                    return;
                  }
                  setIsGenerating(true);
                  try {
                    const res = await apiCall<any>('http://localhost:8080/api/timetable/v1/timetable/generate', {
                      method: 'POST',
                      body: JSON.stringify({ name: generateName.trim() }),
                    });

                    if (res.error) {
                      toast.error(res.error.message || "Jadval yaratib bo'lmadi");
                    } else {
                      toast.success('Jadval muvaffaqiyatli yaratildi!');
                      setIsGenerateOpen(false);
                      setGenerateName('');
                      await fetchTimetables();
                    }
                  } catch (err) {
                    console.error('Generate error', err);
                    toast.error('Jadval yaratishda xatolik');
                  } finally {
                    setIsGenerating(false);
                  }
                }}
                disabled={isGenerating}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 min-w-[140px]"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Yaratilmoqda...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Yaratish
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}