import type { CSSProperties } from 'react';

// ─── Tailwind class strings (preferred) ─────────────────────────────────────
//
// Use these in className props. The CSSProperties variants below are the
// legacy versions kept for callers that still pass `style={{...}}`. New code
// should use these classes; the CSSProperties exports will be deleted once
// all callers have migrated.

const baseBtn = 'inline-flex items-center gap-2 px-[18px] py-[10px] rounded-[10px] font-bold text-[13px] font-manrope cursor-pointer transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed';

export const btnPrimaryCls =
  `${baseBtn} bg-indigo-600 text-white border-0 shadow-[0_4px_12px_-4px_rgba(79,70,229,0.4)] hover:bg-indigo-700`;

export const btnSecondaryCls =
  `${baseBtn} bg-white text-slate-600 border border-slate-200 hover:bg-slate-50`;

export const btnDangerCls =
  `${baseBtn} bg-red-500 text-white border-0 shadow-[0_4px_12px_-4px_rgba(239,68,68,0.4)] hover:bg-red-600`;

export const inpCls =
  'w-full px-[14px] py-[10px] rounded-[10px] border-[1.5px] border-slate-200 font-medium text-[14px] text-slate-900 outline-none font-manrope transition-colors focus:border-indigo-500';

export const inpSearchCls =
  'w-full pl-[34px] pr-3 py-[10px] rounded-[9px] border-[1.5px] border-slate-200 font-medium text-[13px] text-slate-900 outline-none font-manrope focus:border-indigo-500';

export const countTextCls = 'text-[12px] font-semibold text-slate-500 font-manrope';

// ─── Legacy inline-style objects ────────────────────────────────────────────
//
// @deprecated — prefer the `*Cls` constants above. Will be removed once all
// callers have migrated.

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
