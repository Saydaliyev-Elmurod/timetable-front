/**
 * Zustand DnD store for the Timetable grid (Pass 4B).
 *
 * Single source of truth for the transient drag state shared between
 * `<DndContext>`, the `DroppableTimeSlot` cells, the `DragPreview`, and the
 * draggable wrappers (`DraggableLessonCard`, `DraggableSlotCard`).
 *
 * The store intentionally holds ONLY identifiers and a lightweight payload.
 * Concrete `Lesson` / `SlotGroup` data is resolved by the caller at the
 * `DragOverlay` boundary, so the store never needs to invalidate when the
 * underlying lesson array changes — this keeps hovered/source-cell
 * re-renders isolated from the rest of the grid.
 *
 * @module components/timetable/store/useTimetableDnd
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import type { Lesson, SlotGroup } from '../types';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type ActiveKind = 'slot' | 'sub' | 'unplaced' | null;

export type DropReason =
    | 'ok'
    | 'locked'
    | 'teacher-busy'
    | 'room-busy'
    | 'class-busy'
    | 'availability'
    | 'wrong-class';

export interface DropCandidate {
    slotKey: string;
    isValid: boolean;
    reason: DropReason;
}

export interface ActivePayload {
    slotKey?: string;
    lessonId?: string;
    entityId?: string;
    day?: string;
    hour?: number;
    classId?: number;
}

export interface TimetableDndState {
    activeId: string | null;
    activeKind: ActiveKind;
    activePayload: ActivePayload | null;
    dropCandidate: DropCandidate | null;
    altMode: boolean;

    beginDrag(p: {
        activeId: string;
        kind: Exclude<ActiveKind, null>;
        payload: ActivePayload | null;
        altMode: boolean;
    }): void;
    setDropCandidate(c: DropCandidate | null): void;
    setAltMode(alt: boolean): void;
    endDrag(): void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useTimetableDnd = create<TimetableDndState>()(
    subscribeWithSelector((set) => ({
        activeId: null,
        activeKind: null,
        activePayload: null,
        dropCandidate: null,
        altMode: false,

        beginDrag: ({ activeId, kind, payload, altMode }) =>
            set({
                activeId,
                activeKind: kind,
                activePayload: payload,
                dropCandidate: null,
                altMode,
            }),

        setDropCandidate: (c) => set({ dropCandidate: c }),

        setAltMode: (alt) => set({ altMode: alt }),

        endDrag: () =>
            set({
                activeId: null,
                activeKind: null,
                activePayload: null,
                dropCandidate: null,
            }),
    })),
);

// ---------------------------------------------------------------------------
// Cell-level selector
// ---------------------------------------------------------------------------

/**
 * Returns the drag-state flags for a single slot cell.
 *
 * Uses `useShallow` so each cell only re-renders when one of its own flags
 * actually flips — the hovered cell and the source cell re-render; the other
 * hundreds of cells do not.
 */
export function useActiveForSlot(slotKey: string) {
    return useTimetableDnd(
        useShallow((s) => {
            const isActiveSource =
                s.activePayload?.slotKey === slotKey && s.activeKind !== null;
            const isDropCandidate = s.dropCandidate?.slotKey === slotKey;
            const isValidTarget = isDropCandidate
                ? s.dropCandidate!.isValid
                : false;
            return { isActiveSource, isDropCandidate, isValidTarget };
        }),
    );
}

// ---------------------------------------------------------------------------
// validateDrop — UI pre-check (server remains final validator)
// ---------------------------------------------------------------------------

export interface OverData {
    slotKey: string;
    day: string;
    hour: number;
    classId?: number;
}

/**
 * Lightweight client-side validation. Matches the reasons exposed in
 * `DropReason`. The server still makes the final call on every action; this
 * only governs the visual ring colour while dragging.
 */
export function validateDrop(
    payload: ActivePayload | null,
    over: OverData | null,
    allLessons: Lesson[],
): DropCandidate {
    if (!over) {
        return { slotKey: '', isValid: false, reason: 'availability' };
    }
    if (!payload) {
        return { slotKey: over.slotKey, isValid: true, reason: 'ok' };
    }

    // 1. Wrong-class: only when both sides expose a classId.
    if (
        payload.classId !== undefined &&
        over.classId !== undefined &&
        payload.classId !== over.classId
    ) {
        return {
            slotKey: over.slotKey,
            isValid: false,
            reason: 'wrong-class',
        };
    }

    // Same slot: always "ok" so the source cell shows a neutral ring.
    if (payload.slotKey && payload.slotKey === over.slotKey) {
        return { slotKey: over.slotKey, isValid: true, reason: 'ok' };
    }

    // 2. Locked lesson in the target slot.
    const targetLessons = allLessons.filter(
        (l) => l.day === over.day && l.timeSlot === over.hour,
    );
    const hasLocked = targetLessons.some((l) => l.isLocked);
    if (hasLocked) {
        return { slotKey: over.slotKey, isValid: false, reason: 'locked' };
    }

    // 3. Resource conflicts — look up the dragged lesson to compare ids.
    const dragged = payload.lessonId
        ? allLessons.find((l) => l.id === payload.lessonId)
        : null;
    if (dragged) {
        const teacherBusy = targetLessons.some(
            (l) => l.id !== dragged.id && l.teacherId === dragged.teacherId,
        );
        if (teacherBusy) {
            return {
                slotKey: over.slotKey,
                isValid: false,
                reason: 'teacher-busy',
            };
        }

        if (dragged.roomId) {
            const roomBusy = targetLessons.some(
                (l) => l.id !== dragged.id && l.roomId === dragged.roomId,
            );
            if (roomBusy) {
                return {
                    slotKey: over.slotKey,
                    isValid: false,
                    reason: 'room-busy',
                };
            }
        }

        if (dragged.classId) {
            const classBusy = targetLessons.some(
                (l) => l.id !== dragged.id && l.classId === dragged.classId,
            );
            // class-busy only meaningful when the over cell is not in the
            // dragged lesson's own class row (handled by wrong-class above).
            if (classBusy && over.classId === undefined) {
                return {
                    slotKey: over.slotKey,
                    isValid: false,
                    reason: 'class-busy',
                };
            }
        }
    }

    return { slotKey: over.slotKey, isValid: true, reason: 'ok' };
}

// ---------------------------------------------------------------------------
// Re-exports used by pages
// ---------------------------------------------------------------------------

export type { Lesson, SlotGroup };
