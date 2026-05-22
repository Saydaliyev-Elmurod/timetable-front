import { useState } from 'react';
import { toast } from 'sonner';
import { apiCall } from '@/lib/api';
import { Lesson, TimetableMeta, UnplacedLesson } from '../timetable-view/types';
import { logger } from '../../../lib/logger';
import { useGeneration } from '@/context/GenerationNotifier';

const BASE = 'http://localhost:8080/api/timetable/v1/timetable';

interface UseTimetableActionsArgs {
  timetableId: string | undefined;
  timetableMeta: TimetableMeta | null;
  setScheduledLessons: React.Dispatch<React.SetStateAction<Lesson[]>>;
  refetchData: () => Promise<void>;
  refetchMeta: () => Promise<void>;
}

export function useTimetableActions({
  timetableId,
  timetableMeta,
  setScheduledLessons,
  refetchData,
  refetchMeta,
}: UseTimetableActionsArgs) {
  const { watch } = useGeneration();
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const handleEdit = (lesson: Lesson | UnplacedLesson) => {
    logger.log('Edit lesson:', lesson);
  };

  const handleToggleLock = (lesson: Lesson | UnplacedLesson) => {
    setScheduledLessons((prev) =>
      prev.map((l) => (l.id === lesson.id ? { ...l, isLocked: !l.isLocked } : l)),
    );
  };

  const handleOptimize = async () => {
    if (!timetableId) {
      toast.error('Optimallashtirish uchun jadval tanlanmagan');
      return;
    }
    setIsProcessingAction(true);
    toast.info('Jadval optimallashtirilmoqda...');

    const body = {
      applySoftConstraint: true,
      applyUnScheduledLessons: true,
      applyContinuityPenaltyTeacher: true,
      applyContinuityPenaltyClass: true,
      applyBalancedLoad: true,
      applyDailySubjectDistribution: true,
    };

    try {
      const res = await apiCall<{ taskId: string }>(`${BASE}/optimize/${timetableId}`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      if (res.error || !res.data?.taskId) {
        toast.error('Optimallashtirish xatolik', { description: res.error?.message });
        setIsProcessingAction(false);
        return;
      }
      // Optimize is async: the backend returns a taskId and runs on the solver
      // thread pool. The real SUCCESS/ERROR arrives over STOMP — keep the
      // spinner on and let GenerationProvider surface the result.
      watch(res.data.taskId, {
        successMessage: 'Optimallashtirish yakunlandi',
        showViewAction: false, // already on this timetable's page
        onComplete: async () => {
          try {
            await Promise.all([refetchData(), refetchMeta()]); // re-GET + redraw
          } catch {
            // ignore refresh errors
          }
          setIsProcessingAction(false);
        },
        onError: () => setIsProcessingAction(false),
      });
    } catch (err) {
      logger.error('Optimize error:', err);
      toast.error("Optimallashtirish so'rovi amalga oshmadi");
      setIsProcessingAction(false);
    }
  };

  const handleExport = async () => {
    if (!timetableId) return;
    try {
      toast.info('PDF eksport qilinmoqda...');
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${BASE}/export/pdf/${timetableId}`, {
        method: 'GET',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      if (!response.ok) throw new Error('PDF eksport xatolik');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${timetableMeta?.name || 'timetable'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('PDF muvaffaqiyatli yuklandi!');
    } catch (err) {
      logger.error('PDF export error:', err);
      toast.error('PDF eksport xatolik');
    }
  };

  return {
    isProcessingAction,
    handleEdit,
    handleToggleLock,
    handleOptimize,
    handleExport,
  };
}
