// Time slot conversion utilities
// Single source of truth for availability <-> timeSlots conversion

export interface Availability {
    monday: number[];
    tuesday: number[];
    wednesday: number[];
    thursday: number[];
    friday: number[];
    saturday: number[];
    sunday: number[];
}

export interface TimeSlot {
    dayOfWeek: string;
    lessons: number[];
}

// Day mappings
const DAY_TO_BACKEND: Record<string, string> = {
    monday: 'MONDAY',
    tuesday: 'TUESDAY',
    wednesday: 'WEDNESDAY',
    thursday: 'THURSDAY',
    friday: 'FRIDAY',
    saturday: 'SATURDAY',
    sunday: 'SUNDAY'
};

const BACKEND_TO_DAY: Record<string, keyof Availability> = {
    MONDAY: 'monday',
    TUESDAY: 'tuesday',
    WEDNESDAY: 'wednesday',
    THURSDAY: 'thursday',
    FRIDAY: 'friday',
    SATURDAY: 'saturday',
    SUNDAY: 'sunday'
};

/**
 * Convert frontend availability object to backend TimeSlot array
 * @param availability - Frontend availability object with day keys
 * @returns Array of TimeSlot objects for backend API
 */
export function convertToTimeSlots(availability: Partial<Availability>): TimeSlot[] {
    if (!availability) return [];

    const timeSlots: TimeSlot[] = [];

    Object.entries(availability).forEach(([day, lessons]) => {
        const backendDay = DAY_TO_BACKEND[day];
        if (backendDay && Array.isArray(lessons) && lessons.length > 0) {
            timeSlots.push({
                dayOfWeek: backendDay,
                lessons: [...lessons].sort((a, b) => a - b)
            });
        }
    });

    return timeSlots;
}

/**
 * Convert backend TimeSlot array to frontend availability object
 * @param timeSlots - Array of TimeSlot objects from backend API
 * @returns Frontend availability object with day keys
 */
export function convertFromTimeSlots(timeSlots: TimeSlot[] | undefined | null): Availability {
    const availability: Availability = {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: []
    };

    if (!timeSlots || !Array.isArray(timeSlots)) {
        return availability;
    }

    timeSlots.forEach(slot => {
        if (!slot?.dayOfWeek) return;
        const day = BACKEND_TO_DAY[slot.dayOfWeek];
        if (day) {
            availability[day] = Array.isArray(slot.lessons) ? [...slot.lessons] : [];
        }
    });

    return availability;
}

/**
 * Create default availability with all periods for weekdays
 * @param periods - Array of period numbers (e.g., [1,2,3,4,5,6,7])
 * @param includeWeekend - Whether to include Saturday/Sunday
 * @returns Full availability object
 */
export function createDefaultAvailability(
    periods: number[] = [1, 2, 3, 4, 5, 6, 7],
    includeWeekend = false
): Availability {
    const weekdayPeriods = [...periods];
    const weekendPeriods = includeWeekend ? [...periods] : [];

    return {
        monday: weekdayPeriods,
        tuesday: weekdayPeriods,
        wednesday: weekdayPeriods,
        thursday: weekdayPeriods,
        friday: weekdayPeriods,
        saturday: weekendPeriods,
        sunday: weekendPeriods
    };
}

/**
 * Check if availability is empty (no periods selected)
 */
export function isAvailabilityEmpty(availability: Partial<Availability>): boolean {
    if (!availability) return true;
    return Object.values(availability).every(
        periods => !Array.isArray(periods) || periods.length === 0
    );
}

/**
 * Get total number of available periods
 */
export function getTotalAvailablePeriods(availability: Partial<Availability>): number {
    if (!availability) return 0;
    return Object.values(availability).reduce(
        (sum, periods) => sum + (Array.isArray(periods) ? periods.length : 0),
        0
    );
}

/**
 * Toggle a specific period for a day
 */
export function togglePeriod(
    availability: Availability,
    day: keyof Availability,
    period: number
): Availability {
    const currentPeriods = availability[day] || [];
    const newPeriods = currentPeriods.includes(period)
        ? currentPeriods.filter(p => p !== period)
        : [...currentPeriods, period].sort((a, b) => a - b);

    return {
        ...availability,
        [day]: newPeriods
    };
}

/**
 * Select/deselect all periods for a day
 */
export function toggleDay(
    availability: Availability,
    day: keyof Availability,
    allPeriods: number[]
): Availability {
    const currentPeriods = availability[day] || [];
    const allSelected = allPeriods.every(p => currentPeriods.includes(p));

    return {
        ...availability,
        [day]: allSelected ? [] : [...allPeriods]
    };
}

/**
 * Select/deselect a period across all days
 */
export function togglePeriodAcrossDays(
    availability: Availability,
    period: number,
    days: (keyof Availability)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
): Availability {
    const isSelected = days.some(day => (availability[day] || []).includes(period));
    const newAvailability = { ...availability };

    days.forEach(day => {
        const currentPeriods = newAvailability[day] || [];
        if (isSelected) {
            newAvailability[day] = currentPeriods.filter(p => p !== period);
        } else {
            if (!currentPeriods.includes(period)) {
                newAvailability[day] = [...currentPeriods, period].sort((a, b) => a - b);
            }
        }
    });

    return newAvailability;
}
