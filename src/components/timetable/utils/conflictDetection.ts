/**
 * conflictDetection
 *
 * Pure, React-free module that computes slot-placement feedback for both
 * drag-and-drop and click-to-place (manual) gestures.
 *
 * The same function is used for both modes because the UX contract is
 * identical: given a `target` lesson and a candidate `(day, timeSlot, rowClass)`,
 * tell us whether the slot is valid, and if not, *why* — including the
 * offending counterpart lesson so the UI can surface it in a tooltip.
 *
 * Precedence (short-circuit): origin -> invalid-target-class -> teacher ->
 * room -> class -> valid. We use `.find()` (not `.some()`) so that the
 * conflicting lesson is captured and can be displayed by consumers.
 *
 * @module components/timetable/utils/conflictDetection
 */

import type { Lesson, UnplacedLesson } from '../types';

export type ConflictStatus =
    | 'valid'
    | 'teacher-conflict'
    | 'room-conflict'
    | 'class-conflict'
    | 'invalid-target-class'
    | 'none';

export interface ConflictReason {
    message: string;
    conflictingLesson?: Lesson;
}

export interface ConflictResult {
    status: ConflictStatus;
    reason?: ConflictReason;
}

export interface ConflictContext {
    day: string;
    timeSlot: number;
    rowClass?: string;
    allLessons: Lesson[];
}

/**
 * Detects the relationship between a candidate `target` lesson and a slot
 * described by `context`.
 *
 * - Returns `{ status: 'none' }` when there is no active gesture or the
 *   slot is the target's own origin (the UI should render neutrally there).
 * - Returns a specific conflict status with a human-readable reason when
 *   placement would collide with another lesson.
 * - Returns `{ status: 'valid' }` when placement is allowed.
 */
export function detectSlotConflict(
    target: Lesson | UnplacedLesson | null | undefined,
    context: ConflictContext
): ConflictResult {
    // 1. No active gesture.
    if (!target) {
        return { status: 'none' };
    }

    const { day, timeSlot, rowClass, allLessons } = context;

    // 2. Origin slot of the target: neutral, not a conflict.
    if (
        target.day === day &&
        target.timeSlot === timeSlot &&
        (!rowClass || target.class === rowClass)
    ) {
        return { status: 'none' };
    }

    // 3. Row belongs to a different class than the target lesson.
    if (rowClass && target.class !== rowClass) {
        return {
            status: 'invalid-target-class',
            reason: { message: `This row is for ${rowClass}.` },
        };
    }

    // 4. Teacher conflict: same teacher already teaching at this day/slot.
    const teacherOffender = allLessons.find(
        (l) =>
            l.id !== target.id &&
            l.teacherId === target.teacherId &&
            l.day === day &&
            l.timeSlot === timeSlot
    );
    if (teacherOffender) {
        return {
            status: 'teacher-conflict',
            reason: {
                message: `${teacherOffender.teacher} is already teaching ${teacherOffender.class} this period.`,
                conflictingLesson: teacherOffender,
            },
        };
    }

    // 5. Room conflict: skip when target has no real room assigned (roomId 0 is "unassigned").
    if (target.roomId && target.roomId > 0) {
        const roomOffender = allLessons.find(
            (l) =>
                l.id !== target.id &&
                l.roomId === target.roomId &&
                l.day === day &&
                l.timeSlot === timeSlot
        );
        if (roomOffender) {
            return {
                status: 'room-conflict',
                reason: {
                    message: `${target.room} is occupied by ${roomOffender.class} this period.`,
                    conflictingLesson: roomOffender,
                },
            };
        }
    }

    // 6. Class conflict: same class already has a lesson at this day/slot.
    const classOffender = allLessons.find(
        (l) =>
            l.id !== target.id &&
            l.classId === target.classId &&
            l.day === day &&
            l.timeSlot === timeSlot
    );
    if (classOffender) {
        return {
            status: 'class-conflict',
            reason: {
                message: `${classOffender.class} already has ${classOffender.subject} this period.`,
                conflictingLesson: classOffender,
            },
        };
    }

    // 7. All clear.
    return { status: 'valid' };
}
