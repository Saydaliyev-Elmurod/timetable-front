/**
 * Utils Module - Barrel Export
 * 
 * Barcha utility funksiyalarni bir joydan import qilish uchun
 * 
 * @example
 * import { formatDate, convertToTimeSlots, generateShortName } from '@/utils';
 */

// Time slots conversion (primary)
export {
    convertToTimeSlots,
    convertFromTimeSlots,
    createDefaultAvailability,
    isAvailabilityEmpty,
    getTotalAvailablePeriods,
    togglePeriod,
    toggleDay,
    togglePeriodAcrossDays,
    type Availability,
    type TimeSlot,
} from './timeSlots';

// Formatters (excludes getTotalAvailablePeriods - already exported from timeSlots)
export {
    formatDate,
    formatDateOnly,
    formatTimeOnly,
    formatRelativeTime,
    truncate,
    generateClassShortName,
    generateTeacherShortName,
    capitalize,
    toTitleCase,
    formatNumber,
    formatPercent,
    formatAvailabilitySummary,
    formatDayOfWeek,
    getDaysOfWeek,
    dayToLowercase,
    dayToUppercase,
} from './formatters';
