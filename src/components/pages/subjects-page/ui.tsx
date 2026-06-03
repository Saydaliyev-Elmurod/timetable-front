import React from 'react';
import { Trash2 } from 'lucide-react';
import { AvailGrid as SharedAvailGrid } from '@/components/shared';
import { CL_DAYS } from './constants';
import { AvailState } from './helpers';

interface AvailGridProps {
  avail: AvailState;
  periods: number[];
  days?: readonly string[];
  onChange: (next: AvailState) => void;
}

// Re-export the shared AvailGrid with the subjects-specific look baked in, so
// existing './ui' import paths (e.g. SubjectEditor) stay stable.
export function AvailGrid({ avail, periods, days = CL_DAYS, onChange }: AvailGridProps) {
  return (
    <SharedAvailGrid
      avail={avail}
      periods={periods}
      days={days}
      onChange={onChange}
      onColor="#10B981"
      offColor="#fff"
      cellBorder="1px solid #E2E8F0"
      cellRadius={4}
      stopPropagation
      dayHeaderFont="800 11px Plus Jakarta Sans"
      dayHeaderColor="#475569"
      headerPadding="4px 0"
      periodFont="800 10px JetBrains Mono"
    />
  );
}

interface FieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

export function Field({ label, required, children }: FieldProps) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span
        style={{
          font: '700 10px Plus Jakarta Sans',
          color: '#64748B',
          letterSpacing: '.08em',
          textTransform: 'uppercase',
        }}
      >
        {label}
        {required && <span style={{ color: '#DC2626' }}>*</span>}
      </span>
      {children}
    </label>
  );
}

interface SelectOption {
  v: string | number;
  label: string;
}

interface SelectProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  options: SelectOption[];
}

export function Select({ label, value, onChange, options }: SelectProps) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
      <span style={{ font: '500 11px Manrope', color: '#94A3B8' }}>{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          font: '600 12px Manrope',
          color: '#0F172A',
          background: '#fff',
          border: '1px solid #E2E8F0',
          padding: '8px 28px 8px 11px',
          borderRadius: 8,
          cursor: 'pointer',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 8px center',
        }}
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

interface ConfirmDeletePayload {
  bulk?: boolean;
  n?: number;
}

interface ConfirmDeleteProps {
  payload: ConfirmDeletePayload;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDelete({ payload, onCancel, onConfirm }: ConfirmDeleteProps) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.55)',
        zIndex: 110,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backdropFilter: 'saturate(140%) blur(3px)',
        animation: 'et-fade 160ms ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 14,
          width: '100%',
          maxWidth: 380,
          padding: '22px 22px 18px',
          boxShadow: '0 24px 60px -16px rgba(15,23,42,0.32)',
          animation: 'et-pop 200ms cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: '#FEF2F2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trash2 size={18} />
          </div>
          <div>
            <div style={{ font: '800 16px Plus Jakarta Sans', color: '#0F172A' }}>
              {payload.bulk ? `${payload.n} ta fanni o'chirish?` : "Fanni o'chirish?"}
            </div>
            <div style={{ font: '500 12px Manrope', color: '#64748B', marginTop: 2 }}>
              Bu amalni qaytarib bo'lmaydi.
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              font: '700 12px Manrope',
              color: '#475569',
              background: '#fff',
              border: '1px solid #E2E8F0',
              padding: '10px 14px',
              borderRadius: 9,
              cursor: 'pointer',
            }}
          >
            Bekor
          </button>
          <button
            onClick={onConfirm}
            style={{
              font: '700 12px Manrope',
              color: '#fff',
              background: '#DC2626',
              border: 0,
              padding: '10px 16px',
              borderRadius: 9,
              cursor: 'pointer',
            }}
          >
            O'chirish
          </button>
        </div>
      </div>
    </div>
  );
}
