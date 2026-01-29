/**
 * Formatting Utilities
 * 
 * Date, text, number formatlash funksiyalari
 * 
 * @module utils/formatters
 */

// ============================================================================
// DATE FORMATTERS
// ============================================================================

/**
 * ISO date stringni o'qilishi oson formatga o'zgartirish
 * @param dateString - ISO date string
 * @param options - Intl.DateTimeFormat options
 * @returns Formatlangan sana
 * 
 * @example
 * formatDate('2024-01-15T10:30:00Z') // "01/15/2024, 10:30 AM"
 */
export function formatDate(
    dateString: string | null | undefined,
    options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }
): string {
    if (!dateString) return '-';

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleString('en-US', options);
    } catch {
        return '-';
    }
}

/**
 * Faqat sanani formatlash (vaqtsiz)
 */
export function formatDateOnly(dateString: string | null | undefined): string {
    return formatDate(dateString, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
}

/**
 * Faqat vaqtni formatlash
 */
export function formatTimeOnly(dateString: string | null | undefined): string {
    return formatDate(dateString, {
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string | null | undefined): string {
    if (!dateString) return '-';

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';

        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSecs < 60) return 'just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        return formatDateOnly(dateString);
    } catch {
        return '-';
    }
}

// ============================================================================
// TEXT FORMATTERS
// ============================================================================

/**
 * Matnni qisqartirish
 * @param text - Asl matn
 * @param maxLength - Maksimal uzunlik
 * @returns Qisqartirilgan matn
 * 
 * @example
 * truncate('Very long text here', 10) // "Very lo..."
 */
export function truncate(text: string | null | undefined, maxLength: number): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
}

/**
 * Sinf nomidan qisqa nom generatsiya qilish
 * @param fullName - To'liq nom
 * @returns Qisqa nom
 * 
 * @example
 * generateShortName('Grade 10 Mathematics') // "10-MA"
 */
export function generateClassShortName(fullName: string | null | undefined): string {
    if (!fullName) return '';

    // Sinf raqamini topish
    const gradeMatch = fullName.match(/grade\s*(\d+)/i);
    const grade = gradeMatch ? gradeMatch[1] : '';

    // Fan nomini topish
    const subjectMap: Record<string, string> = {
        'mathematics': 'MA',
        'math': 'MA',
        'science': 'SC',
        'english': 'EN',
        'history': 'HI',
        'geography': 'GE',
        'physics': 'PH',
        'chemistry': 'CH',
        'biology': 'BI',
        'literature': 'LI',
        'art': 'AR',
        'music': 'MU',
        'physical education': 'PE',
        'computer science': 'CS',
    };

    let subject = '';
    const lowerName = fullName.toLowerCase();

    for (const [key, value] of Object.entries(subjectMap)) {
        if (lowerName.includes(key)) {
            subject = value;
            break;
        }
    }

    // Agar fan topilmasa, birinchi so'zning 2 harfini olish
    if (!subject) {
        const words = fullName.split(' ').filter(word =>
            !['grade', 'class', 'year', 'level'].includes(word.toLowerCase())
        );
        if (words.length > 0) {
            subject = words[0].substring(0, 2).toUpperCase();
        }
    }

    return grade && subject ? `${grade}-${subject}` : fullName.substring(0, 6).toUpperCase();
}

/**
 * O'qituvchi nomini qisqartirish
 * @param fullName - To'liq ism
 * @returns Qisqa ism (e.g., "J. Smith")
 */
export function generateTeacherShortName(fullName: string | null | undefined): string {
    if (!fullName) return '';

    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].substring(0, 3).toUpperCase();

    // Birinchi ismning birinchi harfi + familiya
    return `${parts[0][0]}. ${parts[parts.length - 1]}`;
}

/**
 * Capitalize first letter
 */
export function capitalize(text: string | null | undefined): string {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Title case (har bir so'zning birinchi harfi katta)
 */
export function toTitleCase(text: string | null | undefined): string {
    if (!text) return '';
    return text
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// ============================================================================
// NUMBER FORMATTERS
// ============================================================================

/**
 * Sonni formatlash (ming ajratgich bilan)
 */
export function formatNumber(
    num: number | null | undefined,
    options: Intl.NumberFormatOptions = {}
): string {
    if (num === null || num === undefined) return '-';
    return new Intl.NumberFormat('en-US', options).format(num);
}

/**
 * Foizni formatlash
 */
export function formatPercent(
    value: number | null | undefined,
    decimals: number = 1
): string {
    if (value === null || value === undefined) return '-';
    return `${(value * 100).toFixed(decimals)}%`;
}

// ============================================================================
// AVAILABILITY FORMATTERS
// ============================================================================

import { Availability, TimeSlot, DayOfWeek, DayOfWeekLower } from '@/types/entities';

/**
 * Availability dagi jami periodlar sonini hisoblash
 */
export function getTotalAvailablePeriods(availability: Partial<Availability> | null | undefined): number {
    if (!availability) return 0;
    return Object.values(availability).reduce(
        (sum, periods) => sum + (Array.isArray(periods) ? periods.length : 0),
        0
    );
}

/**
 * Availability'ni qisqa matn sifatida formatlash
 * @example "35 periods (Mon-Fri)"
 */
export function formatAvailabilitySummary(availability: Partial<Availability> | null | undefined): string {
    if (!availability) return 'Not set';

    const total = getTotalAvailablePeriods(availability);
    if (total === 0) return 'No availability';

    const activeDays = Object.entries(availability)
        .filter(([_, periods]) => Array.isArray(periods) && periods.length > 0)
        .map(([day]) => day.substring(0, 3))
        .map(d => capitalize(d));

    if (activeDays.length === 0) return 'No availability';
    if (activeDays.length === 7) return `${total} periods (All week)`;
    if (activeDays.length <= 3) return `${total} periods (${activeDays.join(', ')})`;

    return `${total} periods (${activeDays.length} days)`;
}

// ============================================================================
// DAY FORMATTERS
// ============================================================================

const DAY_LABELS: Record<DayOfWeek, string> = {
    MONDAY: 'Monday',
    TUESDAY: 'Tuesday',
    WEDNESDAY: 'Wednesday',
    THURSDAY: 'Thursday',
    FRIDAY: 'Friday',
    SATURDAY: 'Saturday',
    SUNDAY: 'Sunday',
};

const DAY_SHORT_LABELS: Record<DayOfWeek, string> = {
    MONDAY: 'Mon',
    TUESDAY: 'Tue',
    WEDNESDAY: 'Wed',
    THURSDAY: 'Thu',
    FRIDAY: 'Fri',
    SATURDAY: 'Sat',
    SUNDAY: 'Sun',
};

/**
 * Hafta kunini formatlash
 */
export function formatDayOfWeek(day: DayOfWeek | null | undefined, short: boolean = false): string {
    if (!day) return '-';
    return short ? DAY_SHORT_LABELS[day] : DAY_LABELS[day];
}

/**
 * Hafta kunlarini massiv sifatida olish
 */
export function getDaysOfWeek(includeWeekend: boolean = true): DayOfWeek[] {
    const weekdays: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
    if (includeWeekend) {
        return [...weekdays, 'SATURDAY', 'SUNDAY'];
    }
    return weekdays;
}

/**
 * Backend day ni frontend formatga o'zgartirish
 */
export function dayToLowercase(day: DayOfWeek): DayOfWeekLower {
    return day.toLowerCase() as DayOfWeekLower;
}

/**
 * Frontend day ni backend formatga o'zgartirish
 */
export function dayToUppercase(day: DayOfWeekLower): DayOfWeek {
    return day.toUpperCase() as DayOfWeek;
}
