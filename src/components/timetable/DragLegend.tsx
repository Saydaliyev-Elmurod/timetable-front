/**
 * DragLegend Component
 *
 * Legend showing cell color meanings during drag-and-drop.
 * Visible only while dragging, positioned top-right of grid area.
 *
 * @module components/timetable/DragLegend
 */

import React from 'react';
import { cn } from '@/components/ui/utils';
import { useTimetableDnd } from './store/useTimetableDnd';

export function DragLegend() {
    const isDragging = useTimetableDnd((s) => s.activeId !== null);

    if (!isDragging) return null;

    return (
        <div
            className={cn(
                'absolute top-2 right-2 z-20',
                'bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg',
                'px-3 py-2 shadow-md text-xs',
                'flex flex-col gap-1.5',
                'pointer-events-none select-none'
            )}
        >
            <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-emerald-400 flex-shrink-0" />
                <span className="text-gray-700">Available</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-blue-400 flex-shrink-0" />
                <span className="text-gray-700">Optimal slot</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-red-400 flex-shrink-0" />
                <span className="text-gray-700">Conflict</span>
            </div>
        </div>
    );
}

export default DragLegend;
