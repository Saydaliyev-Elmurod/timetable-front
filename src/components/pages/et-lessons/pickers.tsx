import React from 'react';
import {
  LC_CLASSES,
  LC_ROOMS,
  LC_SUBJECTS,
  LC_TEACHERS,
  blockExpand,
  getGroupsForClasses,
  roomsForSub,
  subjById,
  subjColors,
  teachersForSub,
} from './catalog';
import { Popover, PickerList, kbdStyle, stepBtn } from './ui';

// ─── Subject picker ──────────────────────────────────────────────────────────
export function SubjectPicker({ value, onPick, onClose }: any) {
  const [q, setQ] = React.useState('');
  const filt = LC_SUBJECTS.filter((s) =>
    !q || s.name.toLowerCase().includes(q.toLowerCase()) || s.short.toLowerCase().includes(q.toLowerCase())
  );
  return (
    <Popover onClose={onClose} width={300}>
      <PickerList
        items={filt} query={q} onQuery={setQ}
        placeholder="Fanni qidiring…"
        onPick={(s: any) => { onPick(s.id); onClose(); }}
        renderItem={(s: any, _hi: any) => {
          const [bg, fg, bar] = subjColors(s);
          const active = value === s.id;
          return (
            <>
              <span style={{ width: 24, height: 24, borderRadius: 6, background: bg, color: fg, display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const, font: '700 11px Plus Jakarta Sans', flexShrink: 0 }}>{s.short[0]}</span>
              <span style={{ flex: 1, font: '600 13px Manrope', color: '#0F172A' }}>{s.name}</span>
              <span style={{ font: '500 11px JetBrains Mono', color: '#94A3B8' }}>{s.short}</span>
              {active && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
            </>
          );
        }}
        footer={<><kbd style={kbdStyle}>↑↓</kbd> tanlash · <kbd style={kbdStyle}>Tab</kbd> keyingisi · <kbd style={kbdStyle}>Esc</kbd> yopish</>}
      />
    </Popover>
  );
}

// ─── Teacher picker ──────────────────────────────────────────────────────────
export function TeacherPicker({ subjectId, value, onPick, onClose, contextLabel }: any) {
  const [q, setQ] = React.useState('');
  const [allSubs, setAllSubs] = React.useState(false);
  const pool = (!allSubs && subjectId) ? teachersForSub(subjectId) : LC_TEACHERS;
  const filt = pool.filter((t) => !q || t.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <Popover onClose={onClose} width={340}>
      <PickerList
        items={filt} query={q} onQuery={setQ}
        placeholder={subjectId ? `${subjById(subjectId)?.name} o'qituvchisini qidiring…` : "O'qituvchini qidiring…"}
        onPick={(t: any) => { onPick(t.id); onClose(); }}
        renderItem={(t: any) => {
          const overload = t.load / t.cap;
          const tone = overload >= 0.95 ? '#EF4444' : overload >= 0.8 ? '#F59E0B' : '#14B8A6';
          return (
            <>
              <span style={{ width: 28, height: 28, borderRadius: 999, background: t.tone, color: '#fff', display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const, font: '700 11px Plus Jakarta Sans', flexShrink: 0, letterSpacing: '-0.02em' }}>{t.avatar}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: '600 13px Manrope', color: '#0F172A' }}>{t.name}</div>
                <div style={{ font: '500 11px Manrope', color: '#94A3B8', marginTop: 1 }}>
                  {t.subs.map((s: any) => subjById(s)?.short).join(' · ')}
                </div>
              </span>
              <span style={{ textAlign: 'right' as const, flexShrink: 0 }}>
                <div style={{ font: '600 10px JetBrains Mono', color: tone, letterSpacing: '.02em' }}>{t.load}/{t.cap}</div>
                <div style={{ width: 36, height: 3, borderRadius: 2, background: '#F1F5F9', marginTop: 3, overflow: 'hidden' as const }}>
                  <div style={{ width: Math.min(100, overload * 100) + '%', height: '100%', background: tone }} />
                </div>
              </span>
              {value === t.id && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
            </>
          );
        }}
        footer={
          <>
            {subjectId && (
              <label style={{ display: 'flex' as const, alignItems: 'center' as const, gap: 6, cursor: 'pointer' as const }}>
                <input type="checkbox" checked={allSubs} onChange={(e: any) => setAllSubs(e.target.checked)} style={{ accentColor: '#4F46E5' }} />
                <span>Boshqa fan o'qituvchilarini ham ko'rsatish</span>
              </label>
            )}
            <span style={{ marginLeft: 'auto' }}>{contextLabel}</span>
          </>
        }
      />
    </Popover>
  );
}

// ─── Room picker ─────────────────────────────────────────────────────────────
export function RoomPicker({ subjectId, value, onPick, onClose }: any) {
  const [q, setQ] = React.useState('');
  const [onlyFit, setOnlyFit] = React.useState(true);
  const pool = (onlyFit && subjectId) ? roomsForSub(subjectId) : LC_ROOMS;
  const filt = pool.filter((r) => !q || r.no.toLowerCase().includes(q.toLowerCase()) || r.label.toLowerCase().includes(q.toLowerCase()));
  return (
    <Popover onClose={onClose} width={300}>
      <PickerList
        items={filt} query={q} onQuery={setQ}
        placeholder="Xona № yoki nom…"
        onPick={(r: any) => { onPick(r.id); onClose(); }}
        renderItem={(r: any) => {
          const ico = r.type === 'gym' ? '🏟' : r.type === 'lab' ? '🧪' : r.type === 'art' ? '✎' : '▢';
          const fit = r.fits === '*' || (Array.isArray(r.fits) && r.fits.includes(subjectId));
          return (
            <>
              <span style={{ width: 32, height: 24, borderRadius: 6, background: '#F1F5F9', color: '#475569', display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const, font: '700 12px JetBrains Mono', flexShrink: 0 }}>{r.no}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: '600 13px Manrope', color: '#0F172A' }}>{r.label}</div>
                <div style={{ font: '500 11px Manrope', color: '#94A3B8' }}>{r.type === 'lab' ? 'Laboratoriya' : r.type === 'gym' ? 'Sport zali' : r.type === 'art' ? 'Maxsus xona' : 'Standart xona'}</div>
              </span>
              {!fit && subjectId && <span style={{ font: '500 10px JetBrains Mono', color: '#F59E0B' }}>nostandart</span>}
              {value === r.id && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
            </>
          );
        }}
        footer={
          subjectId ? (
            <label style={{ display: 'flex' as const, alignItems: 'center' as const, gap: 6, cursor: 'pointer' as const }}>
              <input type="checkbox" checked={onlyFit} onChange={(e: any) => setOnlyFit(e.target.checked)} style={{ accentColor: '#4F46E5' }} />
              <span>Faqat fanga mos xonalar</span>
            </label>
          ) : null
        }
      />
    </Popover>
  );
}

// ─── Class picker (multi-select) ─────────────────────────────────────────────
export function ClassPicker({ values, onChange, onClose }: any) {
  const [q, setQ] = React.useState('');
  const set = new Set(values);
  const groups = LC_CLASSES.reduce((acc: any, c: any) => {
    const name = c.name || '';
    const p = name.includes('-') ? name.split('-')[0] : 'Boshqa';
    if (!q || name.toLowerCase().includes(q.toLowerCase())) {
      (acc[p] = acc[p] || []).push(name);
    }
    return acc;
  }, {});
  const toggle = (c: any) => {
    if (set.has(c)) { set.delete(c); } else { set.add(c); }
    onChange([...set]);
  };
  const toggleParallel = (_p: any, classes: any) => {
    const allOn = classes.every((c: any) => set.has(c));
    classes.forEach((c: any) => allOn ? set.delete(c) : set.add(c));
    onChange([...set]);
  };
  return (
    <Popover onClose={onClose} width={320}>
      <div style={{ padding: 8, borderBottom: '1px solid #F1F5F9', display: 'flex' as const, alignItems: 'center' as const, gap: 8 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Sinfni qidiring…" style={{ border: 0, outline: 0, flex: 1, font: '500 13px Manrope', color: '#0F172A', background: 'transparent' }} />
        <span style={{ font: '600 11px JetBrains Mono', color: '#4F46E5' }}>{values.length} tanlangan</span>
      </div>
      <div style={{ overflowY: 'auto' as const, maxHeight: 280, padding: '8px 10px' }}>
        {Object.entries(groups as Record<string, any[]>).map(([p, classes]) => {
          const allOn = classes.every((c: any) => set.has(c));
          return (
            <div key={p} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, marginBottom: 6 }}>
                <div style={{ font: '700 11px Plus Jakarta Sans', letterSpacing: '.06em', textTransform: 'uppercase' as const, color: '#64748B' }}>{p}-sinflar</div>
                <button onMouseDown={(e: any) => { e.preventDefault(); toggleParallel(p, classes); }} style={{ font: '600 11px Manrope', color: allOn ? '#DC2626' : '#4F46E5', border: 0, background: 'transparent', cursor: 'pointer' as const, padding: 0 }}>
                  {allOn ? "barchasini olib tashlash" : "barchasini tanlash"}
                </button>
              </div>
              <div style={{ display: 'flex' as const, flexWrap: 'wrap' as const, gap: 6 }}>
                {classes.map((c: any) => {
                  const on = set.has(c);
                  return (
                    <button key={c}
                      onMouseDown={(e: any) => { e.preventDefault(); toggle(c); }}
                      style={{
                        font: '700 12px JetBrains Mono',
                        padding: '6px 10px', borderRadius: 8, cursor: 'pointer' as const,
                        border: on ? '1px solid #4F46E5' : '1px solid #E2E8F0',
                        background: on ? '#EEF2FF' : '#fff',
                        color: on ? '#4338CA' : '#475569',
                      }}>{c}</button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ borderTop: '1px solid #F1F5F9', padding: '8px 10px', background: '#F8FAFC', display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, fontSize: 11, color: '#64748B' }}>
        <span>Bir nechtasini tanlasangiz — bir xil reja barcha sinflarga qo'shiladi</span>
        <button onMouseDown={(e: any) => { e.preventDefault(); onClose(); }} style={{ font: '600 12px Manrope', color: '#0F172A', background: '#fff', border: '1px solid #E2E8F0', padding: '5px 10px', borderRadius: 6, cursor: 'pointer' as const }}>Tayyor</button>
      </div>
    </Popover>
  );
}

// ─── Hours / Block editor ────────────────────────────────────────────────────
export function HoursBlockEditor({ hours, block, onChange, onClose }: any) {
  const patterns = (h: any) => {
    const out = ['1'.repeat(h).split('').join('+')];
    if (h >= 2 && h % 2 === 0) out.push('2'.repeat(h / 2).split('').join('+'));
    if (h >= 3) out.push('2' + '+1'.repeat(h - 2));
    if (h >= 4) out.push('2+2' + '+1'.repeat(h - 4));
    if (h >= 5) out.push('2+2+1' + (h > 5 ? '+1'.repeat(h - 5) : ''));
    return [...new Set(out)];
  };
  const opts = patterns(hours);
  const setH = (h: any) => onChange({ hours: h, block: patterns(h)[0] });
  return (
    <Popover onClose={onClose} width={300}>
      <div style={{ padding: 14 }}>
        <div style={{ font: '600 10px Plus Jakarta Sans', letterSpacing: '.1em', textTransform: 'uppercase' as const, color: '#94A3B8', marginBottom: 8 }}>Haftalik soat</div>
        <div style={{ display: 'flex' as const, alignItems: 'center' as const, gap: 8 }}>
          <button onClick={() => setH(Math.max(1, hours - 1))} style={stepBtn}>−</button>
          <div style={{ flex: 1, textAlign: 'center' as const, font: '800 28px Plus Jakarta Sans', color: '#0F172A', letterSpacing: '-0.02em' }}>{hours}</div>
          <button onClick={() => setH(Math.min(10, hours + 1))} style={stepBtn}>+</button>
        </div>
        <div style={{ height: 1, background: '#F1F5F9', margin: '14px 0' }} />
        <div style={{ font: '600 10px Plus Jakarta Sans', letterSpacing: '.1em', textTransform: 'uppercase' as const, color: '#94A3B8', marginBottom: 8 }}>Dars bloklari</div>
        <div style={{ display: 'flex' as const, flexDirection: 'column' as const, gap: 6 }}>
          {opts.map((opt: any) => {
            const on = opt === block;
            const parts = blockExpand(opt);
            return (
              <button key={opt}
                onClick={() => onChange({ hours, block: opt })}
                style={{
                  display: 'flex' as const, alignItems: 'center' as const, gap: 10,
                  border: on ? '1px solid #4F46E5' : '1px solid #E2E8F0',
                  background: on ? '#EEF2FF' : '#fff',
                  borderRadius: 10, padding: '8px 10px', cursor: 'pointer' as const, textAlign: 'left' as const,
                }}>
                <div style={{ display: 'flex' as const, gap: 3, flex: '0 0 auto' }}>
                  {parts.map((p: any, i: any) => (
                    <div key={i} style={{
                      width: p === 2 ? 22 : 10, height: 14, borderRadius: 3,
                      background: on ? '#4F46E5' : '#CBD5E1',
                    }} />
                  ))}
                </div>
                <span style={{ font: '600 12px JetBrains Mono', color: on ? '#4338CA' : '#475569' }}>{opt}</span>
                <span style={{ marginLeft: 'auto', font: '500 11px Manrope', color: '#94A3B8' }}>
                  {parts.filter((p) => p === 2).length ? `${parts.filter((p) => p === 2).length} ta juftlik · ` : ''}
                  {parts.filter((p) => p === 1).length ? `${parts.filter((p) => p === 1).length} ta yakka` : ''}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </Popover>
  );
}

// ─── GroupLabelInput — autocomplete for group names ──────────────────────────
const GROUP_SUGGEST = ["O'g'il bolalar", "Qizlar", "1-guruh", "2-guruh", "3-guruh", "Kuchli", "Boshlovchi"];

export function GroupLabelInput({ value, classes, onCommit, onClose }: any) {
  const [v, setV] = React.useState(value || '');
  const classGroups = getGroupsForClasses(classes || []);
  const suggests = classGroups.length > 0 ? classGroups : GROUP_SUGGEST;
  const [showSug, _setShowSug] = React.useState(true);
  const ref = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
  return (
    <div style={{ position: 'relative' as const }}>
      <input ref={ref} value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => { setTimeout(() => { onCommit(v.trim()); }, 120); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { onCommit(v.trim()); }
          if (e.key === 'Escape') { onClose(); }
        }}
        placeholder="Guruh nomi"
        style={{
          width: '100%', font: '700 11px Manrope', color: '#0F172A',
          background: '#fff', border: '1px solid #4F46E5', borderRadius: 6,
          padding: '4px 6px', outline: 0,
        }} />
      {showSug && (
        <div style={{
          position: 'absolute' as const, top: 'calc(100% + 4px)', left: 0, zIndex: 30,
          background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8,
          boxShadow: '0 10px 24px -8px rgba(15,23,42,0.15)', padding: 5,
          display: 'flex' as const, flexDirection: 'column' as const, gap: 2, minWidth: 140,
        }}>
          {suggests.map((s: any) => (
            <button key={s} onMouseDown={(e) => { e.preventDefault(); onCommit(s); }} style={{
              textAlign: 'left' as const, font: '500 12px Manrope', color: '#475569',
              border: 0, background: 'transparent', padding: '5px 8px', borderRadius: 5, cursor: 'pointer' as const,
            }}>{s}</button>
          ))}
        </div>
      )}
    </div>
  );
}
