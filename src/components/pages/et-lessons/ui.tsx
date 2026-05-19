import React from 'react';

// ─── Shared styles ──────────────────────────────────────────────────────────

export const kbdStyle = {
  font: '600 10px JetBrains Mono',
  color: '#64748B',
  background: '#F1F5F9',
  border: '1px solid #E2E8F0',
  padding: '2px 5px',
  borderRadius: 5,
  lineHeight: 1,
};

export const stepBtn = {
  width: 32,
  height: 32,
  border: '1px solid #E2E8F0',
  background: '#fff',
  borderRadius: 8,
  font: '700 16px Manrope',
  color: '#475569',
  cursor: 'pointer' as const,
};

export const cellWrap2 = {
  position: 'relative' as const,
  padding: '4px 4px',
  borderRight: '1px solid #F1F5F9',
  display: 'flex' as const,
  alignItems: 'center' as const,
};
export const cellBtn2 = {
  display: 'block' as const,
  width: '100%',
  textAlign: 'left' as const,
  background: 'transparent',
  border: '1px solid transparent',
  borderRadius: 8,
  padding: '6px 8px',
  cursor: 'pointer' as const,
  font: 'inherit',
};
export const emptyCellBtn2 = {
  ...cellBtn2,
  color: '#CBD5E1',
  font: '500 12px Manrope',
  border: '1px dashed transparent',
};
export const miniBtn2 = {
  display: 'inline-flex' as const,
  alignItems: 'center' as const,
  gap: 3,
  font: '600 11px Manrope',
  color: '#64748B',
  border: '1px dashed #CBD5E1',
  background: '#fff',
  padding: '3px 6px',
  borderRadius: 6,
  cursor: 'pointer' as const,
  flexShrink: 0,
};
export const iconBtn2 = {
  width: 24,
  height: 24,
  display: 'inline-flex' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  border: 0,
  background: 'transparent',
  color: '#94A3B8',
  cursor: 'pointer' as const,
  borderRadius: 6,
};
export const miniIcon = {
  width: 18,
  height: 14,
  font: '600 12px Manrope',
  lineHeight: 1,
  color: '#94A3B8',
  background: 'transparent',
  border: 0,
  cursor: 'pointer' as const,
  borderRadius: 4,
  padding: 0,
};

export const mxHead = {
  padding: '10px 8px',
  background: '#F8FAFC',
  borderBottom: '1px solid #E2E8F0',
  font: '700 11px Plus Jakarta Sans',
  letterSpacing: '.06em',
  textTransform: 'uppercase' as const,
  color: '#475569',
  position: 'sticky' as const,
  top: 0,
  zIndex: 1,
};
export const mxCell = {
  padding: '8px',
  borderBottom: '1px solid #F1F5F9',
};

export const ghostBtnL = {
  font: '600 13px Manrope',
  color: '#475569',
  background: '#fff',
  border: '1px solid #E2E8F0',
  padding: '8px 14px',
  borderRadius: 8,
  cursor: 'pointer' as const,
};
export const primaryBtnL = {
  font: '700 13px Manrope',
  color: '#fff',
  background: '#4F46E5',
  border: 0,
  padding: '8px 16px',
  borderRadius: 8,
  cursor: 'pointer' as const,
};
export const ghostBtnT = {
  display: 'inline-flex' as const,
  alignItems: 'center' as const,
  gap: 6,
  font: '600 12px Manrope',
  color: '#475569',
  background: '#fff',
  border: '1px solid #E2E8F0',
  padding: '8px 12px',
  borderRadius: 8,
  cursor: 'pointer' as const,
};
export const primaryBtnT = {
  display: 'inline-flex' as const,
  alignItems: 'center' as const,
  gap: 6,
  font: '700 12px Manrope',
  color: '#fff',
  background: '#4F46E5',
  border: 0,
  padding: '8px 14px',
  borderRadius: 8,
  cursor: 'pointer' as const,
};

export const drawerInp = {
  font: '600 14px Manrope',
  color: '#0F172A',
  border: '1px solid #E2E8F0',
  borderRadius: 8,
  padding: '10px 12px',
  outline: 0,
  background: '#fff',
};

export const iCode = {
  font: '600 11px JetBrains Mono',
  background: '#F1F5F9',
  padding: '1px 5px',
  borderRadius: 4,
  color: '#0F172A',
};

// ─── Popover ─────────────────────────────────────────────────────────────────

export function Popover({ children, onClose, width = 320, align = 'left', maxH = 320 }: any) {
  React.useEffect(() => {
    const onDown = (e: any) => { if (e.key === 'Escape') onClose && onClose(); };
    window.addEventListener('keydown', onDown);
    return () => window.removeEventListener('keydown', onDown);
  }, [onClose]);
  return (
    <div style={{
      position: 'absolute' as const, top: 'calc(100% + 6px)', [align]: 0, zIndex: 60,
      width, maxHeight: maxH,
      background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0',
      boxShadow: '0 20px 40px -12px rgba(15,23,42,0.18), 0 4px 12px -2px rgba(15,23,42,0.08)',
      fontFamily: 'Manrope', overflow: 'hidden' as const,
      display: 'flex' as const, flexDirection: 'column' as const,
      animation: 'pop 140ms cubic-bezier(0.22,1,0.36,1)',
    }}>
      {children}
    </div>
  );
}

// ─── PickerList — searchable list ────────────────────────────────────────────

export function PickerList({ items, query, onQuery, onPick, placeholder, renderItem, footer, autoFocus = true }: any) {
  const [hi, setHi] = React.useState(0);
  React.useEffect(() => { setHi(0); }, [query]);
  const filt = items;
  const onKey = (e: any) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi((h: any) => Math.min(h + 1, filt.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h: any) => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); filt[hi] && onPick(filt[hi]); }
  };
  return (
    <>
      <div style={{ padding: 8, borderBottom: '1px solid #F1F5F9', display: 'flex' as const, alignItems: 'center' as const, gap: 8 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
        <input
          autoFocus={autoFocus}
          value={query}
          onChange={(e: any) => onQuery(e.target.value)}
          onKeyDown={onKey}
          placeholder={placeholder}
          style={{ border: 0, outline: 0, flex: 1, font: '500 13px Manrope', color: '#0F172A', background: 'transparent' }}
        />
        <kbd style={kbdStyle}>↵</kbd>
      </div>
      <div style={{ overflowY: 'auto' as const, maxHeight: 240, padding: 4 }}>
        {filt.length === 0 && (
          <div style={{ padding: '14px 12px', color: '#94A3B8', fontSize: 13 }}>
            Hech narsa topilmadi · <span style={{ color: '#4F46E5', fontWeight: 600 }}>+ yangi yaratish</span>
          </div>
        )}
        {filt.map((it: any, i: any) => (
          <div key={i}
            onMouseEnter={() => setHi(i)}
            onMouseDown={(e: any) => { e.preventDefault(); onPick(it); }}
            style={{
              padding: '8px 10px', borderRadius: 8, cursor: 'pointer' as const,
              background: i === hi ? '#F1F5F9' : 'transparent',
              display: 'flex' as const, alignItems: 'center' as const, gap: 10,
            }}>
            {renderItem(it, i === hi)}
          </div>
        ))}
      </div>
      {footer && (
        <div style={{ borderTop: '1px solid #F1F5F9', padding: '8px 10px', background: '#F8FAFC', display: 'flex' as const, alignItems: 'center' as const, gap: 8, fontSize: 11, color: '#64748B' }}>
          {footer}
        </div>
      )}
    </>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────

export function Modal({ title, sub, onClose, children, width = 680, footer }: any) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed' as const, inset: 0, background: 'rgba(15,23,42,0.45)',
      zIndex: 100, display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const,
      padding: 24, animation: 'fade 160ms ease',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width, maxWidth: '100%', maxHeight: '90vh', background: '#fff',
        borderRadius: 16, boxShadow: '0 32px 64px -16px rgba(15,23,42,0.4)',
        display: 'flex' as const, flexDirection: 'column' as const, overflow: 'hidden' as const,
        fontFamily: 'Manrope',
      }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #E2E8F0', display: 'flex' as const, alignItems: 'flex-start' as const, justifyContent: 'space-between' as const, gap: 14 }}>
          <div>
            <div style={{ font: '700 18px Plus Jakarta Sans', color: '#0F172A', letterSpacing: '-0.01em' }}>{title}</div>
            {sub && <div style={{ font: '500 13px Manrope', color: '#64748B', marginTop: 3 }}>{sub}</div>}
          </div>
          <button onClick={onClose} style={{ border: 0, background: 'transparent', cursor: 'pointer' as const, color: '#94A3B8', padding: 4 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div style={{ padding: 22, overflowY: 'auto' as const, flex: 1 }}>{children}</div>
        {footer && (
          <div style={{ padding: '14px 22px', borderTop: '1px solid #E2E8F0', display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'flex-end' as const, gap: 10, background: '#F8FAFC' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────

export function Section({ title, subTitle, children }: any) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex' as const, alignItems: 'baseline' as const, justifyContent: 'space-between' as const, marginBottom: 8 }}>
        <div style={{ font: '700 10px Plus Jakarta Sans', letterSpacing: '.12em', textTransform: 'uppercase' as const, color: '#64748B' }}>{title}</div>
        {subTitle && <div style={{ font: '500 11px Manrope', color: '#94A3B8' }}>{subTitle}</div>}
      </div>
      {children}
    </div>
  );
}

// ─── Stat ────────────────────────────────────────────────────────────────────

export function Stat({ label, val, warn }: any) {
  return (
    <div style={{ display: 'flex' as const, flexDirection: 'column' as const, alignItems: 'flex-end' as const, lineHeight: 1 }}>
      <span style={{ font: '800 17px JetBrains Mono', color: warn ? '#D97706' : '#0F172A' }}>{val}</span>
      <span style={{ font: '500 10px Manrope', color: '#94A3B8', marginTop: 2, letterSpacing: '.02em' }}>{label}</span>
    </div>
  );
}

// ─── Field ───────────────────────────────────────────────────────────────────

export function Field({ label, children }: any) {
  return (
    <label style={{ display: 'flex' as const, flexDirection: 'column' as const, gap: 6 }}>
      <span style={{ font: '700 10px Plus Jakarta Sans', color: '#64748B', letterSpacing: '.08em', textTransform: 'uppercase' as const }}>{label}</span>
      {children}
    </label>
  );
}

// ─── Note + Bullets (for DesignNotes) ────────────────────────────────────────

export function Note({ num, h, children }: any) {
  return (
    <div style={{ display: 'grid' as const, gridTemplateColumns: '28px 1fr', gap: 14, marginBottom: 18 }}>
      <div style={{
        width: 24, height: 24, borderRadius: 7, background: '#EEF2FF', color: '#4338CA',
        font: '800 12px Plus Jakarta Sans',
        display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const, flexShrink: 0,
      }}>{num}</div>
      <div>
        <div style={{ font: '700 14px Plus Jakarta Sans', color: '#0F172A', letterSpacing: '-0.005em', marginBottom: 6 }}>{h}</div>
        <div style={{ font: '500 13px Manrope', color: '#475569', lineHeight: 1.65 }}>{children}</div>
      </div>
    </div>
  );
}

export function Bullets({ items }: any) {
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex' as const, flexDirection: 'column' as const, gap: 6 }}>
      {items.map((it: any, i: any) => (
        <li key={i} style={{ display: 'grid' as const, gridTemplateColumns: '12px 1fr', gap: 8, alignItems: 'flex-start' as const }}>
          <span style={{ width: 5, height: 5, borderRadius: 999, background: '#4F46E5', marginTop: 8 }} />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}
