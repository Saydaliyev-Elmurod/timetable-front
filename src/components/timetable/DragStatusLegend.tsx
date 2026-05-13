/**
 * DragStatusLegend — Floating legend shown during drag
 *
 * Shows color-coded status meanings so users understand
 * what each cell color means while dragging.
 *
 * @module components/timetable/DragStatusLegend
 */

import React from 'react';
import { cn } from '@/components/ui/utils';
import { useDragContext } from './context/DragContext';

const LEGEND_ITEMS = [
    { color: 'bg-green-400', label: "Bo'sh — joylashtirish mumkin" },
    { color: 'bg-yellow-400', label: 'Band — almashtirish mumkin' },
    { color: 'bg-red-400', label: "O'qituvchi band" },
    { color: 'bg-blue-400', label: 'Xona band' },
    { color: 'bg-amber-400', label: "O'qituvchi vaqt chegarasi" },
    { color: 'bg-purple-400', label: 'Sinf vaqt chegarasi' },
    { color: 'bg-orange-400', label: 'Fan vaqt chegarasi' },
    { color: 'bg-gray-300', label: 'Boshqa sinf' },
];

export function DragStatusLegend() {
    const { isDragging, autoSwitchClassName } = useDragContext();

    if (!isDragging) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="bg-white/95 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-2xl px-5 py-3.5">
                <div className="flex items-center gap-4 flex-wrap">
                    {/* Auto-switch info */}
                    {autoSwitchClassName && (
                        <div className="flex items-center gap-2 pr-4 border-r border-gray-200">
                            <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                🎯 {autoSwitchClassName}
                            </span>
                        </div>
                    )}

                    {/* Color legend */}
                    {LEGEND_ITEMS.map((item) => (
                        <div key={item.label} className="flex items-center gap-1.5">
                            <div className={cn('w-2.5 h-2.5 rounded-full', item.color)} />
                            <span className="text-[11px] text-gray-600 whitespace-nowrap">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default DragStatusLegend;
