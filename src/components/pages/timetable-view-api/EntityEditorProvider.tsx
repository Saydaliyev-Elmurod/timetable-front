import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ClassService, ClassResponse } from '@/lib/classes';
import { TeacherService, TeacherResponse } from '@/lib/teachers';
import { RoomService, RoomResponse } from '@/lib/rooms';
import { SubjectService, SubjectResponse } from '@/lib/subjects';
import { organizationApi } from '@/api/organizationApi';
import {
  ClassEditor,
  TeacherEditor,
  RoomEditor,
  API_DAYS_OF_WEEK,
  getActiveApiDays,
} from '@/components/shared';
import { EntityEditContext, EntityKind } from '../timetable-view/EntityEditContext';

interface Editing {
  kind: EntityKind;
  id: number;
  /** null while the full entity is being fetched by id. */
  entity: ClassResponse | TeacherResponse | RoomResponse | null;
}

interface Props {
  /** Called after a successful save so the caller can refetch + redraw the grid. */
  onSaved?: () => void;
  children: ReactNode;
}

const fetchById = (kind: EntityKind, id: number) => {
  if (kind === 'class') return ClassService.getById(id);
  if (kind === 'teacher') return TeacherService.getById(id);
  return RoomService.getById(id);
};

const updateById = (kind: EntityKind, id: number, data: unknown): Promise<unknown> => {
  if (kind === 'class') return ClassService.update(id, data as never);
  if (kind === 'teacher') return TeacherService.update(id, data as never);
  return RoomService.update(id, data as never);
};

/**
 * Hosts the SHARED entity editors for the timetable view and exposes a stable
 * `openEditor(kind, id)` over context. Opening/closing the modal mutates only
 * this provider's state — the timetable grid (passed as `children`) keeps its
 * element identity and is NOT re-rendered. See `EntityEditContext`.
 *
 * Mirrors the CRUD pages' data loading (org periods/days + teacher & subject
 * lists) so the modal that opens here is byte-for-byte the same experience as
 * the one on `ClassesPage` / `TeachersPage` / `RoomsPage`.
 */
export function EntityEditorProvider({ onSaved, children }: Props) {
  const [editing, setEditing] = useState<Editing | null>(null);

  const [periods, setPeriods] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  const [days, setDays] = useState<string[]>([...API_DAYS_OF_WEEK]);
  const [teachers, setTeachers] = useState<TeacherResponse[]>([]);
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);

  // One-time reference data — same calls the management pages make.
  useEffect(() => {
    organizationApi.get().then((org) => {
      if (org?.periods) {
        const nonBreak = org.periods.filter((p: { isBreak?: boolean }) => !p.isBreak).length;
        if (nonBreak > 0) setPeriods(Array.from({ length: nonBreak }, (_, i) => i + 1));
      }
      setDays(getActiveApiDays(org?.daysOfWeek));
    }).catch(() => {});
    TeacherService.getAll().then(setTeachers).catch(() => {});
    SubjectService.getAll().then(setSubjects).catch(() => {});
  }, []);

  const openEditor = useCallback((kind: EntityKind, id: number) => {
    setEditing({ kind, id, entity: null });
    fetchById(kind, id)
      .then((entity) => {
        // Ignore if the user already closed or switched targets mid-fetch.
        setEditing((cur) => (cur && cur.kind === kind && cur.id === id ? { ...cur, entity } : cur));
      })
      .catch(() => {
        toast.error("Ma'lumotni yuklab bo'lmadi");
        setEditing((cur) => (cur && cur.kind === kind && cur.id === id ? null : cur));
      });
  }, []);

  const close = useCallback(() => setEditing(null), []);

  const handleSave = useCallback(
    (kind: EntityKind, id: number) => async (data: unknown) => {
      try {
        await updateById(kind, id, data);
        toast.success('Muvaffaqiyatli saqlandi');
        setEditing(null);
        onSaved?.();
      } catch {
        toast.error('Saqlashda xatolik');
      }
    },
    [onSaved],
  );

  // Stable context value → consumers (grid headers) never re-render on open/close.
  const ctx = useMemo(() => ({ openEditor }), [openEditor]);

  return (
    <EntityEditContext.Provider value={ctx}>
      {children}

      {editing && editing.entity === null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#fff' }} />
        </div>
      )}

      {editing && editing.entity && editing.kind === 'class' && (
        <ClassEditor
          initial={editing.entity as ClassResponse}
          periods={periods}
          days={days}
          teachers={teachers}
          onClose={close}
          onSave={handleSave('class', editing.id)}
        />
      )}

      {editing && editing.entity && editing.kind === 'teacher' && (
        <TeacherEditor
          initial={editing.entity as TeacherResponse}
          periods={periods}
          days={days}
          subjects={subjects}
          onClose={close}
          onSave={handleSave('teacher', editing.id)}
        />
      )}

      {editing && editing.entity && editing.kind === 'room' && (
        <RoomEditor
          initial={editing.entity as RoomResponse}
          periods={periods}
          days={days}
          onClose={close}
          onSave={handleSave('room', editing.id)}
        />
      )}
    </EntityEditContext.Provider>
  );
}
