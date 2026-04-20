/**
 * Subject Color Palette
 *
 * Deterministic color mapping for subjects. Using a numeric subjectId
 * (not a subject name) ensures colors stay stable across renaming, i18n,
 * and different view modes. Pass 4A.
 *
 * @module components/timetable/utils/subjectColor
 */

/**
 * 12-slot palette of Tailwind color triplets (bg / border / text) applied
 * to lesson sub-cards. Picked to be visually distinct at small sizes and
 * to keep sufficient contrast against white grid backgrounds.
 */
export const SUBJECT_PALETTE: readonly string[] = [
    'bg-sky-50 border-sky-300 text-sky-800',
    'bg-indigo-50 border-indigo-300 text-indigo-800',
    'bg-violet-50 border-violet-300 text-violet-800',
    'bg-fuchsia-50 border-fuchsia-300 text-fuchsia-800',
    'bg-pink-50 border-pink-300 text-pink-800',
    'bg-rose-50 border-rose-300 text-rose-800',
    'bg-orange-50 border-orange-300 text-orange-800',
    'bg-amber-50 border-amber-300 text-amber-800',
    'bg-lime-50 border-lime-300 text-lime-800',
    'bg-emerald-50 border-emerald-300 text-emerald-800',
    'bg-teal-50 border-teal-300 text-teal-800',
    'bg-cyan-50 border-cyan-300 text-cyan-800',
] as const;

/**
 * Deterministic palette index for a given subjectId.
 * Returns -1 when the subjectId is null/undefined so callers can apply a
 * neutral fallback instead of mis-coloring unresolved slots.
 */
export function subjectColorIndex(subjectId: number | null | undefined): number {
    if (subjectId === null || subjectId === undefined) return -1;
    return Math.abs(subjectId) % SUBJECT_PALETTE.length;
}
