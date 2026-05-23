import { CL_DAYS, dayMapToApi, dayMapFromApi } from './constants';

export type AvailState = Record<string, Record<number, boolean>>;

export interface WeightColor {
  base: string;
  tint: string;
  ink: string;
  light: string;
}

export function getWeightColor(v: number): WeightColor {
  if (v >= 9) return { base: '#DC2626', tint: '#FEF2F2', ink: '#991B1B', light: '#FCA5A5' };
  if (v >= 7) return { base: '#F97316', tint: '#FFF7ED', ink: '#9A3412', light: '#FDBA74' };
  if (v >= 5) return { base: '#F59E0B', tint: '#FFFBEB', ink: '#92400E', light: '#FCD34D' };
  if (v >= 3) return { base: '#84CC16', tint: '#F7FEE7', ink: '#3F6212', light: '#BEF264' };
  return { base: '#10B981', tint: '#F0FDF4', ink: '#065F46', light: '#6EE7B7' };
}

export function weightLabel(v: number): string {
  if (v >= 9) return 'Kritik';
  if (v >= 7) return 'Yuqori';
  if (v >= 5) return 'Muhim';
  if (v >= 3) return "O'rtacha";
  return 'Yengil';
}

export function getLocalizedName(sub: any, locale: string): string {
  if (locale === 'uz') return sub.nameUz || sub.name;
  if (locale === 'ru') return sub.nameRu || sub.name;
  if (locale === 'en') return sub.nameEn || sub.name;
  return sub.name;
}

export const getEmptyAvail = (periods: number[], days: readonly string[] = CL_DAYS): AvailState => {
  const res: AvailState = {};
  days.forEach((d) => {
    res[d] = {};
    periods.forEach((p) => (res[d][p] = false));
  });
  return res;
};

export const getFullAvail = (periods: number[], days: readonly string[] = CL_DAYS): AvailState => {
  const res: AvailState = {};
  days.forEach((d) => {
    res[d] = {};
    periods.forEach((p) => (res[d][p] = true));
  });
  return res;
};

export const convertToApiFormat = (avail: AvailState) =>
  Object.entries(avail).map(([day, periods]) => ({
    dayOfWeek: dayMapToApi[day] || day,
    lessons: Object.entries(periods)
      .filter(([, value]) => value)
      .map(([period]) => parseInt(period)),
  }));

export const convertFromApiFormat = (apiAvail: any[], periods: number[], days: readonly string[] = CL_DAYS): AvailState => {
  const result = getEmptyAvail(periods, days);
  if (!apiAvail) return result;
  apiAvail.forEach((slot) => {
    const d = dayMapFromApi[slot.dayOfWeek];
    if (d && result[d]) {
      slot.lessons.forEach((p: number) => {
        if (Object.prototype.hasOwnProperty.call(result[d], p)) {
          result[d][p] = true;
        }
      });
    }
  });
  return result;
};
