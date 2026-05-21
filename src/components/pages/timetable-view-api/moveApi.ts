/**
 * moveApi — Batch drag-and-drop saqlash klienti (`PUT /{id}/slot/move`).
 *
 * Frontend net-diff yuboradi: har dars uchun `from` = oxirgi saqlangan pozitsiya,
 * `to` = hozirgi pozitsiya. `from === null` → unscheduled darsni qo'yish,
 * `to === null` → darsni unscheduled qilish.
 *
 * Backend HARD constraint larni qayta tekshiradi:
 *  - 200 → `MoveResult{ applied: true, affectedSlots }`
 *  - 409 → `MoveResult{ applied: false, conflicts }` (hech narsa saqlanmaydi)
 *
 * `apiCall` wrapper'idan foydalanmaymiz, chunki u 409'dagi `error` maydonini ko'rib
 * istisno tashlaydi va biz `conflicts` ni o'qiy olmay qolamiz.
 *
 * @module components/pages/timetable-view-api/moveApi
 */

import { API_CONFIG } from '@/config/api';
import { getToken } from '@/lib/token';

const BASE = `${API_CONFIG.BASE_URL}/api/timetable/v1/timetable`;

/** Slot koordinatasi. weekIndex: 0 = A-hafta, 1 = B-hafta, null = har hafta (WEEKLY). */
export interface SlotRef {
  dayOfWeek: string;
  hour: number;
  weekIndex: number | null;
}

/** Unscheduled darsni qo'yishda backendga lessonId ni aniqlash uchun beriladi. */
export interface MoveDetail {
  subjectId?: number;
  teacherId?: number;
  roomId?: number;
  groupId?: number | null;
}

export interface MoveItem {
  /** Scheduled dars uchun real lessonId; unscheduled qo'yishda null bo'lishi mumkin. */
  lessonId: number | null;
  classId: number;
  from: SlotRef | null;
  to: SlotRef | null;
  detail?: MoveDetail | null;
}

export interface MoveBatchRequest {
  expectedVersion: number | null;
  moves: MoveItem[];
}

export type MoveConflictType = 'TEACHER' | 'ROOM' | 'CLASS' | 'VERSION' | string;

export interface MoveConflict {
  type: MoveConflictType;
  resourceId: number | null;
  dayOfWeek: string | null;
  hour: number | null;
  weekIndex: number | null;
  detail: string;
}

export interface MoveResult {
  applied: boolean;
  version: number;
  affectedSlots: unknown[];
  conflicts: MoveConflict[];
}

/** Inson o'qiy oladigan konflikt matni. */
export function describeConflict(c: MoveConflict): string {
  if (c.detail) return c.detail;
  switch (c.type) {
    case 'TEACHER':
      return `O'qituvchi band (${c.dayOfWeek} ${c.hour}-soat)`;
    case 'ROOM':
      return `Xona band (${c.dayOfWeek} ${c.hour}-soat)`;
    case 'CLASS':
      return `Sinf band (${c.dayOfWeek} ${c.hour}-soat)`;
    case 'VERSION':
      return 'Jadval versiyasi eskirgan (boshqa joydan o\'zgartirilgan)';
    default:
      return c.type;
  }
}

/**
 * Batch move'ni backendga yuboradi. 200 va 409 javoblarining ikkalasida ham
 * {@link MoveResult} qaytaradi; boshqa xatolarda istisno tashlaydi.
 */
export async function applyMoveBatch(
  timetableId: string,
  body: MoveBatchRequest,
): Promise<MoveResult> {
  const token = getToken();
  const res = await fetch(`${BASE}/${timetableId}/slot/move`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  let raw: any = null;
  try {
    raw = await res.json();
  } catch {
    raw = null;
  }

  // Response<T> wrapper: { error, errorDescription, response }
  const result: MoveResult | undefined = raw?.response ?? undefined;

  // 200 (applied) yoki 409 (HARD_CONSTRAINT / VERSION — applied:false) — ikkalasi ham natija.
  if (result && (res.ok || res.status === 409)) {
    return result;
  }

  const msg =
    raw?.errorDescription || raw?.error || res.statusText || 'Saqlashda xatolik';
  throw new Error(String(msg));
}
