import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { apiCall } from '@/lib/api';
import { organizationApi } from '../../../api/organizationApi';
import {
  ClassResponse,
  GroupResponse,
  Lesson,
  RoomResponse,
  SubjectResponse,
  TeacherResponse,
  TimetableAPIResponse,
  TimetableDataEntity,
  TimetableMeta,
  UnplacedLesson,
} from '../timetable-view/types';
import { logger } from '../../../lib/logger';

const BASE = 'http://localhost:8080/api/timetable/v1/timetable';

interface UseTimetableDataResult {
  isLoading: boolean;
  error: string | null;

  /** Joriy (eng katta) versiya — optimistik concurrency uchun (backend in-place yangilaydi). */
  version: number;
  timetableData: TimetableDataEntity[];
  timetableMeta: TimetableMeta | null;
  apiTeachers: TeacherResponse[];
  apiClasses: ClassResponse[];
  apiSubjects: SubjectResponse[];

  scheduledLessons: Lesson[];
  unplacedLessons: UnplacedLesson[];
  companyPeriods: number[];

  setScheduledLessons: React.Dispatch<React.SetStateAction<Lesson[]>>;
  setUnplacedLessons: React.Dispatch<React.SetStateAction<UnplacedLesson[]>>;

  refetchData: () => Promise<void>;
  refetchMeta: () => Promise<void>;
}

function processAPIData(
  data: TimetableDataEntity[],
  classes: ClassResponse[],
  teachers: TeacherResponse[],
  subjects: SubjectResponse[],
  rooms: RoomResponse[],
  groups: GroupResponse[],
): { scheduled: Lesson[]; unplaced: UnplacedLesson[] } {
  const classMap = new Map(classes.map((c) => [c.id, c]));
  const teacherMap = new Map(teachers.map((t) => [t.id, t]));
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const roomMap = new Map(rooms.map((r) => [r.id, r]));
  const groupMap = new Map(groups.map((g) => [g.id, g]));

  const scheduled: Lesson[] = [];
  const unplaced: UnplacedLesson[] = [];

  data.forEach((entry) => {
    const classInfo = classMap.get(entry.classId);

    if (entry.isScheduled && entry.slotDetails && entry.slotDetails.length > 0) {
      entry.slotDetails.forEach((detail, index) => {
        const className = classInfo?.shortName || `Class ${entry.classId}`;
        const classId = classInfo?.id || entry.classId;
        // Karta id'si HAR doim slot+detal bo'yicha noyob bo'lishi shart — u React key
        // hamda editor'dagi Map kaliti (useTimetableEditor.applyChanges/computeDiff/undo).
        // `detail.lessonId` bir nechta slotda takrorlanishi mumkin (ko'p soatli dars yoki
        // bir katakdagi guruh bo'linishi) → uni yolg'iz ishlatib bo'lmaydi, aks holda
        // bir xil id'li kartalar Map'da ustma-ust tushib, biri yo'qoladi. Haqiqiy
        // lessonId backend sinxron uchun `rawDetails` da saqlanadi (qarang: numericLessonId).
        const cardId = `${entry.id}-${index}`;

        const subj = subjectMap.get(detail.subjectId);
        const tch = teacherMap.get(detail.teacherId);
        const rm = roomMap.get(detail.roomId);
        const grp = detail.groupId ? groupMap.get(detail.groupId) : null;

        scheduled.push({
          id: cardId,
          subject: subj?.name || 'Unknown Subject',
          subjectId: detail.subjectId || 0,
          teacher: tch?.fullName || 'No Teacher',
          teacherId: detail.teacherId || 0,
          teacherShort: tch?.shortName || tch?.fullName || '',
          room: rm ? rm.name : 'No Room',
          roomId: detail.roomId || 0,
          class: className,
          classId,
          day: entry.dayOfWeek,
          timeSlot: entry.hour,
          isLocked: false,
          groupName: grp?.name,
          groupId: detail.groupId ?? undefined,
          weekIndex: entry.weekIndex ?? undefined,
          isBiWeekly: entry.weekIndex !== null,
          rawDetails: detail,
        });
      });
    }

    if (!entry.isScheduled && entry.unscheduledData) {
      const ud = entry.unscheduledData;
      const subj = subjectMap.get(ud.subjectId);
      const tch = teacherMap.get(ud.teacherId);
      const cls = classMap.get(ud.classId);

      const roomsList = ud.roomIds ? ud.roomIds.map((rid) => roomMap.get(rid)).filter((r) => r) : [];
      const roomName = roomsList.length > 0 ? roomsList.map((r) => r!.name).join(', ') : 'TBD';
      const firstRoomId = roomsList.length > 0 ? roomsList[0]!.id : 0;

      unplaced.push({
        id: entry.id,
        subject: subj?.name || 'Unknown Subject',
        subjectId: ud.subjectId || 0,
        teacher: tch?.fullName || 'No Teacher',
        teacherId: ud.teacherId || 0,
        teacherShort: tch?.shortName || tch?.fullName || '',
        room: roomName,
        roomId: firstRoomId,
        class: cls?.shortName || 'Unknown Class',
        classId: ud.classId || 0,
        isLocked: false,
        reason: `Missing ${ud.missingCount} out of ${ud.requiredCount} required lessons`,
        requiredCount: ud.requiredCount,
        scheduledCount: ud.scheduledCount,
        missingCount: ud.missingCount,
      });
    }
  });

  return { scheduled, unplaced };
}

export function useTimetableData(timetableId: string | undefined): UseTimetableDataResult {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [timetableData, setTimetableData] = useState<TimetableDataEntity[]>([]);
  const [timetableMeta, setTimetableMeta] = useState<TimetableMeta | null>(null);

  const [apiTeachers, setApiTeachers] = useState<TeacherResponse[]>([]);
  const [apiClasses, setApiClasses] = useState<ClassResponse[]>([]);
  const [apiSubjects, setApiSubjects] = useState<SubjectResponse[]>([]);

  const [scheduledLessons, setScheduledLessons] = useState<Lesson[]>([]);
  const [unplacedLessons, setUnplacedLessons] = useState<UnplacedLesson[]>([]);
  const [companyPeriods, setCompanyPeriods] = useState<number[]>([]);

  // Org-level period count.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const org = await organizationApi.get();
        if (cancelled || !org?.periods) return;
        const nonBreakCount = org.periods.filter((p) => !p.isBreak).length;
        const next = Array.from({ length: nonBreakCount }, (_, i) => i + 1);
        if (next.length > 0) setCompanyPeriods(next);
      } catch (e) {
        logger.error('Failed to fetch organization settings:', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const refetchMeta = useCallback(async () => {
    if (!timetableId) return;
    try {
      const res = await apiCall<TimetableMeta[]>(BASE);
      if (res.data) {
        const meta = res.data.find((t) => t.id === timetableId);
        if (meta) setTimetableMeta(meta);
      }
    } catch (err) {
      logger.error('Failed to fetch timetable metadata:', err);
    }
  }, [timetableId]);

  const refetchData = useCallback(async () => {
    if (!timetableId) return;
    try {
      setIsLoading(true);
      setError(null);

      const res = await apiCall<TimetableAPIResponse>(`${BASE}/${timetableId}`);
      if (res.error) throw res.error;
      if (!res.data) throw new Error('Empty response from server');

      const r = res.data;
      const td = r.timetableData || [];
      const classes = r.classes || [];
      const teachers = r.teachers || [];
      const subjects = r.subjects || [];
      const rooms = r.rooms || [];
      const groups = r.groups || [];

      setTimetableData(td);
      setApiTeachers(teachers);
      setApiClasses(classes);
      setApiSubjects(subjects);

      const { scheduled, unplaced } = processAPIData(td, classes, teachers, subjects, rooms, groups);
      setScheduledLessons(scheduled);
      setUnplacedLessons(unplaced);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch timetable data';
      setError(errorMessage);
      toast.error(errorMessage);
      setScheduledLessons([]);
      setUnplacedLessons([]);
    } finally {
      setIsLoading(false);
    }
  }, [timetableId]);

  useEffect(() => { refetchMeta(); }, [refetchMeta]);
  useEffect(() => { refetchData(); }, [refetchData]);

  const version = timetableData.reduce((m, e) => Math.max(m, e.version ?? 1), 1);

  return {
    isLoading,
    error,
    version,
    timetableData,
    timetableMeta,
    apiTeachers,
    apiClasses,
    apiSubjects,
    scheduledLessons,
    unplacedLessons,
    companyPeriods,
    setScheduledLessons,
    setUnplacedLessons,
    refetchData,
    refetchMeta,
  };
}
