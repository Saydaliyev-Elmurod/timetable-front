import type { CSSProperties } from 'react';

export const btnPrimary: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  background: '#4F46E5',
  color: '#fff',
  border: 0,
  padding: '10px 18px',
  borderRadius: 10,
  font: '700 13px Manrope',
  cursor: 'pointer',
  boxShadow: '0 4px 12px -4px rgba(79, 70, 229, 0.4)',
  transition: 'all 150ms',
};

export const btnSecondary: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  background: '#fff',
  color: '#475569',
  border: '1px solid #E2E8F0',
  padding: '10px 18px',
  borderRadius: 10,
  font: '700 13px Manrope',
  cursor: 'pointer',
  transition: 'all 150ms',
};

export const btnDanger: CSSProperties = {
  ...btnPrimary,
  background: '#EF4444',
  boxShadow: '0 4px 12px -4px rgba(239, 68, 68, 0.4)',
};

export const inp: CSSProperties = {
  width: '100%',
  border: '1.5px solid #E2E8F0',
  borderRadius: 10,
  padding: '10px 14px',
  font: '500 14px Manrope',
  color: '#0F172A',
  outline: 0,
  transition: 'border-color 150ms',
};

export const inpSearch: CSSProperties = {
  width: '100%',
  border: '1.5px solid #E2E8F0',
  borderRadius: 9,
  padding: '10px 12px 10px 34px',
  font: '500 13px Manrope',
  color: '#0F172A',
  outline: 0,
};

export const countText: CSSProperties = {
  font: '600 12px Manrope',
  color: '#64748B',
};
