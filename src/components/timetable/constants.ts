/**
 * Timetable Constants
 * 
 * @module components/timetable/constants
 */

export const DAYS = [
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
] as const;

export const DAY_LABELS: Record<string, string> = {
    MONDAY: 'Monday',
    TUESDAY: 'Tuesday',
    WEDNESDAY: 'Wednesday',
    THURSDAY: 'Thursday',
    FRIDAY: 'Friday',
    SATURDAY: 'Saturday',
    SUNDAY: 'Sunday',
};

export const SUBJECT_COLORS: Record<string, string> = {
    Mathematics: 'bg-blue-100 border-blue-300 text-blue-900',
    Physics: 'bg-purple-100 border-purple-300 text-purple-900',
    Chemistry: 'bg-green-100 border-green-300 text-green-900',
    English: 'bg-orange-100 border-orange-300 text-orange-900',
    History: 'bg-amber-100 border-amber-300 text-amber-900',
    'P.E.': 'bg-red-100 border-red-300 text-red-900',
    Biology: 'bg-emerald-100 border-emerald-300 text-emerald-900',
    Art: 'bg-pink-100 border-pink-300 text-pink-900',
};

export const DEFAULT_TIME_SLOTS = [1, 2, 3, 4, 5, 6, 7];
