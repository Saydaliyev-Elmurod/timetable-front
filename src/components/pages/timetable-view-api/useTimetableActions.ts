import { useState } from 'react';
import { toast } from 'sonner';
import {
  ActionResponse,
  TimetableActionRequest,
  ValidationResponse,
  timetableActionApi,
} from '../../api/timetableActionApi';
import { apiCall } from '@/lib/api';
import { DAY_LABELS } from '../timetable-view/constants';
import { Lesson, TimetableMeta, UnplacedLesson } from '../timetable-view/types';
import { logger } from '../../../lib/logger';

const BASE = 'http://localhost:8080/api/timetable/v1/timetable';

interface UseTimetableActionsArgs {
  timetableId: string | undefined;
  timetableMeta: TimetableMeta | null;
  scheduledLessons: Lesson[];
  unplacedLessons: UnplacedLesson[];
  setScheduledLessons: React.Dispatch<React.SetStateAction<Lesson[]>>;
  setUnplacedLessons: React.Dispatch<React.SetStateAction<UnplacedLesson[]>>;
  refetchData: () => Promise<void>;
  refetchMeta: () => Promise<void>;
}

export function useTimetableActions({
  timetableId,
  timetableMeta,
  scheduledLessons,
  unplacedLessons,
  setScheduledLessons,
  setUnplacedLessons,
  refetchData,
  refetchMeta,
}: UseTimetableActionsArgs) {
  const [timetableVersion, setTimetableVersion] = useState(1);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const handleDrop = async (
    draggedLesson: Lesson,
    targetDay: string,
    targetTimeSlot: number,
  ) => {
    if (isProcessingAction) return;

    const targetLesson = scheduledLessons.find(
      (l) => l.day === targetDay && l.timeSlot === targetTimeSlot && l.class === draggedLesson.class,
    );
    const isUnplacedLesson = unplacedLessons.some((l) => l.id === draggedLesson.id);

    let actionRequest: TimetableActionRequest;
    let actionDescription = '';

    if (targetLesson && targetLesson.id !== draggedLesson.id) {
      actionRequest = {
        action_type: 'SWAP_LESSONS',
        timetable_version: timetableVersion,
        payload: {
          lesson_a: {
            id: draggedLesson.id,
            source_position: {
              day: draggedLesson.day || '',
              hour: draggedLesson.timeSlot || 0,
              room_id: draggedLesson.roomId,
            },
          },
          lesson_b: {
            id: targetLesson.id,
            source_position: {
              day: targetLesson.day || '',
              hour: targetLesson.timeSlot || 0,
              room_id: targetLesson.roomId,
            },
          },
        },
      };
      actionDescription = `Swap ${draggedLesson.subject} with ${targetLesson.subject}`;
    } else if (isUnplacedLesson) {
      actionRequest = {
        action_type: 'PLACE_UNPLACED_LESSON',
        timetable_version: timetableVersion,
        payload: {
          lesson_id: draggedLesson.id,
          target_position: {
            day: targetDay,
            hour: targetTimeSlot,
            room_id: draggedLesson.roomId || 0,
          },
        },
      };
      actionDescription = `Place ${draggedLesson.subject} to ${DAY_LABELS[targetDay]}, Period ${targetTimeSlot}`;
    } else {
      actionRequest = {
        action_type: 'MOVE_LESSON',
        timetable_version: timetableVersion,
        payload: {
          lesson_id: draggedLesson.id,
          source_position: {
            day: draggedLesson.day || '',
            hour: draggedLesson.timeSlot || 0,
            room_id: draggedLesson.roomId,
          },
          target_position: {
            day: targetDay,
            hour: targetTimeSlot,
            room_id: draggedLesson.roomId || 0,
          },
        },
      };
      actionDescription = `Move ${draggedLesson.subject} to ${DAY_LABELS[targetDay]}, Period ${targetTimeSlot}`;
    }

    try {
      setIsProcessingAction(true);

      const validation: ValidationResponse = await timetableActionApi.validateMove(
        timetableId || '1',
        actionRequest,
      );
      if (!validation.valid) {
        const errorMessage = validation.errors?.join(', ') || 'Invalid action';
        toast.error('Cannot perform action', { description: errorMessage });
        return;
      }
      if (validation.warnings && validation.warnings.length > 0) {
        toast.warning('Action has warnings', { description: validation.warnings.join(', ') });
      }

      const result: ActionResponse = await timetableActionApi.applyAction(
        timetableId || '1',
        actionRequest,
      );
      if (!result.success) {
        const errorMessage = result.errors?.join(', ') || 'Failed to apply action';
        toast.error('Action failed', { description: errorMessage });
        return;
      }

      setTimetableVersion(result.new_version);

      if (actionRequest.action_type === 'SWAP_LESSONS') {
        setScheduledLessons((prev) =>
          prev.map((l) => {
            if (l.id === draggedLesson.id) {
              return {
                ...l,
                day: targetDay,
                timeSlot: targetTimeSlot,
                roomId: targetLesson!.roomId,
              };
            } else if (l.id === targetLesson!.id) {
              return {
                ...l,
                day: draggedLesson.day!,
                timeSlot: draggedLesson.timeSlot!,
                roomId: draggedLesson.roomId,
              };
            }
            return l;
          }),
        );
      } else if (actionRequest.action_type === 'PLACE_UNPLACED_LESSON') {
        setUnplacedLessons((prev) => prev.filter((l) => l.id !== draggedLesson.id));
        setScheduledLessons((prev) => [
          ...prev,
          { ...draggedLesson, day: targetDay, timeSlot: targetTimeSlot },
        ]);
      } else {
        setScheduledLessons((prev) =>
          prev.map((l) =>
            l.id === draggedLesson.id ? { ...l, day: targetDay, timeSlot: targetTimeSlot } : l,
          ),
        );
      }

      const qualityInfo = result.soft_constraint_impact?.new_quality_score
        ? ` (Quality: ${result.soft_constraint_impact.new_quality_score}%)`
        : '';
      toast.success(result.message || 'Action completed successfully', {
        description: actionDescription + qualityInfo,
      });

      if (
        result.soft_constraint_impact?.warnings
        && result.soft_constraint_impact.warnings.length > 0
      ) {
        setTimeout(() => {
          toast.info('Scheduling Impact', {
            description: result.soft_constraint_impact!.warnings!.join(', '),
          });
        }, 500);
      }
    } catch (err) {
      logger.error('Action error:', err);
      toast.error('Failed to process action', {
        description: err instanceof Error ? err.message : 'Unknown error occurred',
      });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleEdit = (lesson: Lesson | UnplacedLesson) => {
    logger.log('Edit lesson:', lesson);
  };

  const handleDelete = (lesson: Lesson | UnplacedLesson) => {
    setScheduledLessons((prev) => prev.filter((l) => l.id !== lesson.id));
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
      const res = await apiCall<any>(`${BASE}/optimize/${timetableId}`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      if (res.error) {
        toast.error('Optimallashtirish xatolik', { description: res.error.message });
      } else {
        toast.success('Optimallashtirish muvaffaqiyatli!');
        try {
          await Promise.all([refetchData(), refetchMeta()]);
        } catch {
          // ignore refresh errors
        }
      }
    } catch (err) {
      logger.error('Optimize error:', err);
      toast.error("Optimallashtirish so'rovi amalga oshmadi");
    } finally {
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
    timetableVersion,
    isProcessingAction,
    handleDrop,
    handleEdit,
    handleDelete,
    handleToggleLock,
    handleOptimize,
    handleExport,
  };
}
