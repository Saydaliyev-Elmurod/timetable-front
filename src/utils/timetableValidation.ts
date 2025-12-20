import { ScheduledLessonDto } from '../types/advancedTimetable';

export interface ValidationResult {
    valid: boolean;
    reason?: string;
}

export const validateMove = (
    lesson: ScheduledLessonDto,
    targetDay: number,
    targetHour: number,
    schedule: ScheduledLessonDto[],
    maxDailyHours: number = 6
): ValidationResult => {
    // 1. Boundary Check
    if (targetHour + lesson.period - 1 > maxDailyHours) {
        return { valid: false, reason: "Lesson exceeds daily hours" };
    }

    // Generate the time slots this lesson will occupy
    const requiredSlots: number[] = [];
    for (let i = 0; i < lesson.period; i++) {
        requiredSlots.push(targetHour + i);
    }

    // Iterate over each required slot to check for conflicts
    for (const slot of requiredSlots) {
        // Find lessons already in this slot
        const existingLessons = schedule.filter(
            (l) => l.dayIndex === targetDay &&
                l.hourIndex === slot &&
                l.id !== lesson.id // Exclude self if we are essentially moving an existing lesson within the array
        );

        for (const existing of existingLessons) {
            // 2. Hard Conflict Check: Target occupied by Weekly lesson
            if (existing.weekIndex === null) {
                return { valid: false, reason: `Conflict with Weekly lesson '${existing.subjectName}' at hour ${slot}` };
            }

            // 3. Layered Compatibility Check
            // If dropping Week A (0)
            if (lesson.weekIndex === 0) {
                // Cannot drop if Week A is present
                if (existing.weekIndex === 0) {
                    return { valid: false, reason: `Conflict with Week A lesson '${existing.subjectName}' at hour ${slot}` };
                }
                // Can drop if Week B is present (weekIndex === 1) -> Valid
            }

            // If dropping Week B (1)
            if (lesson.weekIndex === 1) {
                // Cannot drop if Week B is present
                if (existing.weekIndex === 1) {
                    return { valid: false, reason: `Conflict with Week B lesson '${existing.subjectName}' at hour ${slot}` };
                }
                // Can drop if Week A is present (weekIndex === 0) -> Valid
            }

            // If dropping Weekly (null)
            if (lesson.weekIndex === null) {
                // Cannot drop if ANY lesson is present (since it needs the whole slot)
                return { valid: false, reason: `Weekly lesson requires empty slot. Conflict with '${existing.subjectName}' at hour ${slot}` };
            }
        }
    }

    // If checks pass
    return { valid: true };
};
