import type { CSSProperties } from 'react';

export const btnSecondary: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  font: '700 12px Manrope',
  color: '#475569',
  background: '#fff',
  border: '1px solid #E2E8F0',
  padding: '9px 14px',
  borderRadius: 9,
  cursor: 'pointer',
};

export const btnPrimary: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  font: '700 13px Manrope',
  color: '#fff',
  background: '#0F172A',
  border: 0,
  padding: '9px 14px',
  borderRadius: 9,
  cursor: 'pointer',
  boxShadow: '0 4px 12px -4px rgba(15,23,42,0.4)',
};

export const iconRowBtn = (danger: boolean): CSSProperties => ({
  width: 34,
  height: 34,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: danger ? '#DC2626' : '#475569',
  background: '#fff',
  border: `1px solid ${danger ? '#FECACA' : '#E2E8F0'}`,
  borderRadius: 8,
  cursor: 'pointer',
  transition: 'all 120ms ease',
});

export const inp: CSSProperties = {
  font: '600 14px Manrope',
  color: '#0F172A',
  border: '1.5px solid #E2E8F0',
  borderRadius: 9,
  padding: '10px 12px',
  outline: 0,
  background: '#fff',
  width: '100%',
  boxSizing: 'border-box',
};

export const stepBtn: CSSProperties = {
  width: 30,
  border: 0,
  background: '#F8FAFC',
  cursor: 'pointer',
  font: '800 16px JetBrains Mono',
  color: '#475569',
};
