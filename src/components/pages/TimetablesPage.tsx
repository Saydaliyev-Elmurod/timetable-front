import { apiCall } from '../../lib/api';
import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n/index';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import {
  Card,
  CardContent,
  CardHeader,
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
import {
  Plus,
  Eye,
  Trash2,
  FileSpreadsheet,
  FileText,
  Loader2,
  AlertCircle,
  Zap,
  Search,
  Download,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '../ui/alert';
import { PageContainer } from '../shared/PageContainer';
import { Pagination } from '../shared';
import { logger } from '../../lib/logger';
import { useGeneration } from '@/context/GenerationNotifier';

// API Types
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

// Foydalanuvchi yoqib/o'chira oladigan soft constraintlar katalogi.
// `key` backend `ConstraintKey` enum nomi bilan AYNAN mos kelishi shart. Penalty qiymatlari
// o'zgartirilmaydi — faqat enable/disable. Bu yerda yo'q constraintlar har doim ON ishlaydi.
type SoftConstraintOption = { key: string; label: string; hint: string };
const SOFT_CONSTRAINTS: SoftConstraintOption[] = [
  { key: 'CLASS_CONTINUITY', label: "Sinf darslarida bo'sh soat ('deraza') bo'lmasin", hint: "O'quvchilar darslari uzluksiz ketadi" },
  { key: 'MORNING_GRAVITY', label: 'Darslar erta boshlanib erta tugasin', hint: "Bo'sh birinchi soatlarning oldini oladi" },
  { key: 'SUBJECT_SPACING', label: 'Bir fan hafta kunlariga teng taqsimlansin', hint: 'Bir fan ketma-ket kunlarga tushib qolmaydi' },
  { key: 'ANTI_CONSECUTIVE_SAME_SUBJECT', label: 'Bir xil fan kunda ketma-ket kelmasin', hint: 'Para holatidan tashqari back-to-back takror' },
  { key: 'TEACHER_CONTINUITY', label: "O'qituvchi darslarida bo'sh soat bo'lmasin", hint: "O'qituvchi 'derazalari' kamayadi" },
  { key: 'BALANCED_LOAD', label: "Kunlik dars yuki muvozanatli bo'lsin", hint: "Bir kun 7 ta, boshqasi 2 ta bo'lib qolmaydi" },
  { key: 'NO_CONSECUTIVE_HEAVY_SUBJECTS', label: "Og'ir fanlar ketma-ket kelmasin", hint: 'Masalan matematika + fizika ketma-ket emas' },
  { key: 'TEACHER_DAY_COMPRESSION', label: "O'qituvchi ish kunlari ixcham bo'lsin", hint: "O'qituvchi kamroq kunda ishlaydi" },
];

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

export default function TimetablesPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { t } = useTranslation();
  const { watch } = useGeneration();
  const [timetables, setTimetables] = useState<TimetableEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [generateName, setGenerateName] = useState('');
  const [useSimpleAlgorithm, setUseSimpleAlgorithm] = useState(false);
  // O'chirilgan soft constraint kalitlari (default: bo'sh = barchasi yoqilgan).
  const [disabledSoft, setDisabledSoft] = useState<Set<string>>(new Set());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [confirmDel, setConfirmDel] = useState<{ id: string; name: string } | null>(null);

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
    try {
      const response = await apiCall<void>(`http://localhost:8080/api/timetable/v1/timetable/${id}`, {
        method: 'DELETE',
      });
      if (response.error) throw new Error(response.error.message);
      setTimetables(prev => prev.filter((t) => t.id !== id));
      toast.success("Jadval muvaffaqiyatli o'chirildi");
      setConfirmDel(null);
    } catch (err) {
      logger.error('Delete error:', err);
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
      logger.error('Export error:', error);
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
      logger.error('PDF export error:', error);
      toast.error('PDF eksport xatolik');
    }
  };

  return (
    <PageContainer size="full">
      {/* Page Header — clean, no gradients */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Dars Jadvallari
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Barcha yaratilgan dars jadvallarini boshqaring
          </p>
        </div>
        <Button
          onClick={() => setIsGenerateOpen(true)}
          className="bg-gray-900 hover:bg-gray-800 text-white shadow-sm transition-colors"
        >
          <Plus className="mr-2 h-4 w-4" />
          Yangi Jadval
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
      <Card className="border border-gray-200 shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="border-b border-gray-100 bg-white px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                Jadvallar
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Jami {filteredTimetables.length} ta jadval topildi
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Qidirish..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-9 h-9 text-sm border-gray-200 rounded-lg bg-gray-50 focus:bg-white transition-colors"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400 mr-3" />
              <span className="text-sm text-gray-500">Yuklanmoqda...</span>
            </div>
          ) : paginatedTimetables.length === 0 ? (
            <div className="text-center py-20">
              <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900">Jadvallar topilmadi</p>
              <p className="text-xs text-gray-500 mt-1">
                {searchQuery
                  ? "Qidiruv natijasi topilmadi. Boshqa so'z bilan urinib ko'ring."
                  : "Birinchi jadvalni yaratish uchun yuqoridagi tugmani bosing."
                }
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b border-gray-200 hover:bg-gray-50">
                    <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider pl-6">
                      Nomi
                    </TableHead>
                    <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider text-center w-[120px]">
                      Joylashgan
                    </TableHead>
                    <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider text-center w-[130px]">
                      Joylashmagan
                    </TableHead>
                    <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider w-[160px]">
                      Yaratilgan
                    </TableHead>
                    <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider text-right pr-6 w-[160px]">
                      Amallar
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTimetables.map((timetable, index) => (
                    <TableRow
                      key={timetable.id}
                      className={`group cursor-pointer transition-colors hover:bg-gray-50 ${index !== paginatedTimetables.length - 1 ? 'border-b border-gray-100' : ''
                        }`}
                      onClick={() => handleView(timetable)}
                    >
                      {/* Name */}
                      <TableCell className="pl-6 py-4">
                        <p className="text-sm font-medium text-gray-900 group-hover:text-gray-700 transition-colors">
                          {timetable.name}
                        </p>
                      </TableCell>

                      {/* Scheduled — green badge */}
                      <TableCell className="text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                          {timetable.scheduled ?? 0}
                        </span>
                      </TableCell>

                      {/* Unscheduled — conditional badge */}
                      <TableCell className="text-center">
                        {(timetable.unscheduled ?? 0) > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                            {timetable.unscheduled}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
                            0
                          </span>
                        )}
                      </TableCell>

                      {/* Created Date */}
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {formatDate(timetable.createdDate)}
                        </span>
                      </TableCell>

                      {/* Actions — icon buttons (always visible; emphasised on row hover) */}
                      <TableCell className="text-right pr-6">
                        <div className="flex gap-1 justify-end opacity-70 group-hover:opacity-100 transition-opacity">
                          {/* View */}
                          <button
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            onClick={(e) => { e.stopPropagation(); handleView(timetable); }}
                            title="Ko'rish"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Export Excel */}
                          <button
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                            onClick={(e) => { e.stopPropagation(); handleExportExcel(timetable); }}
                            title="Excel eksport"
                          >
                            <Download className="h-4 w-4" />
                          </button>

                          {/* Export PDF */}
                          <button
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                            onClick={(e) => { e.stopPropagation(); handleExportPDF(timetable); }}
                            title="PDF eksport"
                          >
                            <FileText className="h-4 w-4" />
                          </button>

                          {/* Delete */}
                          <button
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            onClick={(e) => { e.stopPropagation(); setConfirmDel({ id: timetable.id, name: timetable.name }); }}
                            title="O'chirish"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="px-6">
                <Pagination
                  page={currentPage - 1}
                  size={itemsPerPage}
                  totalPages={totalPages}
                  totalElements={filteredTimetables.length}
                  onPageChange={(p) => setCurrentPage(p + 1)}
                  onSizeChange={(s) => { setItemsPerPage(s); setCurrentPage(1); }}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Generate Timetable Dialog — minimal */}
      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Yangi jadval yaratish
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Jadval nomi kiriting va yaratish tugmasini bosing.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Jadval nomi</label>
              <Input
                placeholder="Masalan: 2024-yil 1-semester"
                value={generateName}
                onChange={(e) => setGenerateName(e.target.value)}
                className="h-10 border-gray-200"
                autoFocus
              />
            </div>
            <div className="flex items-center space-x-2 py-1">
              <Checkbox
                id="simple-algo"
                checked={useSimpleAlgorithm}
                onCheckedChange={(checked) => setUseSimpleAlgorithm(!!checked)}
              />
              <Label htmlFor="simple-algo" className="text-sm text-gray-700 cursor-pointer">
                Kichik maktablar uchun oddiy algoritm (Tezkor SA)
              </Label>
            </div>

            {/* Soft constraint toggles — qiymatlar o'zgarmaydi, faqat yoqish/o'chirish */}
            <div className="border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="flex items-center justify-between w-full text-sm font-medium text-gray-700"
              >
                <span>Qoidalar (soft cheklovlar)</span>
                <span className="text-xs text-gray-400">
                  {disabledSoft.size > 0
                    ? `${SOFT_CONSTRAINTS.length - disabledSoft.size}/${SOFT_CONSTRAINTS.length} yoqilgan`
                    : 'Barchasi yoqilgan'}
                </span>
              </button>
              {showAdvanced && (
                <div className="mt-2 space-y-2 max-h-56 overflow-y-auto pr-1">
                  {SOFT_CONSTRAINTS.map((sc) => {
                    const enabled = !disabledSoft.has(sc.key);
                    return (
                      <div key={sc.key} className="flex items-start space-x-2">
                        <Checkbox
                          id={`sc-${sc.key}`}
                          checked={enabled}
                          onCheckedChange={(checked) =>
                            setDisabledSoft((prev) => {
                              const next = new Set(prev);
                              if (checked) next.delete(sc.key);
                              else next.add(sc.key);
                              return next;
                            })
                          }
                          className="mt-0.5"
                        />
                        <Label
                          htmlFor={`sc-${sc.key}`}
                          className="text-sm text-gray-700 cursor-pointer leading-tight"
                        >
                          {sc.label}
                          <span className="block text-xs text-gray-400 font-normal">{sc.hint}</span>
                        </Label>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => { setIsGenerateOpen(false); setGenerateName(''); setUseSimpleAlgorithm(false); setDisabledSoft(new Set()); setShowAdvanced(false); }}
                className="text-sm"
              >
                Bekor qilish
              </Button>
              <Button
                onClick={async () => {
                  const name = generateName.trim();
                  if (!name) {
                    toast.error('Jadval nomini kiriting');
                    return;
                  }
                  setIsGenerating(true);
                  try {
                    const res = await apiCall<{ taskId: string }>('http://localhost:8080/api/timetable/v1/timetable/generate', {
                      method: 'POST',
                      body: JSON.stringify({
                        name,
                        useSimpleAlgorithm,
                        disabledSoftConstraints: Array.from(disabledSoft),
                      }),
                    });
                    if (res.error || !res.data?.taskId) {
                      toast.error(res.error?.message || "Jadval yaratib bo'lmadi");
                    } else {
                      // Generation is async: the backend only enqueues here and
                      // returns a taskId. The real result arrives over STOMP, so
                      // we subscribe and let GenerationProvider alert + navigate.
                      watch(res.data.taskId, {
                        name,
                        onComplete: () => fetchTimetables(),
                      });
                      toast.info(`"${name}" generatsiyasi boshlandi. Tayyor bo'lganda xabar beramiz…`);
                      setIsGenerateOpen(false);
                      setGenerateName('');
                      setUseSimpleAlgorithm(false);
                      setDisabledSoft(new Set());
                      setShowAdvanced(false);
                    }
                  } catch (err) {
                    logger.error('Generate error', err);
                    toast.error('Jadval yaratishda xatolik');
                  } finally {
                    setIsGenerating(false);
                  }
                }}
                disabled={isGenerating || !generateName.trim()}
                className="bg-gray-900 hover:bg-gray-800 text-white text-sm min-w-[120px]"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Yaratilmoqda...
                  </>
                ) : (
                  'Yaratish'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modals */}
      {confirmDel && (
        <ConfirmDialog 
          title={t('timetables.delete_title', "Jadvalni o'chirish")}
          desc={t('timetables.delete_desc', `"${confirmDel.name}" jadvalini o'chirishni tasdiqlaysizmi?`)}
          onConfirm={() => handleDelete(confirmDel.id)}
          onClose={() => setConfirmDel(null)}
        />
      )}
    </PageContainer>
  );
}

// ─── Shared Components ──────────────────────────────────────────────────

function ConfirmDialog({ title, desc, onConfirm, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-[400px] shadow-2xl p-6" style={{ boxShadow: '0 20px 50px -12px rgba(0,0,0,0.2)' }}>
        <h3 className="text-[20px] font-extrabold text-slate-900 font-plus-jakarta mb-2">{title}</h3>
        <p className="text-[14px] font-medium text-slate-500 font-manrope mb-6">{desc}</p>
        <div className="flex justify-end gap-2.5">
          <button 
            onClick={onClose}
            className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-[14px] font-manrope cursor-pointer hover:bg-slate-50 transition-colors"
          >
            Bekor
          </button>
          <button 
            onClick={onConfirm}
            className="h-10 px-5 rounded-xl border-0 bg-rose-500 text-white font-bold text-[14px] font-manrope cursor-pointer hover:bg-rose-600 transition-colors"
          >
            O'chirish
          </button>
        </div>
      </div>
    </div>
  );
}