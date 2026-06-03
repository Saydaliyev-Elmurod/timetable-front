import React from 'react';
import { AvailState } from '@/lib/availability';

export interface AvailGridProps {
  avail: AvailState;
  periods: number[];
  days: readonly string[];
  onChange: (next: AvailState) => void;
  /** Selected-cell color. */
  onColor?: string;
  /** Unselected-cell color. */
  offColor?: string;
  /** Full CSS border applied to every cell (e.g. '1px solid #E2E8F0'). */
  cellBorder?: string;
  cellRadius?: number;
  cellHeight?: number;
  gap?: number;
  /** Day-header label renderer (e.g. localize the API day key). */
  dayLabel?: (d: string) => string;
  dayHeaderFont?: string;
  dayHeaderColor?: string;
  periodFont?: string;
  periodColor?: string;
  headerPadding?: string;
  /** Stop click propagation on the day/period header toggles (for clickable containers). */
  stopPropagation?: boolean;
}

/**
 * Interactive availability grid: columns = days, rows = periods.
 * Clicking a day header toggles the whole column; a period label toggles the row.
 * Consolidates the four near-identical copies that lived inline in the CRUD pages —
 * per-page look (colors, borders, fonts, day labels) is driven entirely by props.
 */
export function AvailGrid({
  avail,
  periods,
  days,
  onChange,
  onColor = '#10B981',
  offColor = '#F1F5F9',
  cellBorder = '0',
  cellRadius = 4,
  cellHeight = 24,
  gap = 4,
  dayLabel = (d) => d,
  dayHeaderFont = '700 10px Manrope',
  dayHeaderColor = '#94A3B8',
  periodFont = '800 10px JetBrains Mono',
  periodColor = '#94A3B8',
  headerPadding = '0',
  stopPropagation = false,
}: AvailGridProps) {
  const stop = (e: React.MouseEvent) => {
    if (stopPropagation) e.stopPropagation();
  };

  const toggle = (d: string, p: number) => {
    const dayAvail = avail[d] || {};
    onChange({ ...avail, [d]: { ...dayAvail, [p]: !dayAvail[p] } });
  };

  // Kun (ustun) toggle — shu kunning barcha periodlari.
  const toggleDay = (e: React.MouseEvent, d: string) => {
    stop(e);
    const dayAvail = avail[d] || {};
    const allOn = periods.every((p) => dayAvail[p]);
    const next = { ...dayAvail };
    periods.forEach((p) => {
      next[p] = !allOn;
    });
    onChange({ ...avail, [d]: next });
  };

  // Period (qator) toggle — barcha faol kunlar bo'ylab.
  const togglePeriod = (e: React.MouseEvent, p: number) => {
    stop(e);
    const allOn = days.every((d) => avail[d]?.[p]);
    const next = { ...avail };
    days.forEach((d) => {
      next[d] = { ...(next[d] || {}), [p]: !allOn };
    });
    onChange(next);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `40px repeat(${days.length}, 1fr)`, gap }}>
      <div />
      {days.map((d) => (
        <button
          key={d}
          onClick={(e) => toggleDay(e, d)}
          style={{
            border: 0,
            background: 'transparent',
            font: dayHeaderFont,
            color: dayHeaderColor,
            cursor: 'pointer',
            padding: headerPadding,
            textAlign: 'center',
          }}
        >
          {dayLabel(d)}
        </button>
      ))}
      {periods.map((p) => (
        <React.Fragment key={p}>
          <button
            onClick={(e) => togglePeriod(e, p)}
            style={{
              border: 0,
              background: 'transparent',
              font: periodFont,
              color: periodColor,
              cursor: 'pointer',
              padding: headerPadding,
            }}
          >
            {p}
          </button>
          {days.map((d) => (
            <button
              key={d}
              onClick={() => toggle(d, p)}
              style={{
                height: cellHeight,
                borderRadius: cellRadius,
                border: cellBorder,
                background: avail[d]?.[p] ? onColor : offColor,
                cursor: 'pointer',
                transition: 'all 100ms',
              }}
            />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}

export default AvailGrid;
