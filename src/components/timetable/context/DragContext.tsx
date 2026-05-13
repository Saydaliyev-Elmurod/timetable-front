/**
 * DragContext — Shared state for the DnD system
 *
 * Provides:
 * - draggedLesson: Currently dragged lesson
 * - autoSwitchClassId: classId to auto-switch the grid to
 * - availabilityMaps: Precomputed availability data for highlighting
 * - slot validation: Real-time conflict/availability checks per cell
 *
 * @module components/timetable/context/DragContext
 */

import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface AvailabilityMap {
    /** Map<"MONDAY-3", true> — teacher is available at (MONDAY, period 3) */
    teacher: Map<string, boolean>;
    /** Map<"MONDAY-3", true> — class is available at (MONDAY, period 3) */
    class: Map<string, boolean>;
    /** Map<"MONDAY-3", true> — subject is available at (MONDAY, period 3) */
    subject: Map<string, boolean>;
}

export type SlotStatus =
    | 'available'        // Green — fully valid
    | 'teacher-conflict' // Red — teacher busy (another lesson)
    | 'room-conflict'    // Blue — room occupied
    | 'teacher-timeoff'  // Amber — teacher's time-off
    | 'class-timeoff'    // Purple — class's time-off
    | 'subject-timeoff'  // Orange — subject's time-off
    | 'occupied-swap'    // Yellow — occupied but can swap
    | 'invalid'          // Gray — wrong class or disabled
    | 'neutral';         // No active drag

export interface DragContextState {
    /** Whether a lesson is currently being dragged */
    isDragging: boolean;
    /** The classId that should be auto-switched to */
    autoSwitchClassId: number | null;
    /** The className that should be auto-switched to */
    autoSwitchClassName: string | null;
    /** Precomputed availability map for the currently dragged lesson */
    availabilityMap: AvailabilityMap | null;
    /** Called when drag starts — computes availability, triggers auto-switch */
    onDragStart: (lesson: DragLesson) => void;
    /** Called when drag ends */
    onDragEnd: () => void;
    /** Get slot status for a given (day, period, className) */
    getSlotStatus: (day: string, period: number, targetClassName: string) => SlotStatus;
}

export interface DragLesson {
    id: string;
    classId: number;
    className: string;
    teacherId: number;
    roomId: number;
    subjectId: number;
    day?: string;
    timeSlot?: number;
}

export interface TeacherAvailability {
    id: number;
    availabilities: { dayOfWeek: string; lessons: number[] }[];
}

export interface ClassAvailability {
    id: number;
    availabilities: { dayOfWeek: string; lessons: number[] }[];
}

export interface SubjectAvailability {
    id: number;
    availabilities: { dayOfWeek: string; lessons: number[] }[];
}

export interface ScheduledLessonRef {
    id: string;
    teacherId: number;
    roomId: number;
    classId: number;
    className: string;
    day?: string;
    timeSlot?: number;
}

interface DragContextProviderProps {
    children: React.ReactNode;
    /** All teacher availability data */
    teachers: TeacherAvailability[];
    /** All class availability data */
    classes: ClassAvailability[];
    /** All subject availability data */
    subjects: SubjectAvailability[];
    /** All currently scheduled lessons */
    scheduledLessons: ScheduledLessonRef[];
}

// ============================================================================
// CONTEXT
// ============================================================================

const DragCtx = createContext<DragContextState | null>(null);

export function useDragContext(): DragContextState {
    const ctx = useContext(DragCtx);
    if (!ctx) {
        // Return a safe default when used outside provider
        return {
            isDragging: false,
            autoSwitchClassId: null,
            autoSwitchClassName: null,
            availabilityMap: null,
            onDragStart: () => { },
            onDragEnd: () => { },
            getSlotStatus: () => 'neutral',
        };
    }
    return ctx;
}

// ============================================================================
// UTILITY: Build availability map key
// ============================================================================

function slotKey(day: string, period: number): string {
    return `${day}-${period}`;
}

/**
 * Build a Map<slotKey, true> from availability arrays.
 * If availabilities is empty/null, ALL slots are treated as available.
 */
function buildAvailMap(
    availabilities: { dayOfWeek: string; lessons: number[] }[] | undefined
): Map<string, boolean> {
    const map = new Map<string, boolean>();
    if (!availabilities || availabilities.length === 0) {
        // No restrictions — everything is available (we won't add to map, meaning "available by default")
        return map;
    }
    for (const slot of availabilities) {
        for (const period of slot.lessons) {
            map.set(slotKey(slot.dayOfWeek, period), true);
        }
    }
    return map;
}

/**
 * Check if an entity is available at (day, period) given its availability map.
 * If the map is empty, all slots are available (no restrictions).
 */
function isAvailable(map: Map<string, boolean>, day: string, period: number): boolean {
    if (map.size === 0) return true; // No restrictions
    return map.has(slotKey(day, period));
}

// ============================================================================
// PROVIDER
// ============================================================================

export function DragContextProvider({
    children,
    teachers,
    classes,
    subjects,
    scheduledLessons,
}: DragContextProviderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [autoSwitchClassId, setAutoSwitchClassId] = useState<number | null>(null);
    const [autoSwitchClassName, setAutoSwitchClassName] = useState<string | null>(null);
    const [availabilityMap, setAvailabilityMap] = useState<AvailabilityMap | null>(null);

    // Cache the dragged lesson ref
    const draggedLessonRef = useRef<DragLesson | null>(null);

    // Build lookup maps once (memoized)
    const teacherMap = useMemo(
        () => new Map(teachers.map((t) => [t.id, t])),
        [teachers]
    );
    const classMap = useMemo(
        () => new Map(classes.map((c) => [c.id, c])),
        [classes]
    );
    const subjectMap = useMemo(
        () => new Map(subjects.map((s) => [s.id, s])),
        [subjects]
    );

    // Build occupation index: { "MONDAY-3" => [{teacherId, roomId, classId, ...}] }
    const occupationIndex = useMemo(() => {
        const index = new Map<string, ScheduledLessonRef[]>();
        for (const lesson of scheduledLessons) {
            if (lesson.day && lesson.timeSlot) {
                const key = slotKey(lesson.day, lesson.timeSlot);
                if (!index.has(key)) index.set(key, []);
                index.get(key)!.push(lesson);
            }
        }
        return index;
    }, [scheduledLessons]);

    const onDragStart = useCallback(
        (lesson: DragLesson) => {
            draggedLessonRef.current = lesson;
            setIsDragging(true);
            setAutoSwitchClassId(lesson.classId);
            setAutoSwitchClassName(lesson.className);

            // Build availability maps for this lesson
            const teacher = teacherMap.get(lesson.teacherId);
            const cls = classMap.get(lesson.classId);
            const subject = subjectMap.get(lesson.subjectId);

            setAvailabilityMap({
                teacher: buildAvailMap(teacher?.availabilities),
                class: buildAvailMap(cls?.availabilities),
                subject: buildAvailMap(subject?.availabilities),
            });
        },
        [teacherMap, classMap, subjectMap]
    );

    const onDragEnd = useCallback(() => {
        draggedLessonRef.current = null;
        setIsDragging(false);
        setAutoSwitchClassId(null);
        setAutoSwitchClassName(null);
        setAvailabilityMap(null);
    }, []);

    const getSlotStatus = useCallback(
        (day: string, period: number, targetClassName: string): SlotStatus => {
            const lesson = draggedLessonRef.current;
            if (!lesson) return 'neutral';

            // 1. Wrong class target
            if (lesson.className !== targetClassName) {
                return 'invalid';
            }

            // 2. Same slot as source (neutral)
            if (lesson.day === day && lesson.timeSlot === period) {
                return 'neutral';
            }

            // 3. Check availability time-offs
            if (availabilityMap) {
                if (!isAvailable(availabilityMap.teacher, day, period)) {
                    return 'teacher-timeoff';
                }
                if (!isAvailable(availabilityMap.class, day, period)) {
                    return 'class-timeoff';
                }
                if (!isAvailable(availabilityMap.subject, day, period)) {
                    return 'subject-timeoff';
                }
            }

            // 4. Check occupation conflicts
            const key = slotKey(day, period);
            const occupants = occupationIndex.get(key) || [];
            const otherOccupants = occupants.filter((o) => o.id !== lesson.id);

            if (otherOccupants.length > 0) {
                // Teacher conflict
                if (otherOccupants.some((o) => o.teacherId === lesson.teacherId)) {
                    return 'teacher-conflict';
                }
                // Room conflict
                if (lesson.roomId && otherOccupants.some((o) => o.roomId === lesson.roomId)) {
                    return 'room-conflict';
                }
                // Occupied but swappable (same class)
                if (otherOccupants.some((o) => o.className === lesson.className)) {
                    return 'occupied-swap';
                }
            }

            // 5. All clear
            return 'available';
        },
        [availabilityMap, occupationIndex]
    );

    const value = useMemo<DragContextState>(
        () => ({
            isDragging,
            autoSwitchClassId,
            autoSwitchClassName,
            availabilityMap,
            onDragStart,
            onDragEnd,
            getSlotStatus,
        }),
        [isDragging, autoSwitchClassId, autoSwitchClassName, availabilityMap, onDragStart, onDragEnd, getSlotStatus]
    );

    return <DragCtx.Provider value={value}>{children}</DragCtx.Provider>;
}
