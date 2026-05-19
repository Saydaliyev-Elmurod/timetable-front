import type {
  EtClass,
  EtSubject,
  EtTeacher,
  EtRoom,
  EtLessonRow,
} from './types';

// Module-level mutable catalog. `initLessonsData()` populates this; every
// component below reads through the helpers, so consumers never touch the
// arrays directly.

export let LC_CLASSES: EtClass[] = [];
export let LC_SUBJECTS: EtSubject[] = [];
export let LC_SUBJECT_BY_ID: Record<string, EtSubject> = {};
export let LC_TEACHERS: EtTeacher[] = [];
export let LC_TEACHER_BY_ID: Record<string, EtTeacher> = {};
export let LC_ROOMS: EtRoom[] = [];
export let LC_SEED: EtLessonRow[] = [];

export const LC = {
  parallels: ['5', '6', '7', '8', '9', '10', '11'],
  letters: ['A', 'B', 'V', 'G'],
};

// Helper: parse "bg,fg,bar" packed in `ck`.
export const subjColors = (s: EtSubject | undefined): [string, string, string] => {
  if (!s) return ['#F1F5F9', '#475569', '#94A3B8'];
  const [bg, fg, bar] = s.ck.split(',');
  return [bg, fg, bar];
};

export const subjById = (id: string): EtSubject | undefined => LC_SUBJECT_BY_ID[id];
export const teacherById = (id: string): EtTeacher | undefined => LC_TEACHER_BY_ID[id];
export const roomById = (id: string): EtRoom | undefined =>
  LC_ROOMS.find((r) => r.id === id);
export const teachersForSub = (sid: string): EtTeacher[] =>
  LC_TEACHERS.filter((t) => t.subs.includes(sid));
export const roomsForSub = (sid: string): EtRoom[] =>
  LC_ROOMS.filter((r) => r.fits === '*' || (Array.isArray(r.fits) && r.fits.includes(sid)));

// Expand a "block" string like "2+2+1+1" to its segment lengths.
export const blockExpand = (b: string | undefined | null): number[] => {
  if (!b) return [];
  return String(b).split('+').map((x) => parseInt(x, 10) || 1);
};

// Compute teacher hours implied by current lesson rows.
export function computeTeacherLoad(rows: EtLessonRow[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    const hrs = r.hours || 0;
    if (typeof r.teacher === 'string') {
      out[r.teacher] = (out[r.teacher] || 0) + hrs * (r.classes?.length || 1);
    } else if (r.teacher && r.teacher.groups) {
      for (const g of r.teacher.groups) {
        out[g.tid] = (out[g.tid] || 0) + hrs * (r.classes?.length || 1);
      }
    }
  }
  return out;
}

export const getGroupsForClasses = (classNames: string[]): string[] => {
  const groups = new Set<string>();
  classNames.forEach((name) => {
    const c = LC_CLASSES.find((cl) => cl.name === name);
    if (c && c.groups) {
      c.groups.forEach((g) => groups.add(g.name));
    }
  });
  return [...groups];
};

export function initLessonsData(
  classes: (EtClass | string)[],
  subjects: EtSubject[],
  teachers: EtTeacher[],
  rooms: EtRoom[],
  lessons: EtLessonRow[],
): void {
  LC_CLASSES = classes.map((c) => (typeof c === 'string' ? { name: c, groups: [] } : c));
  LC_SUBJECTS = subjects;
  LC_SUBJECT_BY_ID = Object.fromEntries(subjects.map((s) => [s.id, s]));
  LC_TEACHERS = teachers;
  LC_TEACHER_BY_ID = Object.fromEntries(teachers.map((t) => [t.id, t]));
  LC_ROOMS = rooms;
  LC_SEED = lessons;
}
