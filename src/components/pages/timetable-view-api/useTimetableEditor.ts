/**
 * useTimetableEditor — Drag-and-drop tahrirlash + undo/redo + net-diff autosave.
 *
 * ## Model
 * - Har bir o'zgarish (move/swap/place/unschedule) lokal state'ga **optimistik** qo'llanadi
 *   va undo/redo stack'iga yoziladi. Backendga DARHOL chiqmaydi.
 * - `baseline` — har dars oxirgi muvaffaqiyatli save'da (yoki yuklashda) qayerda turgani.
 * - **Autosave** quyidagi hollarda ishga tushadi: 5 ta operatsiya / har 20 soniya / qo'lda Save.
 *   Save paytida `baseline` ↔ hozirgi holat orasidagi **net-diff** hisoblanadi va bitta
 *   batch request bo'lib `/slot/move` ga ketadi (bir dars 3 marta ko'chsa ham 1 ta entry).
 * - Save muvaffaqiyatli bo'lsa stack TOZALANMAYDI (undo keyin ham ishlaydi; keyingi save'da
 *   net-diff qayta hisoblanadi). Xato bo'lsa — stack tozalanadi, refetch, "Natija tozalandi".
 *
 * Frontend HARD constraint larni avval o'zi tekshiradi (`validatePlacement`); backend ham
 * qayta tekshiradi va oxirgi so'z unda.
 *
 * @module components/pages/timetable-view-api/useTimetableEditor
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  ClassResponse,
  Lesson,
  SubjectResponse,
  TeacherResponse,
  UnplacedLesson,
} from '../timetable-view/types';
import { logger } from '../../../lib/logger';
import { applyMoveBatch, describeConflict, MoveItem, SlotRef } from './moveApi';

// ── Pozitsiya yordamchilari ──────────────────────────────────────────────────

/** null = unscheduled. */
type SlotPos = { day: string; hour: number; week: number | null } | null;

function lessonPos(l: Lesson): SlotPos {
  if (l.day && typeof l.timeSlot === 'number') {
    return { day: l.day, hour: l.timeSlot, week: l.weekIndex ?? null };
  }
  return null;
}

function samePos(a: SlotPos, b: SlotPos): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return a.day === b.day && a.hour === b.hour && (a.week ?? null) === (b.week ?? null);
}

function toSlotRef(pos: NonNullable<SlotPos>): SlotRef {
  return { dayOfWeek: pos.day, hour: pos.hour, weekIndex: pos.week };
}

/** Hafta to'plamlari kesishadimi? null = har hafta. */
function weeksOverlap(a: number | null, b: number | null): boolean {
  return a == null || b == null || a === b;
}

/** Slot kaliti — bir (kun, soat) uchun bitta bucket. */
const slotKey = (day: string, hour: number) => `${day}-${hour}`;

/**
 * Joylashtirilgan darslarni (kun, soat) bo'yicha indekslaydi, shunda
 * `validatePlacement` butun ro'yxatni emas, faqat nishon slotdagi kichik
 * bucket'ni aylanadi (O(n) skan → O(1) qidiruv + kichik bucket).
 */
function buildSlotIndex(lessons: Lesson[]): Map<string, Lesson[]> {
  const idx = new Map<string, Lesson[]>();
  for (const l of lessons) {
    if (!l.day || typeof l.timeSlot !== 'number') continue;
    const k = slotKey(l.day, l.timeSlot);
    const bucket = idx.get(k);
    if (bucket) bucket.push(l);
    else idx.set(k, [l]);
  }
  return idx;
}

/** Scheduled dars id si "1042" ko'rinishida — son. Unscheduled (uuid) uchun null. */
function numericLessonId(card: Lesson): number | null {
  const fromRaw = (card as any).rawDetails?.lessonId;
  if (typeof fromRaw === 'number') return fromRaw;
  const n = Number(card.id);
  return Number.isInteger(n) ? n : null;
}

// ── Operatsiya (undo/redo birligi) ───────────────────────────────────────────

interface CardChange {
  cardId: string;
  before: SlotPos;
  after: SlotPos;
}

interface MoveOp {
  changes: CardChange[];
  label: string;
}

// ── Availability indekslari (vaqt chegaralari) ───────────────────────────────

type AvailMap = Map<number, Set<string>>;

function buildAvail(
  entities: { id: number; availabilities?: { dayOfWeek: string; lessons: number[] }[] }[],
): AvailMap {
  const map: AvailMap = new Map();
  for (const e of entities) {
    if (!e.availabilities || e.availabilities.length === 0) continue; // cheklovsiz
    const set = new Set<string>();
    for (const slot of e.availabilities) {
      for (const hour of slot.lessons) set.add(`${slot.dayOfWeek}-${hour}`);
    }
    map.set(e.id, set);
  }
  return map;
}

/** Cheklov bo'lmasa (map'da yo'q) → har doim mavjud. */
function isAvail(map: AvailMap, id: number | undefined, day: string, hour: number): boolean {
  if (id == null) return true;
  const set = map.get(id);
  if (!set) return true;
  return set.has(`${day}-${hour}`);
}

// ── Hook ─────────────────────────────────────────────────────────────────────

interface Args {
  timetableId: string | undefined;
  version: number;
  scheduledLessons: Lesson[];
  unplacedLessons: UnplacedLesson[];
  setScheduledLessons: React.Dispatch<React.SetStateAction<Lesson[]>>;
  setUnplacedLessons: React.Dispatch<React.SetStateAction<UnplacedLesson[]>>;
  apiTeachers: TeacherResponse[];
  apiClasses: ClassResponse[];
  apiSubjects: SubjectResponse[];
  isLoading: boolean;
  refetchData: () => Promise<void>;
}

const AUTOSAVE_OP_THRESHOLD = 5;
const AUTOSAVE_INTERVAL_MS = 20_000;

export function useTimetableEditor({
  timetableId,
  version,
  scheduledLessons,
  unplacedLessons,
  setScheduledLessons,
  setUnplacedLessons,
  apiTeachers,
  apiClasses,
  apiSubjects,
  isLoading,
  refetchData,
}: Args) {
  // Eng so'nggi state'ni sinxron o'qish uchun ref'lar (operatsiyalar ketma-ket bo'lishi mumkin).
  const scheduledRef = useRef(scheduledLessons);
  const unplacedRef = useRef(unplacedLessons);
  scheduledRef.current = scheduledLessons;
  unplacedRef.current = unplacedLessons;

  const [undoStack, setUndoStack] = useState<MoveOp[]>([]);
  const [redoStack, setRedoStack] = useState<MoveOp[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedTick, setSavedTick] = useState(0); // isDirty'ni qayta hisoblash uchun

  const baselineRef = useRef<Map<string, SlotPos>>(new Map());
  const opsSinceSaveRef = useRef(0);
  const isSavingRef = useRef(false);

  // Availability indekslari (props o'zgarmaguncha bir marta).
  const teacherAvail = useMemo(() => buildAvail(apiTeachers), [apiTeachers]);
  const classAvail = useMemo(() => buildAvail(apiClasses), [apiClasses]);
  const subjectAvail = useMemo(() => buildAvail(apiSubjects), [apiSubjects]);

  // ── Joriy pozitsiyalar xaritasi ───────────────────────────────────────────
  const currentPosMap = useCallback((): Map<string, SlotPos> => {
    const map = new Map<string, SlotPos>();
    for (const l of scheduledRef.current) map.set(l.id, lessonPos(l));
    for (const l of unplacedRef.current) map.set(l.id, null);
    return map;
  }, []);

  const cardById = useCallback((id: string): Lesson | undefined => {
    return scheduledRef.current.find((l) => l.id === id) || unplacedRef.current.find((l) => l.id === id);
  }, []);

  const resetBaseline = useCallback(() => {
    baselineRef.current = currentPosMap();
  }, [currentPosMap]);

  // Yuklash/refetch tugagach baseline'ni qayta o'rnatamiz (stack ham bo'sh bo'ladi).
  const prevLoadingRef = useRef(isLoading);
  useEffect(() => {
    if (prevLoadingRef.current && !isLoading) {
      resetBaseline();
      setUndoStack([]);
      setRedoStack([]);
      opsSinceSaveRef.current = 0;
    }
    prevLoadingRef.current = isLoading;
  }, [isLoading, resetBaseline]);

  // ── Lokal state'ga o'zgarishlarni qo'llash ────────────────────────────────
  const applyChanges = useCallback(
    (changes: CardChange[], dir: 'after' | 'before') => {
      const targetPos = new Map<string, SlotPos>();
      for (const c of changes) targetPos.set(c.cardId, dir === 'after' ? c.after : c.before);

      const all = new Map<string, Lesson>();
      for (const l of scheduledRef.current) all.set(l.id, l);
      for (const l of unplacedRef.current) all.set(l.id, l);

      targetPos.forEach((pos, id) => {
        const card = all.get(id);
        if (!card) return;
        if (pos) {
          all.set(id, { ...card, day: pos.day, timeSlot: pos.hour, weekIndex: pos.week });
        } else {
          const { day: _d, timeSlot: _t, ...rest } = card;
          const reason = (card as UnplacedLesson).reason || "Qo'lda bo'shatildi";
          all.set(id, { ...rest, day: undefined, timeSlot: undefined, reason } as Lesson);
        }
      });

      const nextScheduled: Lesson[] = [];
      const nextUnplaced: UnplacedLesson[] = [];
      all.forEach((card) => {
        if (card.day && typeof card.timeSlot === 'number') nextScheduled.push(card);
        else nextUnplaced.push(card as UnplacedLesson);
      });

      scheduledRef.current = nextScheduled;
      unplacedRef.current = nextUnplaced;
      setScheduledLessons(nextScheduled);
      setUnplacedLessons(nextUnplaced);
    },
    [setScheduledLessons, setUnplacedLessons],
  );

  // ── Frontend validatsiya ──────────────────────────────────────────────────
  const validatePlacement = useCallback(
    (
      card: Lesson,
      pos: NonNullable<SlotPos>,
      exclude: Set<string>,
      slotIndex: Map<string, Lesson[]>,
    ): { ok: boolean; reason?: string } => {
      // Vaqt chegaralari
      if (!isAvail(classAvail, card.classId, pos.day, pos.hour)) {
        return { ok: false, reason: 'Sinf vaqt chegarasi' };
      }
      if (!isAvail(teacherAvail, card.teacherId, pos.day, pos.hour)) {
        return { ok: false, reason: "O'qituvchi vaqt chegarasi" };
      }
      if (!isAvail(subjectAvail, card.subjectId, pos.day, pos.hour)) {
        return { ok: false, reason: 'Fan vaqt chegarasi' };
      }

      // Egallanganlik — faqat nishon slotdagi darslar bilan to'qnashuv (O(1) bucket).
      const bucket = slotIndex.get(slotKey(pos.day, pos.hour));
      if (bucket) {
        for (const l of bucket) {
          if (exclude.has(l.id)) continue;
          if (!weeksOverlap(l.weekIndex ?? null, pos.week)) continue;
          if (card.teacherId && l.teacherId === card.teacherId) {
            return { ok: false, reason: "O'qituvchi band" };
          }
          if (card.roomId && l.roomId === card.roomId) {
            return { ok: false, reason: 'Xona band' };
          }
          if (l.classId === card.classId) {
            // Conflict if either is a whole-class lesson (no groupId) or they belong to the same group
            if (!l.groupId || !card.groupId || l.groupId === card.groupId) {
              return { ok: false, reason: 'Sinf band' };
            }
          }
        }
      }
      return { ok: true };
    },
    [classAvail, teacherAvail, subjectAvail],
  );

  // ── Net-diff ──────────────────────────────────────────────────────────────
  const computeDiff = useCallback((): MoveItem[] => {
    const base = baselineRef.current;
    const cur = currentPosMap();
    const ids = new Set<string>([...base.keys(), ...cur.keys()]);
    const items: MoveItem[] = [];
    ids.forEach((id) => {
      const from = base.get(id) ?? null;
      const to = cur.get(id) ?? null;
      if (samePos(from, to)) return;
      const card = cardById(id);
      if (!card) return;
      items.push({
        lessonId: numericLessonId(card),
        classId: card.classId,
        from: from ? toSlotRef(from) : null,
        to: to ? toSlotRef(to) : null,
        detail: {
          subjectId: card.subjectId,
          teacherId: card.teacherId,
          roomId: card.roomId,
          groupId: card.groupId ?? null,
        },
      });
    });
    return items;
  }, [currentPosMap, cardById]);

  // ── Saqlash (flush) ───────────────────────────────────────────────────────
  const flushRef = useRef<(reason: string) => Promise<void>>(async () => {});
  const flush = useCallback(
    async (_reason: string) => {
      if (isSavingRef.current || !timetableId) return;
      const moves = computeDiff();
      if (moves.length === 0) {
        opsSinceSaveRef.current = 0;
        return;
      }
      isSavingRef.current = true;
      setIsSaving(true);
      try {
        const result = await applyMoveBatch(timetableId, { expectedVersion: version, moves });
        if (!result.applied) {
          const desc = result.conflicts.map(describeConflict).slice(0, 4).join(', ');
          setUndoStack([]);
          setRedoStack([]);
          opsSinceSaveRef.current = 0;
          toast.error('Natija tozalandi', {
            description: desc || 'Backend o\'zgarishlarni rad etdi',
          });
          await refetchData();
          return;
        }
        // Muvaffaqiyat: baseline = hozirgi holat. Stack saqlanadi.
        resetBaseline();
        opsSinceSaveRef.current = 0;
        setSavedTick((t) => t + 1);
        toast.success('Saqlandi', { description: `${moves.length} ta o'zgarish` });
      } catch (err) {
        logger.error('Save error:', err);
        setUndoStack([]);
        setRedoStack([]);
        opsSinceSaveRef.current = 0;
        toast.error('Natija tozalandi', {
          description: err instanceof Error ? err.message : 'Saqlashda xatolik',
        });
        await refetchData();
      } finally {
        isSavingRef.current = false;
        setIsSaving(false);
      }
    },
    [timetableId, version, computeDiff, resetBaseline, refetchData],
  );
  flushRef.current = flush;

  // 5 ta operatsiyadan keyin avto-flush.
  const bumpOps = useCallback(() => {
    opsSinceSaveRef.current += 1;
    if (opsSinceSaveRef.current >= AUTOSAVE_OP_THRESHOLD) {
      void flushRef.current('count');
    }
  }, []);

  // Har 20 soniyada avto-flush.
  useEffect(() => {
    const id = setInterval(() => void flushRef.current('timer'), AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  // ── Operatsiya qo'llash ───────────────────────────────────────────────────
  const pushOp = useCallback(
    (op: MoveOp) => {
      applyChanges(op.changes, 'after');
      setUndoStack((s) => [...s, op]);
      setRedoStack([]);
      bumpOps();
    },
    [applyChanges, bumpOps],
  );

  // Guruhga bo'lingan dars = bitta slotda bir nechta karta (har guruh uchun bittadan).
  // Ular bir xil sinf+kun+soat+haftada turadi. Bittasini sudraganda hammasi birga ko'chsin.
  const slotMates = useCallback((card: Lesson): Lesson[] => {
    const pos = lessonPos(card);
    if (!pos) {
      // Unscheduled — find other groups of the same lesson in the unplaced list.
      // They have the same classId and subjectId.
      const mates = unplacedRef.current.filter(
        (l) => l.classId === card.classId && l.subjectId === card.subjectId
      );
      return mates.length > 0 ? mates : [card];
    }
    const mates = scheduledRef.current.filter(
      (l) =>
        l.classId === card.classId &&
        l.day === pos.day &&
        l.timeSlot === pos.hour &&
        (l.weekIndex ?? null) === (pos.week ?? null),
    );
    return mates.length > 0 ? mates : [card];
  }, []);

  // ── Drag-drop ─────────────────────────────────────────────────────────────
  const handleDrop = useCallback(
    (dragged: Lesson, targetDay: string, targetTimeSlot: number) => {
      if (isSavingRef.current) return;
      const draggedPos = lessonPos(dragged);
      const week = dragged.weekIndex ?? null;
      const targetPos: NonNullable<SlotPos> = { day: targetDay, hour: targetTimeSlot, week };

      // O'sha slotga tashlash — no-op
      if (draggedPos && samePos(draggedPos, targetPos)) return;

      // Sudralayotgan kartaning butun guruhi (slotdagi barcha kartalar) birga ko'chadi.
      const movingGroup = slotMates(dragged);
      const movingIds = new Set(movingGroup.map((c) => c.id));

      // Nishondagi mavjud dars(lar) — shu sinf, hafta kesishsa, ko'chayotgan guruhdan tashqari.
      const occupants = scheduledRef.current.filter(
        (l) =>
          !movingIds.has(l.id) &&
          l.classId === dragged.classId &&
          l.day === targetDay &&
          l.timeSlot === targetTimeSlot &&
          weeksOverlap(l.weekIndex ?? null, week),
      );
      const occupantIds = new Set(occupants.map((o) => o.id));

      // Ko'chayotgan guruh va nishon egasini to'qnashuv tekshiruvidan chiqaramiz
      // (guruh a'zolari bir slotda birga turishi normal; egalari bo'shaydi).
      const excludeForDrag = new Set<string>([...movingIds, ...occupantIds]);

      // Bir marta indekslaymiz — scheduledRef bu handler ichida o'zgarmaydi,
      // shuning uchun barcha validatePlacement chaqiruvlari shu indeksdan foydalanadi.
      const slotIndex = buildSlotIndex(scheduledRef.current);

      // Har bir guruh a'zosi nishonga sig'ishi kerak.
      for (const card of movingGroup) {
        const v = validatePlacement(card, targetPos, excludeForDrag, slotIndex);
        if (!v.ok) {
          toast.error("Bu yerga qo'yib bo'lmaydi", {
            description: v.reason,
            descriptionClassName: '!text-red-600 !opacity-100 font-semibold',
          });
          return;
        }
      }

      const moveChanges: CardChange[] = movingGroup.map((c) => ({
        cardId: c.id,
        before: lessonPos(c),
        after: { day: targetDay, hour: targetTimeSlot, week: c.weekIndex ?? null },
      }));

      if (occupants.length === 0) {
        pushOp({
          changes: moveChanges,
          label: draggedPos
            ? (movingGroup.length > 1 ? "Guruh ko'chirildi" : "Dars ko'chirildi")
            : "Dars qo'yildi",
        });
        return;
      }

      // SWAP — egalarni sudralgan guruhning eski slotiga qo'ya olamizmi?
      const canSwapBack =
        draggedPos != null &&
        occupants.every((o) => validatePlacement(o, draggedPos, excludeForDrag, slotIndex).ok);

      if (canSwapBack) {
        pushOp({
          changes: [
            ...moveChanges,
            ...occupants.map((o) => ({
              cardId: o.id,
              before: lessonPos(o),
              after: { day: draggedPos!.day, hour: draggedPos!.hour, week: o.weekIndex ?? null },
            })),
          ],
          label: 'Darslar almashtirildi',
        });
      } else {
        // Egalar sig'masa (yoki sudralgan dars unscheduled bo'lsa) → egalarni bo'shatamiz
        pushOp({
          changes: [
            ...moveChanges,
            ...occupants.map((o) => ({ cardId: o.id, before: lessonPos(o), after: null })),
          ],
          label: "Almashtirildi (eski dars bo'shatildi)",
        });
      }
    },
    [pushOp, validatePlacement, slotMates],
  );

  // O'chirish = unschedule (undo qilinadi, save bo'ladi).
  // Guruhga bo'lingan dars bitta birlik — barcha guruh a'zolari birga bo'shaydi.
  const unscheduleLesson = useCallback(
    (lesson: Lesson) => {
      if (isSavingRef.current) return;
      const pos = lessonPos(lesson);
      if (!pos) return; // allaqachon unscheduled
      const group = slotMates(lesson);
      pushOp({
        changes: group.map((c) => ({ cardId: c.id, before: lessonPos(c), after: null })),
        label: group.length > 1 ? "Guruh bo'shatildi" : "Dars bo'shatildi",
      });
    },
    [pushOp, slotMates],
  );

  // ── Undo / Redo ───────────────────────────────────────────────────────────
  const undo = useCallback(() => {
    setUndoStack((stack) => {
      if (stack.length === 0) return stack;
      const op = stack[stack.length - 1];
      applyChanges(op.changes, 'before');
      setRedoStack((r) => [...r, op]);
      bumpOps();
      return stack.slice(0, -1);
    });
  }, [applyChanges, bumpOps]);

  const redo = useCallback(() => {
    setRedoStack((stack) => {
      if (stack.length === 0) return stack;
      const op = stack[stack.length - 1];
      applyChanges(op.changes, 'after');
      setUndoStack((u) => [...u, op]);
      bumpOps();
      return stack.slice(0, -1);
    });
  }, [applyChanges, bumpOps]);

  const save = useCallback(() => void flushRef.current('manual'), []);

  // isDirty — har render qayta hisoblanadi (stack/savedTick o'zgarsa render bo'ladi).
  void savedTick;
  const isDirty = computeDiff().length > 0;

  return {
    handleDrop,
    unscheduleLesson,
    undo,
    redo,
    save,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    isDirty,
    isSaving,
  };
}
