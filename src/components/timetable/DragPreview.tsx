/**
 * DragPreview
 *
 * Rendered inside `<DragOverlay>` while a lesson or whole slot is being
 * dragged. The preview is presentational only — it does not participate in
 * hit-testing. The active id/kind are read from the Zustand DnD store, while
 * the caller passes the resolved `Lesson` or `SlotGroup` so the store itself
 * never needs to hold heavy references.
 *
 * @module components/timetable/DragPreview
 */

import React from 'react';
import { cn } from '@/components/ui/utils';
import { Lock } from 'lucide-react';
import type { Lesson, SlotGroup } from './types';
import { SUBJECT_PALETTE } from './utils/subjectColor';
import { useTimetableDnd } from './store/useTimetableDnd';

export interface DragPreviewProps {
    lesson?: Lesson | null;
    slotGroup?: SlotGroup | null;
}

function lessonPaletteClass(lesson: Lesson): string {
    return lesson.subjectColorIndex >= 0
        ? SUBJECT_PALETTE[lesson.subjectColorIndex]
        : SUBJECT_PALETTE[0];
}

/**
 * Single-lesson preview — mirrors the compact look of `DraggableLessonCard`
 * but at full opacity with a slight tilt/scale/shadow overlay treatment.
 */
function LessonPreview({ lesson }: { lesson: Lesson }) {
    return (
        <div
            className={cn(
                'p-2 rounded-lg border-2 shadow-2xl ring-1 ring-indigo-500/40',
                'scale-[1.03] rotate-[0.5deg]',
                'pointer-events-none select-none',
                'min-w-[140px] max-w-[220px]',
                lessonPaletteClass(lesson),
            )}
        >
            <div className="flex items-start justify-between gap-1">
                <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{lesson.subject}</div>
                    <div className="text-xs opacity-75 truncate">
                        {lesson.class}
                    </div>
                    {lesson.teacherShort && (
                        <div className="text-xs opacity-75 truncate">
                            {lesson.teacherShort}
                        </div>
                    )}
                </div>
                {lesson.isLocked && (
                    <Lock className="h-3 w-3 text-yellow-600 flex-shrink-0" />
                )}
            </div>
        </div>
    );
}

/**
 * Whole-slot preview — stacks the first three lessons of the group using the
 * same palette treatment. Keeps the ghost compact even when the slot holds 4+
 * sub-cards.
 */
function SlotPreview({ slotGroup }: { slotGroup: SlotGroup }) {
    const head = slotGroup.lessons.slice(0, 3);
    return (
        <div
            className={cn(
                'rounded-lg border-2 border-indigo-500/60 bg-white p-1.5',
                'shadow-2xl ring-1 ring-indigo-500/40',
                'scale-[1.03] rotate-[0.5deg]',
                'pointer-events-none select-none',
                'flex flex-col gap-1 min-w-[160px] max-w-[240px]',
            )}
        >
            {head.map((l) => (
                <div
                    key={l.id}
                    className={cn(
                        'p-1.5 rounded border text-xs',
                        lessonPaletteClass(l),
                    )}
                >
                    <div className="font-medium truncate">{l.subject}</div>
                    <div className="opacity-75 truncate">
                        {l.groupName || l.teacherShort || l.class}
                    </div>
                </div>
            ))}
            {slotGroup.lessons.length > head.length && (
                <div className="text-[10px] text-center text-slate-500">
                    +{slotGroup.lessons.length - head.length} more
                </div>
            )}
        </div>
    );
}

export function DragPreview({ lesson, slotGroup }: DragPreviewProps) {
    const activeKind = useTimetableDnd((s) => s.activeKind);

    if (!activeKind) return null;

    if (activeKind === 'slot' && slotGroup) {
        return <SlotPreview slotGroup={slotGroup} />;
    }
    if ((activeKind === 'sub' || activeKind === 'unplaced') && lesson) {
        return <LessonPreview lesson={lesson} />;
    }
    return null;
}

export default DragPreview;
