import { TimeSlot } from './teachers';

/**
 * Availability grid state: day key → period number → selected.
 * Single source of truth for the converters that every entity page used to
 * copy-paste (Classes / Teachers / Rooms / Subjects).
 */
export type AvailState = Record<string, Record<number, boolean>>;

/** Optional day-key remap. Subjects stores localized day keys ('Du'…) and must
 *  translate to/from API keys ('MONDAY'…); the API-keyed pages pass nothing. */
export interface AvailConvertOptions {
  dayMap?: Record<string, string>;
}

/** All cells off. */
export const getEmptyAvail = (periods: number[], days: readonly string[]): AvailState => {
  const res: AvailState = {};
  days.forEach((d) => {
    res[d] = {};
    periods.forEach((p) => {
      res[d][p] = false;
    });
  });
  return res;
};

/** All cells on. */
export const getFullAvail = (periods: number[], days: readonly string[]): AvailState => {
  const res: AvailState = {};
  days.forEach((d) => {
    res[d] = {};
    periods.forEach((p) => {
      res[d][p] = true;
    });
  });
  return res;
};

/** Grid state → API time slots. Behaviour-preserving superset: sorts lessons,
 *  remaps day keys when `dayMap` is given. */
export const convertToApiFormat = (
  state: AvailState,
  opts: AvailConvertOptions = {},
): TimeSlot[] =>
  Object.entries(state).map(([day, pMap]) => ({
    dayOfWeek: opts.dayMap?.[day] ?? day,
    lessons: Object.entries(pMap)
      .filter(([, v]) => v)
      .map(([p]) => Number(p))
      .sort((a, b) => a - b),
  }));

/** API time slots → grid state. Safe superset: empty-first base, `?? []` guard,
 *  hasOwnProperty membership check, optional day-key remap. */
export const convertFromApiFormat = (
  slots: TimeSlot[] | undefined | null,
  periods: number[],
  days: readonly string[],
  opts: AvailConvertOptions = {},
): AvailState => {
  const res = getEmptyAvail(periods, days);
  (slots ?? []).forEach((slot) => {
    const key = opts.dayMap?.[slot.dayOfWeek] ?? slot.dayOfWeek;
    if (res[key]) {
      (slot.lessons ?? []).forEach((p) => {
        if (Object.prototype.hasOwnProperty.call(res[key], p)) res[key][p] = true;
      });
    }
  });
  return res;
};
