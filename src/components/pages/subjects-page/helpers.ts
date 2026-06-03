import {
  AvailState,
  getEmptyAvail as emptyAvail,
  getFullAvail as fullAvail,
  convertToApiFormat as toApi,
  convertFromApiFormat as fromApi,
} from '@/lib/availability';
import { CL_DAYS, dayMapToApi, dayMapFromApi } from './constants';

export type { AvailState };

// Subjects pages call these without `days` (localized CL_DAYS is implied), so the
// wrappers keep the old default that the shared lib intentionally dropped.
export const getEmptyAvail = (periods: number[], days: readonly string[] = CL_DAYS): AvailState =>
  emptyAvail(periods, days);
export const getFullAvail = (periods: number[], days: readonly string[] = CL_DAYS): AvailState =>
  fullAvail(periods, days);

export const convertToApiFormat = (avail: AvailState) => toApi(avail, { dayMap: dayMapToApi });

export const convertFromApiFormat = (
  apiAvail: any[],
  periods: number[],
  days: readonly string[] = CL_DAYS,
): AvailState => fromApi(apiAvail, periods, days, { dayMap: dayMapFromApi });

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
