import React from 'react';
import { toast } from 'sonner';

// ─── Data model types ───────────────────────────────────────────────────────

export interface EtSubject {
  id: string;
  name: string;
  short: string;
  /** Packed "bg,fg,bar" hex values */
  ck: string;
}

export interface EtTeacher {
  id: string;
  name: string;
  avatar: string;
  tone: string;
  subs: string[];
  cap: number;
  load: number;
}

export interface EtRoom {
  id: string;
  no: string;
  type: string;
  label: string;
  fits: string | string[];
}

export interface EtClassGroup {
  id: number;
  name: string;
}

export interface EtClass {
  id?: number;
  name: string;
  groups?: EtClassGroup[];
}

export interface EtGroupAssignment {
  label: string;
  tid: string;
  room: string;
}

export type EtTeacherValue = string | { groups: EtGroupAssignment[] };

export interface EtLessonRow {
  id: string;
  classes: string[];
  subjectId: string;
  teacher: EtTeacherValue;
  room: string;
  hours: number;
  dur: number;
  block?: string;
}

// --- lessons/Catalog.jsx ---
// ─── Catalog & shared helpers for the Lessons-entry page ─────────────────────

const LC = {
  parallels: ['5','6','7','8','9','10','11'],
  letters:   ['A','B','V','G'],
};

let LC_CLASSES: EtClass[] = [];
let LC_SUBJECTS: EtSubject[] = [];
let LC_SUBJECT_BY_ID: Record<string, EtSubject> = {};
let LC_TEACHERS: EtTeacher[] = [];
let LC_TEACHER_BY_ID: Record<string, EtTeacher> = {};
let LC_ROOMS: EtRoom[] = [];
let LC_SEED: EtLessonRow[] = [];

// Helper: parse "bg,fg,bar" packed in ck
const subjColors = (s: EtSubject | undefined): [string, string, string] => {
  if (!s) return ['#F1F5F9','#475569','#94A3B8'];
  const [bg,fg,bar] = s.ck.split(',');
  return [bg, fg, bar];
};

// Helpers exposed for components
const subjById      = (id: string): EtSubject | undefined => LC_SUBJECT_BY_ID[id];
const teacherById   = (id: string): EtTeacher | undefined => LC_TEACHER_BY_ID[id];
const roomById      = (id: string): EtRoom | undefined => LC_ROOMS.find((r: any) => r.id === id);
const teachersForSub= (sid: string): EtTeacher[] => LC_TEACHERS.filter((t: any) => t.subs.includes(sid));
const roomsForSub   = (sid: string): EtRoom[] => LC_ROOMS.filter((r: any) => r.fits === '*' || (Array.isArray(r.fits) && r.fits.includes(sid)));

// Expand a "block" string like "2+2+1+1" to readable preview
const blockExpand = (b: string | undefined | null): number[] => {
  if (!b) return [];
  return String(b).split('+').map((x: any) => parseInt(x,10) || 1);
};

// Compute teacher hours implied by current lesson rows
function computeTeacherLoad(rows: EtLessonRow[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    const hrs = r.hours || 0;
    if (typeof r.teacher === 'string') {
      out[r.teacher] = (out[r.teacher] || 0) + hrs * (r.classes?.length || 1);
    } else if (r.teacher && r.teacher.groups) {
      for (const g of r.teacher.groups) {
        out[g.tid] = (out[g.tid] || 0) + hrs * (r.classes?.length || 1);
      }
    }
  }
  return out;
}



// --- lessons/Pickers.jsx ---
// ─── Pickers ─────────────────────────────────────────────────────────────────
// Floating popover with type-ahead filtering, used for Subject / Teacher /
// Room / Class cells. Mounted ABSOLUTELY inside the cell with a small
// arrow. Keyboard: arrow keys navigate, Enter selects, Esc closes.

function Popover({ children, onClose, width=320, align='left', maxH=320 }: any) {
  React.useEffect(() => {
    const onDown = (e: any) => { if (e.key === 'Escape') onClose && onClose(); };
    window.addEventListener('keydown', onDown);
    return () => window.removeEventListener('keydown', onDown);
  }, [onClose]);
  return (
    <div style={{
      position:'absolute' as const, top:'calc(100% + 6px)', [align]:0, zIndex:60,
      width, maxHeight:maxH,
      background:'#fff', borderRadius:12, border:'1px solid #E2E8F0',
      boxShadow:'0 20px 40px -12px rgba(15,23,42,0.18), 0 4px 12px -2px rgba(15,23,42,0.08)',
      fontFamily:'Manrope', overflow:'hidden' as const, display:'flex' as const, flexDirection:'column' as const,
      animation:'pop 140ms cubic-bezier(0.22,1,0.36,1)',
    }}>
      {children}
    </div>
  );
}

// Generic searchable list with item renderer
function PickerList({ items, query, onQuery, onPick, placeholder, renderItem, footer, autoFocus=true }: any) {
  const [hi, setHi] = React.useState(0);
  React.useEffect(() => { setHi(0); }, [query]);
  const filt = items;
  const onKey = (e: any) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi((h: any) => Math.min(h+1, filt.length-1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h: any) => Math.max(h-1, 0)); }
    else if (e.key === 'Enter')   { e.preventDefault(); filt[hi] && onPick(filt[hi]); }
  };
  return (
    <>
      <div style={{ padding:8, borderBottom:'1px solid #F1F5F9', display:'flex' as const, alignItems:'center' as const, gap:8 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input
          autoFocus={autoFocus}
          value={query}
          onChange={(e: any) => onQuery(e.target.value)}
          onKeyDown={onKey}
          placeholder={placeholder}
          style={{ border:0, outline:0, flex:1, font:'500 13px Manrope', color:'#0F172A', background:'transparent' }}
        />
        <kbd style={kbdStyle}>↵</kbd>
      </div>
      <div style={{ overflowY:'auto' as const, maxHeight:240, padding:4 }}>
        {filt.length === 0 && (
          <div style={{ padding:'14px 12px', color:'#94A3B8', fontSize:13 }}>Hech narsa topilmadi · <span style={{ color:'#4F46E5', fontWeight:600 }}>+ yangi yaratish</span></div>
        )}
        {filt.map((it: any, i: any) => (
          <div key={i}
               onMouseEnter={() => setHi(i)}
               onMouseDown={(e: any) => { e.preventDefault(); onPick(it); }}
               style={{
                 padding:'8px 10px', borderRadius:8, cursor:'pointer' as const,
                 background: i === hi ? '#F1F5F9' : 'transparent',
                 display:'flex' as const, alignItems:'center' as const, gap:10,
               }}>
            {renderItem(it, i === hi)}
          </div>
        ))}
      </div>
      {footer && <div style={{ borderTop:'1px solid #F1F5F9', padding:'8px 10px', background:'#F8FAFC', display:'flex' as const, alignItems:'center' as const, gap:8, fontSize:11, color:'#64748B' }}>{footer}</div>}
    </>
  );
}

const kbdStyle = {
  font:'600 10px JetBrains Mono', color:'#64748B',
  background:'#F1F5F9', border:'1px solid #E2E8F0',
  padding:'2px 5px', borderRadius:5, lineHeight:1,
};

// ─── Subject picker ──────────────────────────────────────────────────────────
function SubjectPicker({ value, onPick, onClose }: any) {
  const [q, setQ] = React.useState('');
  const filt = LC_SUBJECTS.filter((s: any) =>
    !q || s.name.toLowerCase().includes(q.toLowerCase()) || s.short.toLowerCase().includes(q.toLowerCase())
  );
  return (
    <Popover onClose={onClose} width={300}>
      <PickerList
        items={filt} query={q} onQuery={setQ}
        placeholder="Fanni qidiring…"
        onPick={(s: any) => { onPick(s.id); onClose(); }}
        renderItem={(s: any, hi: any) => {
          const [bg,fg,bar] = subjColors(s);
          const active = value === s.id;
          return (
            <>
              <span style={{ width:24, height:24, borderRadius:6, background:bg, color:fg, display:'flex' as const, alignItems:'center' as const, justifyContent:'center' as const, font:'700 11px Plus Jakarta Sans', flexShrink:0 }}>{s.short[0]}</span>
              <span style={{ flex:1, font:'600 13px Manrope', color:'#0F172A' }}>{s.name}</span>
              <span style={{ font:'500 11px JetBrains Mono', color:'#94A3B8' }}>{s.short}</span>
              {active && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
            </>
          );
        }}
        footer={<><kbd style={kbdStyle}>↑↓</kbd> tanlash · <kbd style={kbdStyle}>Tab</kbd> keyingisi · <kbd style={kbdStyle}>Esc</kbd> yopish</>}
      />
    </Popover>
  );
}

// ─── Teacher picker ──────────────────────────────────────────────────────────
// Auto-filters to teachers of the given subject. If subjectId provided, shows
// only matching teachers + an "All" toggle.
function TeacherPicker({ subjectId, value, onPick, onClose, contextLabel }: any) {
  const [q, setQ] = React.useState('');
  const [allSubs, setAllSubs] = React.useState(false);
  const pool = (!allSubs && subjectId) ? teachersForSub(subjectId) : LC_TEACHERS;
  const filt = pool.filter((t: any) => !q || t.name.toLowerCase().includes(q.toLowerCase()));
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
              <span style={{ width:28, height:28, borderRadius:999, background:t.tone, color:'#fff', display:'flex' as const, alignItems:'center' as const, justifyContent:'center' as const, font:'700 11px Plus Jakarta Sans', flexShrink:0, letterSpacing:'-0.02em' }}>{t.avatar}</span>
              <span style={{ flex:1, minWidth:0 }}>
                <div style={{ font:'600 13px Manrope', color:'#0F172A' }}>{t.name}</div>
                <div style={{ font:'500 11px Manrope', color:'#94A3B8', marginTop:1 }}>
                  {t.subs.map((s: any) => subjById(s)?.short).join(' · ')}
                </div>
              </span>
              <span style={{ textAlign:'right' as const, flexShrink:0 }}>
                <div style={{ font:'600 10px JetBrains Mono', color:tone, letterSpacing:'.02em' }}>{t.load}/{t.cap}</div>
                <div style={{ width:36, height:3, borderRadius:2, background:'#F1F5F9', marginTop:3, overflow:'hidden' as const }}>
                  <div style={{ width: Math.min(100, overload*100)+'%', height:'100%', background:tone }}/>
                </div>
              </span>
              {value === t.id && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
            </>
          );
        }}
        footer={
          <>
            {subjectId && (
              <label style={{ display:'flex' as const, alignItems:'center' as const, gap:6, cursor:'pointer' as const }}>
                <input type="checkbox" checked={allSubs} onChange={(e: any) => setAllSubs(e.target.checked)} style={{ accentColor:'#4F46E5' }}/>
                <span>Boshqa fan o'qituvchilarini ham ko'rsatish</span>
              </label>
            )}
            <span style={{ marginLeft:'auto' }}>{contextLabel}</span>
          </>
        }
      />
    </Popover>
  );
}

// ─── Room picker ─────────────────────────────────────────────────────────────
function RoomPicker({ subjectId, value, onPick, onClose }: any) {
  const [q, setQ] = React.useState('');
  const [onlyFit, setOnlyFit] = React.useState(true);
  const pool = (onlyFit && subjectId) ? roomsForSub(subjectId) : LC_ROOMS;
  const filt = pool.filter((r: any) => !q || r.no.toLowerCase().includes(q.toLowerCase()) || r.label.toLowerCase().includes(q.toLowerCase()));
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
              <span style={{ width:32, height:24, borderRadius:6, background:'#F1F5F9', color:'#475569', display:'flex' as const, alignItems:'center' as const, justifyContent:'center' as const, font:'700 12px JetBrains Mono', flexShrink:0 }}>{r.no}</span>
              <span style={{ flex:1, minWidth:0 }}>
                <div style={{ font:'600 13px Manrope', color:'#0F172A' }}>{r.label}</div>
                <div style={{ font:'500 11px Manrope', color:'#94A3B8' }}>{r.type === 'lab' ? 'Laboratoriya' : r.type === 'gym' ? 'Sport zali' : r.type === 'art' ? 'Maxsus xona' : 'Standart xona'}</div>
              </span>
              {!fit && subjectId && <span style={{ font:'500 10px JetBrains Mono', color:'#F59E0B' }}>nostandart</span>}
              {value === r.id && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
            </>
          );
        }}
        footer={
          subjectId ? (
            <label style={{ display:'flex' as const, alignItems:'center' as const, gap:6, cursor:'pointer' as const }}>
              <input type="checkbox" checked={onlyFit} onChange={(e: any) => setOnlyFit(e.target.checked)} style={{ accentColor:'#4F46E5' }}/>
              <span>Faqat fanga mos xonalar</span>
            </label>
          ) : null
        }
      />
    </Popover>
  );
}

// ─── Class picker (multi-select) ─────────────────────────────────────────────
function ClassPicker({ values, onChange, onClose }: any) {
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
  const toggleParallel = (p: any, classes: any) => {
    const allOn = classes.every((c: any) => set.has(c));
    classes.forEach((c: any) => allOn ? set.delete(c) : set.add(c));
    onChange([...set]);
  };
  return (
    <Popover onClose={onClose} width={320}>
      <div style={{ padding:8, borderBottom:'1px solid #F1F5F9', display:'flex' as const, alignItems:'center' as const, gap:8 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Sinfni qidiring…" style={{ border:0, outline:0, flex:1, font:'500 13px Manrope', color:'#0F172A', background:'transparent' }}/>
        <span style={{ font:'600 11px JetBrains Mono', color:'#4F46E5' }}>{values.length} tanlangan</span>
      </div>
      <div style={{ overflowY:'auto' as const, maxHeight:280, padding:'8px 10px' }}>
        {Object.entries(groups).map(([p, classes]) => {
          const allOn = classes.every((c: any) => set.has(c));
          return (
            <div key={p} style={{ marginBottom:10 }}>
              <div style={{ display:'flex' as const, alignItems:'center' as const, justifyContent:'space-between' as const, marginBottom:6 }}>
                <div style={{ font:'700 11px Plus Jakarta Sans', letterSpacing:'.06em', textTransform:'uppercase' as const, color:'#64748B' }}>{p}-sinflar</div>
                <button onMouseDown={(e: any) =>{e.preventDefault(); toggleParallel(p, classes);}} style={{ font:'600 11px Manrope', color:allOn?'#DC2626':'#4F46E5', border:0, background:'transparent', cursor:'pointer' as const, padding:0 }}>
                  {allOn ? "barchasini olib tashlash" : "barchasini tanlash"}
                </button>
              </div>
              <div style={{ display:'flex' as const, flexWrap:'wrap' as const, gap:6 }}>
                {classes.map((c: any) => {
                  const on = set.has(c);
                  return (
                    <button key={c}
                      onMouseDown={(e: any) =>{e.preventDefault(); toggle(c);}}
                      style={{
                        font:'700 12px JetBrains Mono',
                        padding:'6px 10px', borderRadius:8, cursor:'pointer' as const,
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
      <div style={{ borderTop:'1px solid #F1F5F9', padding:'8px 10px', background:'#F8FAFC', display:'flex' as const, alignItems:'center' as const, justifyContent:'space-between' as const, fontSize:11, color:'#64748B' }}>
        <span>Bir nechtasini tanlasangiz — bir xil reja barcha sinflarga qo'shiladi</span>
        <button onMouseDown={(e: any) =>{e.preventDefault(); onClose();}} style={{ font:'600 12px Manrope', color:'#0F172A', background:'#fff', border:'1px solid #E2E8F0', padding:'5px 10px', borderRadius:6, cursor:'pointer' as const }}>Tayyor</button>
      </div>
    </Popover>
  );
}

// ─── Hours / Block editor ────────────────────────────────────────────────────
// Compact stepper for weekly hours + a "blok" pattern picker.
// Block patterns are pre-built for the chosen hours but custom is allowed.
function HoursBlockEditor({ hours, block, onChange, onClose }: any) {
  // Pre-set block patterns per hours count
  const patterns = (h: any) => {
    const out = ['1'.repeat(h).split('').join('+')];           // all singles
    if (h >= 2 && h % 2 === 0) out.push('2'.repeat(h/2).split('').join('+')); // all doubles
    if (h >= 3) out.push('2' + '+1'.repeat(h-2));               // 2 + rest singles
    if (h >= 4) out.push('2+2' + '+1'.repeat(h-4));             // 2+2 + rest
    if (h >= 5) out.push('2+2+1' + (h>5 ? '+1'.repeat(h-5) : ''));
    return [...new Set(out)];
  };
  const opts = patterns(hours);
  const setH = (h: any) => onChange({ hours:h, block: patterns(h)[0] });
  return (
    <Popover onClose={onClose} width={300}>
      <div style={{ padding:14 }}>
        <div style={{ font:'600 10px Plus Jakarta Sans', letterSpacing:'.1em', textTransform:'uppercase' as const, color:'#94A3B8', marginBottom:8 }}>Haftalik soat</div>
        <div style={{ display:'flex' as const, alignItems:'center' as const, gap:8 }}>
          <button onClick={()=>setH(Math.max(1, hours-1))} style={stepBtn}>−</button>
          <div style={{ flex:1, textAlign:'center' as const, font:'800 28px Plus Jakarta Sans', color:'#0F172A', letterSpacing:'-0.02em' }}>{hours}</div>
          <button onClick={()=>setH(Math.min(10, hours+1))} style={stepBtn}>+</button>
        </div>
        <div style={{ height:1, background:'#F1F5F9', margin:'14px 0' }}/>
        <div style={{ font:'600 10px Plus Jakarta Sans', letterSpacing:'.1em', textTransform:'uppercase' as const, color:'#94A3B8', marginBottom:8 }}>Dars bloklari</div>
        <div style={{ display:'flex' as const, flexDirection:'column' as const, gap:6 }}>
          {opts.map((opt: any) => {
            const on = opt === block;
            const parts = blockExpand(opt);
            return (
              <button key={opt}
                onClick={() => onChange({ hours, block:opt })}
                style={{
                  display:'flex' as const, alignItems:'center' as const, gap:10,
                  border: on ? '1px solid #4F46E5' : '1px solid #E2E8F0',
                  background: on ? '#EEF2FF' : '#fff',
                  borderRadius:10, padding:'8px 10px', cursor:'pointer' as const, textAlign:'left' as const,
                }}>
                <div style={{ display:'flex' as const, gap:3, flex:'0 0 auto' }}>
                  {parts.map((p: any, i: any) => (
                    <div key={i} style={{
                      width: p===2 ? 22 : 10, height:14, borderRadius:3,
                      background: on ? '#4F46E5' : '#CBD5E1',
                    }}/>
                  ))}
                </div>
                <span style={{ font:'600 12px JetBrains Mono', color:on?'#4338CA':'#475569' }}>{opt}</span>
                <span style={{ marginLeft:'auto', font:'500 11px Manrope', color:'#94A3B8' }}>
                  {parts.filter(p=>p===2).length ? `${parts.filter(p=>p===2).length} ta juftlik · ` : ''}
                  {parts.filter(p=>p===1).length ? `${parts.filter(p=>p===1).length} ta yakka` : ''}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </Popover>
  );
}

const stepBtn = {
  width:32, height:32, border:'1px solid #E2E8F0', background:'#fff',
  borderRadius:8, font:'700 16px Manrope', color:'#475569', cursor:'pointer' as const,
};



// --- lessons/Rows.jsx ---
// ─── LessonRow — compact row used inside grouped accordion ───────────────────
// Columns (when grouped by Class):
//   Fan · O'qituvchi (+ guruh) · Soat (raqam) · Davomiyligi (1/2/3) · Xona · status
// Same row, but in other group-by modes one of those columns is the implicit
// group header (e.g. when grouped by Teacher → hide teacher column).

function LessonRow({ row, groupBy, onChange, onDup, onDelete, openCell, onOpen, onClose }: any) {
  const r = row;
  const isGroup = typeof r.teacher === 'object' && r.teacher && r.teacher.groups;
  const set = (patch: any) => onChange({ ...r, ...patch });
  const splitToGroups = () => {
    const baseTid = typeof r.teacher === 'string' ? r.teacher : '';
    set({ teacher: { groups: [
      { label:'', tid: baseTid, room: r.room },
      { label:'', tid: '',      room: '' },
    ]}});
  };
  const unsplit = () => {
    const g = r.teacher.groups[0];
    set({ teacher: g.tid || '', room: g.room || '' });
  };

  // Validation
  const errs = [];
  if (!r.subjectId) errs.push('Fan');
  if (!isGroup && !r.teacher) errs.push("O'qituvchi");
  if (isGroup && r.teacher.groups.some((g: any) => !g.tid || !g.label)) errs.push("Guruh");
  const ok = errs.length === 0;

  // Columns are conditional by groupBy
  const showClass = groupBy !== 'class';
  const showSubj  = groupBy !== 'subject';
  const showTeach = groupBy !== 'teacher';
  const showRoom  = groupBy !== 'room';

  // Compute grid template based on visible columns
  const cols = [
    showClass && '140px',
    showSubj  && '180px',
    showTeach && '1fr',
    '90px',     // hours
    '170px',    // davomiyligi
    showRoom  && '170px',
    '88px',     // status / actions
  ].filter(Boolean).join(' ');

  return (
    <div data-row-id={r.id} style={{
      display:'grid' as const, gridTemplateColumns: cols,
      alignItems:'stretch' as const, borderTop:'1px solid #F1F5F9',
      background:'#fff', transition:'background 120ms',
    }}>
      {showClass && (
        <div style={cellWrap2}>
          <ClassChips classes={r.classes} onClick={() => onOpen(r.id, 'class')}/>
          {openCell?.row === r.id && openCell.field === 'class' && (
            <ClassPicker values={r.classes} onChange={(v: any) => set({ classes:v })} onClose={onClose}/>
          )}
        </div>
      )}
      {showSubj && (
        <div style={cellWrap2}>
          <SubjectChip subjectId={r.subjectId} onClick={() => onOpen(r.id, 'subject')}/>
          {openCell?.row === r.id && openCell.field === 'subject' && (
            <SubjectPicker value={r.subjectId} onPick={(sid: any) => set({ subjectId:sid })} onClose={onClose}/>
          )}
        </div>
      )}
      {showTeach && (
        <div style={{ ...cellWrap2, padding:'4px 4px' }}>
          {!isGroup ? (
            <div style={{ display:'flex' as const, alignItems:'center' as const, gap:6, width:'100%' }}>
              <div style={{ flex:1, minWidth:0, position:'relative' as const }}>
                <TeacherChip tid={r.teacher} onClick={() => onOpen(r.id, 'teacher')}/>
                {openCell?.row === r.id && openCell.field === 'teacher' && (
                  <TeacherPicker subjectId={r.subjectId} value={r.teacher}
                    onPick={(tid: any) =>set({ teacher:tid })} onClose={onClose}
                    contextLabel={r.classes[0] ? `${r.classes[0]} uchun` : ''}/>
                )}
              </div>
              <button onClick={splitToGroups} title="Guruhga bo'lish" style={miniBtn2}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v18M4 9h16M4 15h16"/></svg>
                guruh
              </button>
            </div>
          ) : (
            <div style={{ display:'flex' as const, flexDirection:'column' as const, gap:4, width:'100%' }}>
              {r.teacher.groups.map((g: any, gi: any) => (
                <GroupRow key={gi} g={g} gi={gi} total={r.teacher.groups.length}
                  subjectId={r.subjectId} classes={r.classes}
                  openCell={openCell} onOpen={(f: any) =>onOpen(r.id, f)} onClose={onClose}
                  onChange={(patch: any) =>{
                    const groups = r.teacher.groups.map((gg: any, i: any) => i === gi ? { ...gg, ...patch } : gg);
                    set({ teacher: { groups } });
                  }}
                  onRemove={()=>{
                    if (r.teacher.groups.length <= 2) { unsplit(); return; }
                    const groups = r.teacher.groups.filter((_: any, i: any) => i !== gi);
                    set({ teacher:{ groups } });
                  }}
                  onAddBelow={()=>{
                    const groups = [...r.teacher.groups, { label:'', tid:'', room:'' }];
                    set({ teacher:{ groups } });
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Hours — plain number */}
      <div style={cellWrap2}>
        <input type="number" min="1" max="20" value={r.hours}
          onChange={(e: any) => set({ hours: Math.max(1, parseInt(e.target.value,10) || 1) })}
          style={{
            width:'100%', font:'700 16px JetBrains Mono', color:'#0F172A',
            border:'1px solid transparent', borderRadius:8,
            padding:'7px 10px', background:'transparent', textAlign:'center' as const,
            outline:0,
          }}
        />
      </div>

      {/* Davomiyligi — chips 1/2/3 */}
      <div style={cellWrap2}>
        <DurationChips dur={r.dur || 1} onChange={(d: any) => set({ dur: d })}/>
      </div>

      {/* Room */}
      {showRoom && (
        <div style={cellWrap2}>
          {!isGroup ? (
            <>
              <RoomChip rid={r.room} onClick={() => onOpen(r.id, 'room')}/>
              {openCell?.row === r.id && openCell.field === 'room' && (
                <RoomPicker subjectId={r.subjectId} value={r.room}
                  onPick={(rid: any) => set({ room:rid })} onClose={onClose}/>
              )}
            </>
          ) : (
            <div style={{ display:'flex' as const, flexDirection:'column' as const, gap:4, width:'100%', padding:'2px 0' }}>
              {r.teacher.groups.map((g: any, gi: any) => (
                <div key={gi} style={{ position:'relative' as const }}>
                  <RoomChip rid={g.room} onClick={() => onOpen(r.id, 'groom-'+gi)}/>
                  {openCell?.row === r.id && openCell.field === 'groom-'+gi && (
                    <RoomPicker subjectId={r.subjectId} value={g.room}
                      onPick={(rid: any) =>{
                        const groups = r.teacher.groups.map((gg: any, i: any) => i === gi ? { ...gg, room: rid } : gg);
                        set({ teacher:{ groups } });
                      }} onClose={onClose}/>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Status / actions */}
      <div style={{ display:'flex' as const, alignItems:'center' as const, justifyContent:'flex-end' as const, gap:2, padding:'0 8px', borderLeft:'1px solid #F1F5F9' }}>
        {ok ? (
          <span title="Tayyor" style={{ width:18, height:18, borderRadius:999, background:'#F0FDFA', color:'#0D9488', display:'flex' as const, alignItems:'center' as const, justifyContent:'center' as const }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
        ) : (
          <span title={errs.join(' · ')+' yetishmaydi'} style={{ width:18, height:18, borderRadius:999, background:'#FEF3C7', color:'#D97706', display:'flex' as const, alignItems:'center' as const, justifyContent:'center' as const, font:'800 11px Plus Jakarta Sans' }}>!</span>
        )}
        <button onClick={onDup} title="Dublikat" style={iconBtn2}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>
        <button onClick={onDelete} title="O'chirish" style={iconBtn2}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        </button>
      </div>
    </div>
  );
}

// ─── GroupRow — one sub-group within a split lesson ──────────────────────────
const GROUP_SUGGEST = ["O'g'il bolalar", "Qizlar", "1-guruh", "2-guruh", "3-guruh", "Kuchli", "Boshlovchi"];

function GroupRow({ g, gi, total, subjectId, classes, onChange, onRemove, onAddBelow, openCell, onOpen, onClose }: any) {
  const tone = ['#4F46E5','#0D9488','#D97706','#7C3AED','#0EA5E9'][gi % 5];
  const tint = ['rgba(79,70,229,0.06)','rgba(20,184,166,0.07)','rgba(217,119,6,0.07)','rgba(124,58,237,0.07)','rgba(14,165,233,0.07)'][gi % 5];
  const [editing, setEditing] = React.useState(!g.label);

  return (
    <div style={{
      display:'grid' as const, gridTemplateColumns:'14px 110px 1fr 22px',
      alignItems:'center' as const, gap:6, padding:'4px 6px', borderRadius:8,
      background:tint,
    }}>
      <span style={{ width:3, height:18, borderRadius:2, background:tone }}/>
      {editing ? (
        <GroupLabelInput value={g.label} onCommit={(v: any) => { onChange({ label:v }); setEditing(false); }} onClose={() => setEditing(false)}/>
      ) : (
        <button onClick={()=>setEditing(true)} style={{
          font:'700 10px Plus Jakarta Sans', letterSpacing:'.04em', textTransform:'uppercase' as const,
          color:tone, background:'transparent', border:'1px dashed transparent', borderRadius:5,
          padding:'4px 6px', textAlign:'left' as const, cursor:'pointer' as const,
          overflow:'hidden' as const, textOverflow:'ellipsis' as const, whiteSpace:'nowrap' as const,
        }} title="Guruh nomini tahrirlash">
          {g.label || '+ nom kiriting'}
        </button>
      )}
      <div style={{ position:'relative' as const }}>
        <TeacherChip tid={g.tid} dense onClick={() => onOpen('gteacher-'+gi)}/>
        {openCell?.field === 'gteacher-'+gi && (
          <TeacherPicker subjectId={subjectId} value={g.tid}
            onPick={(tid: any) =>onChange({ tid })} onClose={onClose}/>
        )}
      </div>
      <div style={{ display:'flex' as const, flexDirection:'column' as const, gap:2 }}>
        {gi === total - 1 && (
          <button onClick={onAddBelow} title="Yana guruh qo'shish" style={miniIcon}>+</button>
        )}
        <button onClick={onRemove} title="Guruhni olib tashlash" style={miniIcon}>×</button>
      </div>
    </div>
  );
}

function GroupLabelInput({ value, classes, onCommit, onClose }: any) {
  const [v, setV] = React.useState(value || '');
  const classGroups = getGroupsForClasses(classes || []);
  const suggests = classGroups.length > 0 ? classGroups : GROUP_SUGGEST;
  const [showSug, setShowSug] = React.useState(true);
  const ref = React.useRef(null);
  React.useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
  return (
    <div style={{ position:'relative' as const }}>
      <input ref={ref} value={v}
        onChange={e=>setV(e.target.value)}
        onBlur={()=>{ setTimeout(()=>{ onCommit(v.trim()); }, 120); }}
        onKeyDown={e=>{
          if (e.key === 'Enter') { onCommit(v.trim()); }
          if (e.key === 'Escape') { onClose(); }
        }}
        placeholder="Guruh nomi"
        style={{
          width:'100%', font:'700 11px Manrope', color:'#0F172A',
          background:'#fff', border:'1px solid #4F46E5', borderRadius:6,
          padding:'4px 6px', outline:0,
        }}/>
      {showSug && (
        <div style={{
          position:'absolute' as const, top:'calc(100% + 4px)', left:0, zIndex:30,
          background:'#fff', border:'1px solid #E2E8F0', borderRadius:8,
          boxShadow:'0 10px 24px -8px rgba(15,23,42,0.15)', padding:5,
          display:'flex' as const, flexDirection:'column' as const, gap:2, minWidth:140,
        }}>
          {suggests.map((s: any) => (
            <button key={s} onMouseDown={e=>{e.preventDefault(); onCommit(s);}} style={{
              textAlign:'left' as const, font:'500 12px Manrope', color:'#475569',
              border:0, background:'transparent', padding:'5px 8px', borderRadius:5, cursor:'pointer' as const,
            }}>{s}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── DurationChips — single / double / triple ────────────────────────────────
function DurationChips({ dur, onChange }: any) {
  const opts = [
    { v:1, label:'Yakka',  desc:'1 soat', dots:1 },
    { v:2, label:'Juftlik', desc:'2 soat ketma-ket', dots:2 },
    { v:3, label:'Uchlik', desc:'3 soat ketma-ket', dots:3 },
  ];
  return (
    <div style={{ display:'flex' as const, gap:3, padding:'2px 0' }}>
      {opts.map((o: any) => {
        const on = dur === o.v;
        return (
          <button key={o.v} onClick={()=>onChange(o.v)} title={o.desc}
            style={{
              flex:1, display:'flex' as const, flexDirection:'column' as const, alignItems:'center' as const, gap:3,
              padding:'5px 4px', borderRadius:7, cursor:'pointer' as const,
              border: on ? '1px solid #4F46E5' : '1px solid #E2E8F0',
              background: on ? '#EEF2FF' : '#fff',
            }}>
            <div style={{ display:'flex' as const, gap:2 }}>
              {Array.from({length:o.dots}).map((_: any, i: any) =>(
                <div key={i} style={{ width:5, height:5, borderRadius:1.5, background: on?'#4F46E5':'#CBD5E1' }}/>
              ))}
            </div>
            <span style={{ font:'700 10px Plus Jakarta Sans', color:on?'#4338CA':'#64748B', letterSpacing:'.02em' }}>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Class chip / subject chip / teacher chip / room chip (same as before) ──
function ClassChips({ classes, onClick }: any) {
  if (!classes.length) return <button onClick={onClick} style={emptyCellBtn2}>+ Sinf</button>;
  return (
    <button onClick={onClick} style={cellBtn2}>
      <div style={{ display:'flex' as const, flexWrap:'wrap' as const, gap:4 }}>
        {classes.slice(0,3).map((c: any) => (
          <span key={c} style={{ font:'700 11px JetBrains Mono', padding:'3px 7px', borderRadius:6, background:'#EEF2FF', color:'#4338CA' }}>{c}</span>
        ))}
        {classes.length > 3 && <span style={{ font:'700 11px JetBrains Mono', padding:'3px 7px', borderRadius:6, background:'#F1F5F9', color:'#475569' }}>+{classes.length-3}</span>}
      </div>
    </button>
  );
}
function SubjectChip({ subjectId, onClick }: any) {
  if (!subjectId) return <button onClick={onClick} style={emptyCellBtn2}>+ Fan</button>;
  const s = subjById(subjectId); const [bg,fg,bar] = subjColors(s);
  return (
    <button onClick={onClick} style={cellBtn2}>
      <span style={{ display:'inline-flex' as const, alignItems:'center' as const, gap:8, padding:'5px 10px 5px 6px', borderRadius:8, background:bg, color:fg, font:'700 13px Manrope' }}>
        <span style={{ width:18, height:18, borderRadius:5, background:bar, color:'#fff', font:'800 10px Plus Jakarta Sans', display:'inline-flex' as const, alignItems:'center' as const, justifyContent:'center' as const }}>{s.short[0]}</span>
        {s.name}
      </span>
    </button>
  );
}
function TeacherChip({ tid, onClick, dense=false }: any) {
  if (!tid) return <button onClick={onClick} style={emptyCellBtn2}>+ O'qituvchi</button>;
  const t = teacherById(tid); const over = t.load >= t.cap;
  return (
    <button onClick={onClick} style={cellBtn2}>
      <span style={{ display:'inline-flex' as const, alignItems:'center' as const, gap:8, minWidth:0 }}>
        <span style={{ width:24, height:24, borderRadius:999, background:t.tone, color:'#fff', font:'800 10px Plus Jakarta Sans', display:'inline-flex' as const, alignItems:'center' as const, justifyContent:'center' as const, flexShrink:0, letterSpacing:'-0.02em' }}>{t.avatar}</span>
        <span style={{ minWidth:0, overflow:'hidden' as const }}>
          <div style={{ font:'600 13px Manrope', color:'#0F172A', lineHeight:1.2, overflow:'hidden' as const, textOverflow:'ellipsis' as const, whiteSpace:'nowrap' as const }}>{t.name}</div>
          {!dense && <div style={{ font:'500 10px JetBrains Mono', color:over?'#DC2626':'#94A3B8', marginTop:1 }}>{t.load}/{t.cap}h</div>}
        </span>
      </span>
    </button>
  );
}
function RoomChip({ rid, onClick }: any) {
  if (!rid) return <button onClick={onClick} style={emptyCellBtn2}>—</button>;
  const r = roomById(rid);
  return (
    <button onClick={onClick} style={cellBtn2}>
      <span style={{ display:'inline-flex' as const, alignItems:'center' as const, gap:6 }}>
        <span style={{ font:'700 12px JetBrains Mono', padding:'3px 8px', borderRadius:6, background:'#F1F5F9', color:'#334155' }}>{r.no}</span>
        <span style={{ font:'500 12px Manrope', color:'#64748B', overflow:'hidden' as const, textOverflow:'ellipsis' as const, whiteSpace:'nowrap' as const }}>{r.label}</span>
      </span>
    </button>
  );
}

const cellWrap2 = { position:'relative' as const, padding:'4px 4px', borderRight:'1px solid #F1F5F9', display:'flex' as const, alignItems:'center' as const };
const cellBtn2  = { display:'block' as const, width:'100%', textAlign:'left' as const, background:'transparent', border:'1px solid transparent', borderRadius:8, padding:'6px 8px', cursor:'pointer' as const, font:'inherit' };
const emptyCellBtn2 = { ...cellBtn2, color:'#CBD5E1', font:'500 12px Manrope', border:'1px dashed transparent' };
const miniBtn2 = { display:'inline-flex' as const, alignItems:'center' as const, gap:3, font:'600 11px Manrope', color:'#64748B', border:'1px dashed #CBD5E1', background:'#fff', padding:'3px 6px', borderRadius:6, cursor:'pointer' as const, flexShrink:0 };
const iconBtn2 = { width:24, height:24, display:'inline-flex' as const, alignItems:'center' as const, justifyContent:'center' as const, border:0, background:'transparent', color:'#94A3B8', cursor:'pointer' as const, borderRadius:6 };
const miniIcon = { width:18, height:14, font:'600 12px Manrope', lineHeight:1, color:'#94A3B8', background:'transparent', border:0, cursor:'pointer' as const, borderRadius:4, padding:0 };



// --- lessons/Matrix.jsx ---
// ─── Matrix view ─────────────────────────────────────────────────────────────
// An alternate dense entry view: rows = subjects, columns = classes.
// Cell = hours/week. Click cell to edit hours + assign teacher.
// Bulk row-fill: "Matematika 5 soat for all 10-class".

function MatrixView({ rows, classes, onCellEdit }: any) {
  // Build a lookup: { subjectId: { classCode: { hours, teacher } } }
  const map = {};
  for (const r of rows) {
    if (!r.subjectId) continue;
    map[r.subjectId] = map[r.subjectId] || {};
    for (const c of r.classes) {
      map[r.subjectId][c] = { hours:r.hours, teacher:r.teacher, room:r.room, grouped: !!(r.teacher && r.teacher.groups) };
    }
  }
  return (
    <div style={{
      background:'#fff', border:'1px solid #E2E8F0', borderRadius:14, overflow:'hidden' as const,
      boxShadow:'0 4px 12px -2px rgba(15,23,42,0.05)',
    }}>
      <div style={{ overflowX:'auto' as const }}>
        <table style={{ borderCollapse:'separate', borderSpacing:0, minWidth:'100%', font:'500 13px Manrope' }}>
          <thead>
            <tr>
              <th style={{ ...mxHead, left:0, position:'sticky' as const, zIndex:3, minWidth:180, background:'#F8FAFC', textAlign:'left' as const, paddingLeft:14 }}>Fan</th>
              {classes.map((c: any) => (
                <th key={c} style={{ ...mxHead, minWidth:64, textAlign:'center' as const }}>
                  <span style={{ font:'700 11px JetBrains Mono', color:'#475569' }}>{c}</span>
                </th>
              ))}
              <th style={{ ...mxHead, minWidth:64, textAlign:'right' as const, paddingRight:12 }}>
                <span style={{ font:'700 10px Plus Jakarta Sans', letterSpacing:'.1em', color:'#94A3B8', textTransform:'uppercase' as const }}>Jami</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {LC_SUBJECTS.map((s: any) => {
              const row = map[s.id] || {};
              const [bg,fg,bar] = subjColors(s);
              const total = classes.reduce((sum: any, c: any) => sum + (row[c]?.hours || 0), 0);
              return (
                <tr key={s.id}>
                  <td style={{ ...mxCell, position:'sticky' as const, left:0, background:'#fff', zIndex:2, paddingLeft:14, borderRight:'1px solid #E2E8F0' }}>
                    <div style={{ display:'flex' as const, alignItems:'center' as const, gap:8 }}>
                      <span style={{ width:22, height:22, borderRadius:6, background:bg, color:fg, font:'800 11px Plus Jakarta Sans', display:'inline-flex' as const, alignItems:'center' as const, justifyContent:'center' as const }}>{s.short[0]}</span>
                      <span style={{ font:'600 13px Manrope', color:'#0F172A' }}>{s.name}</span>
                    </div>
                  </td>
                  {classes.map((c: any) => {
                    const cell = row[c];
                    const h = cell?.hours;
                    return (
                      <td key={c} style={{ ...mxCell, textAlign:'center' as const, padding:0 }}>
                        <button onClick={() => onCellEdit && onCellEdit(s.id, c)}
                          style={{
                            width:'100%', height:'100%', minHeight:42,
                            border:0, cursor:'pointer' as const,
                            background: h ? bg : 'transparent',
                            color: h ? fg : '#CBD5E1',
                            font:'800 14px Plus Jakarta Sans', letterSpacing:'-0.01em',
                            position:'relative' as const,
                          }}>
                          {h ? (
                            <>
                              {h}
                              {cell?.grouped && (
                                <span title="Guruhli" style={{ position:'absolute' as const, top:3, right:5, font:'700 8px JetBrains Mono', color:fg, opacity:.7 }}>÷2</span>
                              )}
                            </>
                          ) : '·'}
                        </button>
                      </td>
                    );
                  })}
                  <td style={{ ...mxCell, textAlign:'right' as const, paddingRight:12 }}>
                    <span style={{ font:'700 13px JetBrains Mono', color: total > 0 ? '#0F172A' : '#CBD5E1' }}>{total || '—'}</span>
                  </td>
                </tr>
              );
            })}
            {/* Column totals */}
            <tr>
              <td style={{ ...mxCell, position:'sticky' as const, left:0, background:'#F8FAFC', zIndex:2, paddingLeft:14, borderRight:'1px solid #E2E8F0', borderTop:'2px solid #E2E8F0' }}>
                <span style={{ font:'700 11px Plus Jakarta Sans', letterSpacing:'.08em', textTransform:'uppercase' as const, color:'#64748B' }}>Sinf yuki</span>
              </td>
              {classes.map((c: any) => {
                const sum = LC_SUBJECTS.reduce((s: any, sub: any) => s + (map[sub.id]?.[c]?.hours || 0), 0);
                const tone = sum > 36 ? '#DC2626' : sum > 30 ? '#D97706' : '#0D9488';
                return (
                  <td key={c} style={{ ...mxCell, textAlign:'center' as const, borderTop:'2px solid #E2E8F0', background:'#F8FAFC' }}>
                    <span style={{ font:'800 12px JetBrains Mono', color: sum ? tone : '#CBD5E1' }}>{sum || '·'}</span>
                  </td>
                );
              })}
              <td style={{ ...mxCell, borderTop:'2px solid #E2E8F0', background:'#F8FAFC' }}/>
            </tr>
          </tbody>
        </table>
      </div>
      <div style={{ padding:'10px 14px', background:'#F8FAFC', borderTop:'1px solid #E2E8F0', display:'flex' as const, alignItems:'center' as const, gap:12, font:'500 11px Manrope', color:'#64748B' }}>
        <span style={{ width:8, height:8, borderRadius:2, background:'#4F46E5' }}/>
        <span>Bir katakka soatlar — bosing va o'qituvchi tanlang. ÷2 — guruhli darslar. Pastdagi qator sinfning umumiy yuki.</span>
        <span style={{ marginLeft:'auto', font:'500 11px JetBrains Mono', color:'#94A3B8' }}>shift+click — qatordagi barcha sinflarni teng to'ldirish</span>
      </div>
    </div>
  );
}

const mxHead = {
  padding:'10px 8px', background:'#F8FAFC', borderBottom:'1px solid #E2E8F0',
  font:'700 11px Plus Jakarta Sans', letterSpacing:'.06em', textTransform:'uppercase' as const, color:'#475569',
  position:'sticky' as const, top:0, zIndex:1,
};
const mxCell = {
  padding:'8px', borderBottom:'1px solid #F1F5F9',
};



// --- lessons/Modals.jsx ---
// ─── BulkPaste modal + Templates panel ───────────────────────────────────────

// Modal scrim + container
function Modal({ title, sub, onClose, children, width=680, footer }: any) {
  return (
    <div onClick={onClose} style={{
      position:'fixed' as const, inset:0, background:'rgba(15,23,42,0.45)',
      zIndex:100, display:'flex' as const, alignItems:'center' as const, justifyContent:'center' as const,
      padding:24, animation:'fade 160ms ease',
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        width, maxWidth:'100%', maxHeight:'90vh', background:'#fff',
        borderRadius:16, boxShadow:'0 32px 64px -16px rgba(15,23,42,0.4)',
        display:'flex' as const, flexDirection:'column' as const, overflow:'hidden' as const,
        fontFamily:'Manrope',
      }}>
        <div style={{ padding:'18px 22px', borderBottom:'1px solid #E2E8F0', display:'flex' as const, alignItems:'flex-start' as const, justifyContent:'space-between' as const, gap:14 }}>
          <div>
            <div style={{ font:'700 18px Plus Jakarta Sans', color:'#0F172A', letterSpacing:'-0.01em' }}>{title}</div>
            {sub && <div style={{ font:'500 13px Manrope', color:'#64748B', marginTop:3 }}>{sub}</div>}
          </div>
          <button onClick={onClose} style={{ border:0, background:'transparent', cursor:'pointer' as const, color:'#94A3B8', padding:4 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div style={{ padding:22, overflowY:'auto' as const, flex:1 }}>{children}</div>
        {footer && <div style={{ padding:'14px 22px', borderTop:'1px solid #E2E8F0', display:'flex' as const, alignItems:'center' as const, justifyContent:'flex-end' as const, gap:10, background:'#F8FAFC' }}>{footer}</div>}
      </div>
    </div>
  );
}

function BulkPasteModal({ onClose, onApply }: any) {
  const sample = `Sinf\tFan\tO'qituvchi\tXona\tSoat\tBlok
10-A\tMatematika\tN. Karimova\t204\t6\t2+2+1+1
10-A\tOna tili\tM. Yusupov\t208\t3\t1
10-A,10-B,10-V\tFizika\tA. Rahmonov\t305\t3\t2+1`;
  const [text, setText] = React.useState(sample);
  const parsed = React.useMemo(() => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const out = [];
    for (const ln of lines.slice(1)) {
      const c = ln.split('\t');
      if (c.length < 5) continue;
      out.push({
        classes:c[0].split(',').map(x=>x.trim()),
        subject:c[1],
        teacher:c[2],
        room:c[3],
        hours:parseInt(c[4],10) || 0,
        block:c[5] || '1',
      });
    }
    return out;
  }, [text]);

  return (
    <Modal title="Excel'dan joylash" sub="Google Sheets yoki Excel'dan tanlangan kataklarni shu yerga joylang. Ustunlar avtomatik aniqlanadi."
      onClose={onClose} width={760}
      footer={
        <>
          <button onClick={onClose} style={ghostBtnL}>Bekor</button>
          <button onClick={()=>{ onApply(parsed); onClose(); }} style={primaryBtnL}>
            {parsed.length} ta darsni qo'shish
          </button>
        </>
      }>
      <div style={{ display:'grid' as const, gridTemplateColumns:'1fr 1fr', gap:14, height:380 }}>
        <div style={{ display:'flex' as const, flexDirection:'column' as const, gap:8 }}>
          <div style={{ font:'600 10px Plus Jakarta Sans', letterSpacing:'.1em', textTransform:'uppercase' as const, color:'#64748B' }}>1. Joylang (Ctrl+V)</div>
          <textarea value={text} onChange={e=>setText(e.target.value)}
            style={{
              flex:1, resize:'none', font:'500 12px JetBrains Mono',
              background:'#0F172A', color:'#E2E8F0',
              border:'1px solid #1E293B', borderRadius:10, padding:12, outline:0,
              lineHeight:1.6,
            }}/>
          <div style={{ font:'500 11px Manrope', color:'#94A3B8' }}>
            <span style={{ color:'#4F46E5', fontWeight:600 }}>Maslahat:</span> Bir nechta sinfni vergul bilan ajrating — masalan <code style={{ background:'#F1F5F9', padding:'1px 5px', borderRadius:4, color:'#0F172A' }}>10-A,10-B,10-V</code>
          </div>
        </div>
        <div style={{ display:'flex' as const, flexDirection:'column' as const, gap:8 }}>
          <div style={{ font:'600 10px Plus Jakarta Sans', letterSpacing:'.1em', textTransform:'uppercase' as const, color:'#64748B' }}>2. Ko'rib chiqing</div>
          <div style={{ flex:1, border:'1px solid #E2E8F0', borderRadius:10, overflow:'auto' as const, background:'#FAFBFD' }}>
            {parsed.length === 0 ? (
              <div style={{ padding:20, color:'#94A3B8', font:'500 13px Manrope' }}>Yana ma'lumot kerak…</div>
            ) : (
              <table style={{ width:'100%', borderCollapse:'collapse', font:'500 12px Manrope' }}>
                <thead>
                  <tr style={{ background:'#F1F5F9' }}>
                    {['Sinf','Fan','O\'q','Xona','Soat','Blok'].map((h: any) => (
                      <th key={h} style={{ padding:'6px 8px', font:'700 10px Plus Jakarta Sans', letterSpacing:'.08em', textTransform:'uppercase' as const, color:'#64748B', textAlign:'left' as const, position:'sticky' as const, top:0, background:'#F1F5F9' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.map((r: any, i: any) => (
                    <tr key={i} style={{ borderTop:'1px solid #F1F5F9' }}>
                      <td style={pTd}>
                        <div style={{ display:'flex' as const, gap:3, flexWrap:'wrap' as const }}>
                          {r.classes.map((c: any) => <span key={c} style={{ font:'700 10px JetBrains Mono', padding:'2px 5px', borderRadius:4, background:'#EEF2FF', color:'#4338CA' }}>{c}</span>)}
                        </div>
                      </td>
                      <td style={pTd}>{r.subject}</td>
                      <td style={pTd}>{r.teacher}</td>
                      <td style={{ ...pTd, font:'600 11px JetBrains Mono' }}>{r.room}</td>
                      <td style={{ ...pTd, font:'700 12px JetBrains Mono', color:'#0F172A' }}>{r.hours}</td>
                      <td style={{ ...pTd, font:'500 11px JetBrains Mono', color:'#64748B' }}>{r.block}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div style={{ font:'500 11px Manrope', color:'#94A3B8' }}>
            {parsed.length} ta qator aniqlandi · saqlashdan oldin har biri tekshiriladi
          </div>
        </div>
      </div>
    </Modal>
  );
}

const pTd = { padding:'7px 8px' };

// ─── Templates ────────────────────────────────────────────────────────────────
const TEMPLATES = [
  {
    id:'t1', name:"10-sinf umumiy ta'lim", desc:'Standart 5–11 sinf reja, 30 soat',
    subs:[
      ['mat',6,'2+2+1+1'], ['ona',3,'1'], ['adb',3,'1'],
      ['ing',4,'2+2','GROUP'], ['rus',2,'1'],
      ['fiz',3,'2+1'], ['kim',2,'2'], ['bio',2,'1'],
      ['geo',1,'1'], ['tar',2,'1'], ['inf',2,'2','GROUP'],
      ['spo',2,'1'],
    ],
  },
  {
    id:'t2', name:"7-sinf umumiy ta'lim", desc:"O'rta bo'g'in standart reja",
    subs:[
      ['mat',5,'2+2+1'], ['ona',3,'1'], ['adb',2,'1'],
      ['ing',3,'2+1','GROUP'], ['rus',2,'1'],
      ['fiz',2,'2'], ['bio',2,'1'], ['geo',2,'1'],
      ['tar',2,'1'], ['inf',1,'1'], ['spo',2,'1'],
      ['mus',1,'1'], ['chz',1,'1'],
    ],
  },
  {
    id:'t3', name:'Lingvistik yo\'nalish', desc:'Til chuqurlashtirilgan, 11 soat til',
    subs:[
      ['mat',4,'2+2'], ['ona',3,'1'], ['adb',3,'1'],
      ['ing',6,'2+2+1+1','GROUP'], ['rus',3,'2+1','GROUP'],
      ['fiz',2,'2'], ['kim',2,'2'],
      ['tar',2,'1'], ['inf',2,'2','GROUP'], ['spo',2,'1'],
    ],
  },
];

function TemplatesModal({ onClose, onApply }: any) {
  const [pickedTemplate, setPickedTemplate] = React.useState(TEMPLATES[0].id);
  const [pickedClasses, setPickedClasses] = React.useState(['10-A']);
  const T = TEMPLATES.find((t: any) => t.id === pickedTemplate);

  return (
    <Modal title="Shablondan dars qo'shish" sub="Tayyor o'quv reja shablonini tanlang va sinflarga qo'llang."
      onClose={onClose} width={800}
      footer={
        <>
          <span style={{ font:'500 12px Manrope', color:'#64748B', marginRight:'auto' }}>
            {T.subs.length} ta fan × {pickedClasses.length} ta sinf = <b style={{ color:'#0F172A' }}>{T.subs.length * pickedClasses.length}</b> ta dars qo'shiladi
          </span>
          <button onClick={onClose} style={ghostBtnL}>Bekor</button>
          <button onClick={() => { onApply(T, pickedClasses); onClose(); }} style={primaryBtnL}>Qo'llash</button>
        </>
      }>
      <div style={{ display:'grid' as const, gridTemplateColumns:'260px 1fr', gap:18 }}>
        {/* Templates list */}
        <div style={{ display:'flex' as const, flexDirection:'column' as const, gap:8 }}>
          <div style={{ font:'600 10px Plus Jakarta Sans', letterSpacing:'.1em', textTransform:'uppercase' as const, color:'#64748B' }}>Shablonlar</div>
          {TEMPLATES.map((t: any) => {
            const on = t.id === pickedTemplate;
            return (
              <button key={t.id} onClick={()=>setPickedTemplate(t.id)} style={{
                textAlign:'left' as const, cursor:'pointer' as const,
                border: on ? '1px solid #4F46E5' : '1px solid #E2E8F0',
                background: on ? '#EEF2FF' : '#fff',
                borderRadius:10, padding:'10px 12px',
              }}>
                <div style={{ font:'700 13px Manrope', color: on?'#4338CA':'#0F172A' }}>{t.name}</div>
                <div style={{ font:'500 11px Manrope', color:'#94A3B8', marginTop:3 }}>{t.desc}</div>
                <div style={{ font:'500 10px JetBrains Mono', color:'#94A3B8', marginTop:6 }}>
                  {t.subs.reduce((s: any, x: any) =>s+x[1],0)} soat / hafta
                </div>
              </button>
            );
          })}
        </div>

        {/* Preview & class selector */}
        <div>
          <div style={{ font:'600 10px Plus Jakarta Sans', letterSpacing:'.1em', textTransform:'uppercase' as const, color:'#64748B', marginBottom:8 }}>Qo'llash uchun sinflar</div>
          <div style={{ display:'flex' as const, flexWrap:'wrap' as const, gap:5, marginBottom:18 }}>
            {LC_CLASSES.map((c: any) => {
              const on = pickedClasses.includes(c);
              return (
                <button key={c} onClick={()=>{
                  setPickedClasses(on ? pickedClasses.filter(x=>x!==c) : [...pickedClasses, c]);
                }} style={{
                  font:'700 11px JetBrains Mono',
                  padding:'5px 9px', borderRadius:7, cursor:'pointer' as const,
                  border: on?'1px solid #4F46E5':'1px solid #E2E8F0',
                  background: on?'#EEF2FF':'#fff',
                  color: on?'#4338CA':'#475569',
                }}>{c}</button>
              );
            })}
          </div>

          <div style={{ font:'600 10px Plus Jakarta Sans', letterSpacing:'.1em', textTransform:'uppercase' as const, color:'#64748B', marginBottom:8 }}>Reja tarkibi</div>
          <div style={{ border:'1px solid #E2E8F0', borderRadius:10, overflow:'hidden' as const }}>
            {T.subs.map(([sid, hrs, blk, flag], i) => {
              const s = subjById(sid);
              const [bg,fg,bar] = subjColors(s);
              const parts = blockExpand(blk);
              return (
                <div key={i} style={{ display:'grid' as const, gridTemplateColumns:'160px 1fr 60px 60px', alignItems:'center' as const, padding:'7px 12px', borderTop: i?'1px solid #F1F5F9':'none', background: i%2 ? '#FAFBFD' : '#fff' }}>
                  <div style={{ display:'flex' as const, alignItems:'center' as const, gap:8 }}>
                    <span style={{ width:18, height:18, borderRadius:5, background:bg, color:fg, font:'800 10px Plus Jakarta Sans', display:'inline-flex' as const, alignItems:'center' as const, justifyContent:'center' as const }}>{s.short[0]}</span>
                    <span style={{ font:'600 13px Manrope', color:'#0F172A' }}>{s.name}</span>
                  </div>
                  <div style={{ display:'flex' as const, alignItems:'center' as const, gap:6 }}>
                    <div style={{ display:'flex' as const, gap:2 }}>
                      {parts.map((p: any, j: any) =>(<div key={j} style={{ width:p===2?14:6, height:9, borderRadius:2, background:'#CBD5E1' }}/>))}
                    </div>
                    <span style={{ font:'500 11px JetBrains Mono', color:'#94A3B8' }}>{blk}</span>
                    {flag === 'GROUP' && <span style={{ font:'700 9px Plus Jakarta Sans', color:'#0D9488', background:'#F0FDFA', padding:'2px 5px', borderRadius:4, letterSpacing:'.04em', textTransform:'uppercase' as const }}>guruh</span>}
                  </div>
                  <div style={{ font:'700 13px JetBrains Mono', color:'#0F172A', textAlign:'right' as const }}>{hrs}h</div>
                  <div style={{ font:'500 11px Manrope', color:'#94A3B8', textAlign:'right' as const }}>haftada</div>
                </div>
              );
            })}
          </div>
          <div style={{ font:'500 11px Manrope', color:'#94A3B8', marginTop:10 }}>
            <span style={{ color:'#4F46E5', fontWeight:600 }}>Diqqat:</span> shablon yaratgandan keyin har bir darsga o'qituvchi va xona biriktirilishi kerak.
          </div>
        </div>
      </div>
    </Modal>
  );
}

const ghostBtnL = { font:'600 13px Manrope', color:'#475569', background:'#fff', border:'1px solid #E2E8F0', padding:'8px 14px', borderRadius:8, cursor:'pointer' as const };
const primaryBtnL = { font:'700 13px Manrope', color:'#fff', background:'#4F46E5', border:0, padding:'8px 16px', borderRadius:8, cursor:'pointer' as const };



// --- lessons/SidePanel.jsx ---
// ─── SidePanel — live validation + teacher load + class hours summary ────────

function SidePanel({ rows, filterClasses }: any) {
  const teacherLoad = computeTeacherLoad(rows);

  // Per-class hours (weekly sum)
  const classHours = {};
  for (const r of rows) {
    for (const c of r.classes) {
      classHours[c] = (classHours[c] || 0) + (r.hours || 0);
    }
  }

  // Top issues
  const issues = [];
  for (const r of rows) {
    if (!r.classes.length) issues.push({ id:r.id, kind:'err', msg:"Sinfsiz dars qatori" });
    if (!r.subjectId)      issues.push({ id:r.id, kind:'err', msg:"Fan tanlanmagan" });
    if (!r.teacher || (typeof r.teacher === 'object' && r.teacher.groups?.some((g: any) => !g.tid)))
      issues.push({ id:r.id, kind:'err', msg:"O'qituvchi yetishmaydi" });
  }
  Object.entries(teacherLoad).forEach(([tid, load]) => {
    const t = teacherById(tid);
    if (t && load > t.cap) issues.push({ id:'t'+tid, kind:'warn', msg:`${t.name} — yuk ${load}/${t.cap}h (oshib ketgan)` });
  });

  return (
    <aside style={{
      width:300, flexShrink:0, background:'#fff', borderLeft:'1px solid #E2E8F0',
      display:'flex' as const, flexDirection:'column' as const, overflow:'hidden' as const, fontFamily:'Manrope',
    }}>
      <div style={{ padding:'18px 18px 12px' }}>
        <div style={{ font:'700 11px Plus Jakarta Sans', letterSpacing:'.12em', textTransform:'uppercase' as const, color:'#4338CA' }}>Tekshiruv</div>
        <div style={{ font:'800 22px Plus Jakarta Sans', color:'#0F172A', marginTop:4, letterSpacing:'-0.01em' }}>
          {issues.length === 0
            ? <span style={{ color:'#0D9488' }}>Hammasi joyida</span>
            : <>{issues.length} ta <span style={{ color:'#64748B', font:'600 13px Manrope', verticalAlign:'middle', marginLeft:4 }}>tekshirish kerak</span></>}
        </div>
      </div>

      <div style={{ overflowY:'auto' as const, flex:1, padding:'0 14px 18px' }}>
        {/* Issues */}
        {issues.length > 0 && (
          <Section title="Muammolar">
            <div style={{ display:'flex' as const, flexDirection:'column' as const, gap:6 }}>
              {issues.slice(0,5).map((it: any, i: any) => (
                <div key={i} style={{
                  display:'flex' as const, alignItems:'flex-start' as const, gap:8,
                  padding:'8px 10px', borderRadius:8,
                  background: it.kind === 'err' ? '#FEF2F2' : '#FFFBEB',
                  border: '1px solid ' + (it.kind === 'err' ? '#FECACA' : '#FDE68A'),
                }}>
                  <span style={{
                    width:16, height:16, borderRadius:999, flexShrink:0, marginTop:1,
                    background: it.kind === 'err' ? '#EF4444' : '#F59E0B', color:'#fff',
                    display:'flex' as const, alignItems:'center' as const, justifyContent:'center' as const, font:'800 10px Plus Jakarta Sans',
                  }}>!</span>
                  <span style={{ font:'500 12px Manrope', color:'#0F172A' }}>{it.msg}</span>
                </div>
              ))}
              {issues.length > 5 && (
                <div style={{ font:'500 11px Manrope', color:'#94A3B8', textAlign:'center' as const, padding:4 }}>… va {issues.length - 5} tasi yana</div>
              )}
            </div>
          </Section>
        )}

        {/* Class hours */}
        <Section title="Sinflar bo'yicha haftalik soat">
          <div style={{ display:'flex' as const, flexDirection:'column' as const, gap:5 }}>
            {Object.entries(classHours).slice(0,8).map(([c, h]) => {
              const max = 36;
              const tone = h > max ? '#EF4444' : h > 30 ? '#F59E0B' : '#4F46E5';
              return (
                <div key={c} style={{ display:'grid' as const, gridTemplateColumns:'48px 1fr 42px', alignItems:'center' as const, gap:8 }}>
                  <span style={{ font:'700 11px JetBrains Mono', color:'#475569' }}>{c}</span>
                  <span style={{ height:6, background:'#F1F5F9', borderRadius:3, overflow:'hidden' as const }}>
                    <span style={{ display:'block' as const, height:'100%', width: Math.min(100,(h/max)*100)+'%', background:tone, borderRadius:3 }}/>
                  </span>
                  <span style={{ font:'700 12px JetBrains Mono', color:tone, textAlign:'right' as const }}>{h}h</span>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Teacher load */}
        <Section title="O'qituvchi yuki" subTitle="kiritilgan darslar bo'yicha">
          <div style={{ display:'flex' as const, flexDirection:'column' as const, gap:6 }}>
            {Object.entries(teacherLoad).sort((a: any, b: any) =>b[1]-a[1]).slice(0,7).map(([tid, load]) => {
              const t = teacherById(tid);
              if (!t) return null;
              const ratio = load / t.cap;
              const tone = ratio > 1 ? '#EF4444' : ratio >= 0.9 ? '#F59E0B' : '#0D9488';
              return (
                <div key={tid} style={{ display:'grid' as const, gridTemplateColumns:'24px 1fr 50px', alignItems:'center' as const, gap:8 }}>
                  <span style={{ width:22, height:22, borderRadius:999, background:t.tone, color:'#fff', font:'800 10px Plus Jakarta Sans', display:'inline-flex' as const, alignItems:'center' as const, justifyContent:'center' as const, letterSpacing:'-0.02em' }}>{t.avatar}</span>
                  <div style={{ minWidth:0 }}>
                    <div style={{ font:'600 12px Manrope', color:'#0F172A', overflow:'hidden' as const, textOverflow:'ellipsis' as const, whiteSpace:'nowrap' as const }}>{t.name}</div>
                    <span style={{ display:'block' as const, height:4, background:'#F1F5F9', borderRadius:2, overflow:'hidden' as const, marginTop:2 }}>
                      <span style={{ display:'block' as const, height:'100%', width: Math.min(100,ratio*100)+'%', background:tone, borderRadius:2 }}/>
                    </span>
                  </div>
                  <span style={{ font:'700 11px JetBrains Mono', color:tone, textAlign:'right' as const }}>{load}/{t.cap}</span>
                </div>
              );
            })}
          </div>
        </Section>
      </div>
    </aside>
  );
}

function Section({ title, subTitle, children }: any) {
  return (
    <div style={{ marginBottom:18 }}>
      <div style={{ display:'flex' as const, alignItems:'baseline' as const, justifyContent:'space-between' as const, marginBottom:8 }}>
        <div style={{ font:'700 10px Plus Jakarta Sans', letterSpacing:'.12em', textTransform:'uppercase' as const, color:'#64748B' }}>{title}</div>
        {subTitle && <div style={{ font:'500 11px Manrope', color:'#94A3B8' }}>{subTitle}</div>}
      </div>
      {children}
    </div>
  );
}

// ─── Design notes drawer ─────────────────────────────────────────────────────
// Slides in from the right; explains the UX logic behind the page so the
// reviewer (the user) can read your wireframe rationale alongside the design.
function DesignNotes({ open, onClose }: any) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position:'fixed' as const, inset:0, background:'rgba(15,23,42,0.45)',
      zIndex:120, display:'flex' as const, justifyContent:'flex-end' as const, animation:'fade 200ms ease',
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        width:480, maxWidth:'90vw', height:'100vh', background:'#fff',
        boxShadow:'-20px 0 40px -12px rgba(15,23,42,0.18)',
        display:'flex' as const, flexDirection:'column' as const, overflow:'hidden' as const,
        animation:'slideLeft 280ms cubic-bezier(0.22,1,0.36,1)',
        fontFamily:'Manrope',
      }}>
        <div style={{ padding:'20px 24px', borderBottom:'1px solid #E2E8F0', display:'flex' as const, alignItems:'center' as const, justifyContent:'space-between' as const }}>
          <div>
            <div style={{ font:'700 10px Plus Jakarta Sans', letterSpacing:'.16em', textTransform:'uppercase' as const, color:'#4F46E5' }}>UX wireframe logikasi</div>
            <div style={{ font:'800 20px Plus Jakarta Sans', color:'#0F172A', letterSpacing:'-0.01em', marginTop:3 }}>Darslar reja sahifasi</div>
          </div>
          <button onClick={onClose} style={{ border:0, background:'transparent', cursor:'pointer' as const, color:'#94A3B8', padding:6 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div style={{ flex:1, overflowY:'auto' as const, padding:'18px 24px 60px' }}>
          <Note num="1" h="Asosiy maqsad — minimal klik, maksimal qator">
            Direktor yoki o'quv ishlari bo'yicha mudir sahifaga kelganda, uning vazifasi ~150–300 ta dars yozuvini bir o'tirishda kiritish. Excel-gridning afzalligi — har bir maydon ko'rinib turadi va o'qish tartibida tab bosib tezda to'ldiriladi. Biz Excelga taqlid qildik, ammo har bir katakni "smart"laштirdik.
          </Note>
          <Note num="2" h="Sahifa tuzilishi">
            <Bullets items={[
              "Yuqori — breadcrumb + jadval nomi + ko'rinish almashtirgich (Ro'yxat / Matritsa) + 3 ta amal: Shablon, Excel'dan, Saqlash",
              "Chap — mavjud sidebar (E-timetable navigatsiyasi)",
              "Markaz — Smart Grid: har bir qator = bitta dars ta'rifi",
              "O'ng — Tekshiruv paneli: muammolar, sinf yuklari, o'qituvchi yuklari (real vaqtda hisoblanadi)",
            ]}/>
          </Note>
          <Note num="3" h="Dropdown'lar — autocomplete + kontekstli filtr">
            <Bullets items={[
              "Har bir katak bosilganda PASTGA ochiluvchi popover keladi (modal emas — fokus yo'qolmaydi)",
              "Birinchi maydon — qidiruv inputi, avtomatik fokus. Yozish — filtr",
              "↑ ↓ — tanlash, ⏎ — qabul qilish, Tab — keyingi katakka o'tish",
              "Fan tanlangach, O'qituvchi popoveri AVTOMATIK shu fan o'qituvchilarini ko'rsatadi (boshqalarni ko'rish — bitta checkbox)",
              "Fan tanlangach, Xona popoveri ham faqat mos xonalarni chiqaradi (lab/sport zali/lingafon)",
              "Har bir o'qituvchi yonida — joriy yuk bar (18/22h) — to'lib kelganlarni darrov ko'rasiz",
            ]}/>
          </Note>
          <Note num="4" h="Sinflar — bitta katakda bir nechta">
            "10-A, 10-B, 10-V haftada 6 soat matematika" — 3 ta qator emas, BITTA qator. Sinf katagi multi-select chip picker. Sinflar parallellar (5-sinflar, 6-sinflar…) bo'yicha guruhlangan; "barchasini tanlash" tugmasi parallel butun darajaga qo'llaydi.
          </Note>
          <Note num="5" h="Guruhga bo'lish (group split)">
            O'qituvchi katagining yonida <code style={iCode}>+ guruh</code> tugmasi. Bosilganda — qator ichida vertikal kengaytma: A guruh va B guruh, har biriga alohida o'qituvchi va alohida xona. Fan esa umumiy bo'lib qoladi (qoidaga muvofiq). Ikkala guruh soati ham bir xil — chunki bir vaqtda o'tiladi. <code style={iCode}>×</code> — guruhdan chiqarish.
          </Note>
          <Note num="6" h="Soat va blok (ketma-ket dars)">
            Soat katagi bosilganda mini-panel ochiladi: yuqorida ± stepper bilan haftalik soat, pastida — soat soniga MOS keladigan tayyor blok shakllari ("5 = 1+1+1+1+1", "5 = 2+1+1+1", "5 = 2+2+1"…). Foydalanuvchi 1-2 marta bosib variantni tanlaydi. Qator yon tomonida — visual preview: kvadratchalar (qisqalar — 1 soat, kengroq — 2 soatli juftlik). Default — <code style={iCode}>1</code>.
          </Note>
          <Note num="7" h="Ommaviy kiritish (Bulk)">
            <Bullets items={[
              "Excel'dan joylash — modal: chap tomonda paste-textarea (TSV), o'ng tomonda real-time preview jadvali. Saqlashdan oldin har bir qator validatsiyadan o'tadi",
              "Shablondan — tayyor reja shablonlari (masalan: 10-sinf umumiy, 7-sinf umumiy, Lingvistik). Foydalanuvchi shablon + sinflar tanlaydi → N×M qator generatsiya",
              "Dublikat — har bir qatorda ⌘D yoki ikonka: aniq nusxa pastda paydo bo'ladi, faqat sinfni o'zgartirish kerak",
              "Multi-select — qator chap chetida checkbox; tanlanganlarga: kopiya, o'chir, soatlarni o'zgartir",
            ]}/>
          </Note>
          <Note num="8" h="Klaviatura mantiqsi">
            <Bullets items={[
              "Tab/Shift+Tab — kataklar o'qish tartibida",
              "Enter (oxirgi qatorda) — yangi bo'sh qator",
              "Esc — popover yopish",
              "⌘D — qatorni dublikat qilish",
              "⌘V Excel'dan paste — Bulk Paste modal'i avtomatik ochiladi",
              "Sinf qatorlari guruhlangan — har bir guruh boshida qator chetida sinf yorlig'i (10-A, 10-B…)",
            ]}/>
          </Note>
          <Note num="9" h="Validatsiya — passiv, lekin doim ko'rinadigan">
            <Bullets items={[
              "Har bir qator oxirida — ✓ (tayyor) yoki ! (xato), hover qilganda — sabab",
              "O'ng panelda — top 5 muammo ro'yxati. Bosilganda o'sha qatorga aylanadi",
              "Sinf haftalik soat = umumiy soat (cheklov: 30–36, oshib ketsa qizil)",
              "O'qituvchi yuki barlari real vaqtda jiringlamasdan yangilanadi — siz darslarni kiritar ekansiz, panelda yuk to'lib boradi",
            ]}/>
          </Note>
          <Note num="10" h="Matritsa ko'rinish (variant B)">
            Yuqoridagi switch'dan Matritsa'ga o'tasiz: qatorlar — fanlar, ustunlar — sinflar. Har bir katakda — haftalik soat. Bir qatorga to'ldirib chiqib "Matematika hamma 10-sinflarga 6 soatdan" deyish — 4 ta klik. ÷2 belgisi — guruhli darsligini bildiradi. Pastida — har sinfning umumiy yuki.
          </Note>
          <div style={{ height:1, background:'#F1F5F9', margin:'18px 0' }}/>
          <div style={{ font:'500 12px Manrope', color:'#94A3B8', lineHeight:1.6 }}>
            <b style={{ color:'#0F172A' }}>Nima uchun shu yondashuv?</b> Excel tezligi — birinchi o'rinda. Lekin Excelda fan/o'qituvchi/xona nomlarini har safar qo'lda yozish — xato manbai. Smart Grid har bir maydonda kontekst beradi (rang chiplari, avatarlar, yuklar) — foydalanuvchi yozayotgan narsani DOIM ko'rib turadi, va ma'lumotlar baza bilan bog'lab keladi. Bu Notion'ning database view yoki Linear'ning issue gridiga eng yaqin paradigma.
          </div>
        </div>
      </div>
    </div>
  );
}

const iCode = { font:'600 11px JetBrains Mono', background:'#F1F5F9', padding:'1px 5px', borderRadius:4, color:'#0F172A' };

function Note({ num, h, children }: any) {
  return (
    <div style={{ display:'grid' as const, gridTemplateColumns:'28px 1fr', gap:14, marginBottom:18 }}>
      <div style={{
        width:24, height:24, borderRadius:7, background:'#EEF2FF', color:'#4338CA',
        font:'800 12px Plus Jakarta Sans', display:'flex' as const, alignItems:'center' as const, justifyContent:'center' as const, flexShrink:0,
      }}>{num}</div>
      <div>
        <div style={{ font:'700 14px Plus Jakarta Sans', color:'#0F172A', letterSpacing:'-0.005em', marginBottom:6 }}>{h}</div>
        <div style={{ font:'500 13px Manrope', color:'#475569', lineHeight:1.65 }}>{children}</div>
      </div>
    </div>
  );
}

function Bullets({ items }: any) {
  return (
    <ul style={{ margin:0, padding:0, listStyle:'none', display:'flex' as const, flexDirection:'column' as const, gap:6 }}>
      {items.map((it: any, i: any) => (
        <li key={i} style={{ display:'grid' as const, gridTemplateColumns:'12px 1fr', gap:8, alignItems:'flex-start' as const }}>
          <span style={{ width:5, height:5, borderRadius:999, background:'#4F46E5', marginTop:8 }}/>
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}



// --- lessons/GroupedView.jsx ---
// ─── GroupedView — tabs (Class / Teacher / Subject / Room) + accordion ──────

const GROUP_TABS = [
  { id:'class',   label:'Sinflar',       sub:"sinf bo'yicha guruhlash" },
  { id:'teacher', label:"O'qituvchilar", sub:"o'qituvchi bo'yicha"     },
  { id:'subject', label:'Fanlar',        sub:"fan bo'yicha"            },
  { id:'room',    label:'Xonalar',       sub:"xona bo'yicha"           },
];

// Compute groups for the active tab.
// Returns array of { key, title, meta, rows, color, accent }
function computeGroups(rows: any, groupBy: any) {
  const buckets = {};
  const push = (key: any, row: any, hours: any) => {
    if (!buckets[key]) buckets[key] = { key, rows:[], hoursSum:0 };
    buckets[key].rows.push(row);
    buckets[key].hoursSum += hours;
  };
  for (const r of rows) {
    const h = r.hours || 0;
    let pushed = false;
    if (groupBy === 'class') {
      for (const c of r.classes) { push(c, r, h); pushed = true; }
    } else if (groupBy === 'subject') {
      if (r.subjectId) { push(r.subjectId, r, h); pushed = true; }
    } else if (groupBy === 'teacher') {
      if (typeof r.teacher === 'string' && r.teacher) { push(r.teacher, r, h); pushed = true; }
      else if (r.teacher?.groups) {
        for (const g of r.teacher.groups) if (g.tid) { push(g.tid, r, h); pushed = true; }
      }
    } else if (groupBy === 'room') {
      if (typeof r.teacher === 'string') { if (r.room) { push(r.room, r, h); pushed = true; } }
      else if (r.teacher?.groups) {
        for (const g of r.teacher.groups) if (g.room) { push(g.room, r, h); pushed = true; }
      }
    }
    if (!pushed) push('MISC', r, h);
  }
  return Object.values(buckets);
}

function GroupedView({ rows, groupBy, expanded, setExpanded, onAddToGroup, onUpdateRow, onDupRow, onDelRow, onEditClass, openCell, onOpen, onClose, query }: any) {
  const groups = computeGroups(rows, groupBy);

  // Render group header by type
  const renderHead = (g: any) => {
    const k = g.key;
    const teachers = new Set();
    const subjects = new Set();
    const rooms    = new Set();
    const classes  = new Set();
    g.rows.forEach((r: any) => {
      r.classes.forEach((c: any) => classes.add(c));
      r.subjectId && subjects.add(r.subjectId);
      if (typeof r.teacher === 'string') r.teacher && teachers.add(r.teacher);
      else if (r.teacher?.groups) r.teacher.groups.forEach((gg: any) => gg.tid && teachers.add(gg.tid));
      if (typeof r.teacher === 'string') r.room && rooms.add(r.room);
      else if (r.teacher?.groups) r.teacher.groups.forEach((gg: any) => gg.room && rooms.add(gg.room));
    });

    if (k === 'MISC') {
      return {
        title: "Tayinlanmagan darslar",
        kind: 'misc',
        meta: [['darslar', g.rows.length], ['soat', g.hoursSum]]
      };
    }
    if (groupBy === 'class') {
      return {
        title:k,
        kind:'class',
        meta:[
          ['darslar', g.rows.length],
          ['jami soat', g.hoursSum],
          ["o'qituvchi", teachers.size],
          ['fan', subjects.size],
          ['xona', rooms.size],
        ],
      };
    }
    if (groupBy === 'subject') {
      const s = subjById(k);
      return { title:s?.name, kind:'subject', subject:s, meta:[
        ['darslar', g.rows.length],
        ['jami soat', g.hoursSum],
        ["o'qituvchi", teachers.size],
        ['sinf', classes.size],
      ]};
    }
    if (groupBy === 'teacher') {
      const t = teacherById(k);
      if (!t) return { title:'—', kind:'teacher', meta:[] };
      return { title:t.name, kind:'teacher', teacher:t, meta:[
        ['darslar', g.rows.length],
        ['haftalik soat', g.hoursSum],
        ['fan', subjects.size],
        ['sinf', classes.size],
      ]};
    }
    if (groupBy === 'room') {
      const rm = roomById(k);
      return { title:rm?.no, sub:rm?.label, kind:'room', room:rm, meta:[
        ['darslar', g.rows.length],
        ['jami soat', g.hoursSum],
        ['sinf', classes.size],
        ['fan', subjects.size],
      ]};
    }
    return { title:k, meta:[] };
  };

  // Apply query filter
  const filtGroups = query
    ? groups.filter((g: any) => {
        const h = renderHead(g);
        return (h.title || '').toLowerCase().includes(query.toLowerCase());
      })
    : groups;

  // Sort: class natural, subject by SUBJECTS order, teacher by load desc, room by no
  filtGroups.sort((a: any, b: any) => {
    if (groupBy === 'class') return a.key.localeCompare(b.key, undefined, { numeric:true });
    if (groupBy === 'subject') return LC_SUBJECTS.findIndex(s=>s.id===a.key) - LC_SUBJECTS.findIndex(s=>s.id===b.key);
    if (groupBy === 'teacher') return (teacherById(b.key)?.load||0) - (teacherById(a.key)?.load||0);
    if (groupBy === 'room') return (roomById(a.key)?.no||'').localeCompare(roomById(b.key)?.no||'');
    return 0;
  });

  return (
    <div style={{ display:'flex' as const, flexDirection:'column' as const, gap:10 }}>
      {filtGroups.length === 0 && (
        <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:14, padding:'40px 24px', textAlign:'center' as const, color:'#94A3B8', font:'500 14px Manrope' }}>
          Bu yo'nalish bo'yicha guruhlar topilmadi
        </div>
      )}
      {filtGroups.map((g: any) => {
        const head = renderHead(g);
        const isOpen = expanded.has(g.key);
        return (
          <GroupCard key={g.key} head={head} groupBy={groupBy}
            open={isOpen}
            onToggle={()=>{
              const n = new Set(expanded); n.has(g.key) ? n.delete(g.key) : n.add(g.key);
              setExpanded(n);
            }}
            onAdd={()=>onAddToGroup(groupBy, g.key)}
            onEdit={groupBy==='class' ? ()=>onEditClass(g.key) : null}
          >
            {isOpen && (
              <>
                <div style={{ display:'grid' as const, gridTemplateColumns: gridCols(groupBy),
                  background:'#F8FAFC', borderTop:'1px solid #E2E8F0',
                  font:'700 10px Plus Jakarta Sans', letterSpacing:'.1em', textTransform:'uppercase' as const, color:'#64748B',
                }}>
                  {headCells(groupBy).map((h: any, i: any) =>(<div key={i} style={{ padding:'9px 14px', borderRight: i===headCells(groupBy).length-1?0:'1px solid #F1F5F9' }}>{h}</div>))}
                </div>
                {g.rows.map((r: any) => (
                  <LessonRow key={r.id+'-'+g.key} row={r} groupBy={groupBy}
                    onChange={(p: any) =>onUpdateRow(r.id, p)}
                    onDup={()=>onDupRow(r.id)} onDelete={()=>onDelRow(r.id)}
                    openCell={openCell} onOpen={(rid: any, f: any) =>onOpen(rid,f)} onClose={onClose}
                  />
                ))}
              </>
            )}
          </GroupCard>
        );
      })}
    </div>
  );
}

function gridCols(g: any) {
  // Match LessonRow columns
  const showClass = g !== 'class';
  const showSubj  = g !== 'subject';
  const showTeach = g !== 'teacher';
  const showRoom  = g !== 'room';
  return [
    showClass && '140px',
    showSubj  && '180px',
    showTeach && '1fr',
    '90px','170px',
    showRoom  && '170px',
    '88px',
  ].filter(Boolean).join(' ');
}
function headCells(g: any) {
  const out = [];
  if (g !== 'class')   out.push('Sinf');
  if (g !== 'subject') out.push('Fan');
  if (g !== 'teacher') out.push("O'qituvchi");
  out.push('Soat');
  out.push('Davomiyligi');
  if (g !== 'room')    out.push('Xona');
  out.push('Holat');
  return out;
}

function GroupCard({ head, groupBy, open, onToggle, onAdd, onEdit, children }: any) {
  const stripe = headStripe(head, groupBy);
  return (
    <section style={{
      background:'#fff', border:'1px solid #E2E8F0', borderRadius:14, overflow:'hidden' as const,
      boxShadow: open ? '0 8px 20px -8px rgba(15,23,42,0.08)' : '0 1px 2px rgba(15,23,42,0.04)',
      transition:'box-shadow 200ms ease',
    }}>
      <header style={{
        display:'grid' as const, gridTemplateColumns:'auto 1fr auto', gap:14, alignItems:'center' as const,
        padding:'14px 16px', cursor:'pointer' as const, userSelect:'none' as const,
      }} onClick={onToggle}>
        <div style={{ display:'flex' as const, alignItems:'center' as const, gap:12 }}>
          <button onClick={(e: any) =>{e.stopPropagation(); onToggle();}} style={{
            width:28, height:28, border:0, background:'#F1F5F9', borderRadius:7,
            display:'flex' as const, alignItems:'center' as const, justifyContent:'center' as const, cursor:'pointer' as const,
            transition:'transform 200ms ease', transform: open?'rotate(90deg)':'none',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
          </button>
          {stripe.avatar}
          <div>
            <div style={{ font:'800 17px Plus Jakarta Sans', color:'#0F172A', letterSpacing:'-0.01em' }}>{head.title}</div>
            {head.sub && <div style={{ font:'500 12px Manrope', color:'#94A3B8', marginTop:1 }}>{head.sub}</div>}
          </div>
        </div>
        <div style={{ display:'flex' as const, alignItems:'center' as const, gap:18, flexWrap:'wrap' as const }}>
          {head.meta.map(([label, val]: any, i: number) => (
            <div key={i} style={{ display:'flex' as const, alignItems:'baseline' as const, gap:5 }}>
              <span style={{ font:'700 16px JetBrains Mono', color:'#0F172A' }}>{val}</span>
              <span style={{ font:'500 12px Manrope', color:'#94A3B8' }}>{label}</span>
            </div>
          ))}
        </div>
        <div style={{ display:'flex' as const, gap:6 }}>
          {onEdit && (
            <button onClick={(e: any) =>{e.stopPropagation(); onEdit();}} title="Sinfni tahrirlash" style={{
              display:'inline-flex' as const, alignItems:'center' as const, gap:6,
              font:'600 12px Manrope', color:'#475569', background:'#fff',
              border:'1px solid #E2E8F0', padding:'8px 12px', borderRadius:8, cursor:'pointer' as const,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Tahrirlash
            </button>
          )}
          <button onClick={(e: any) =>{e.stopPropagation(); onAdd();}} style={{
            display:'inline-flex' as const, alignItems:'center' as const, gap:6,
            font:'700 12px Manrope', color:'#fff', background:'#0F172A',
            border:0, padding:'8px 14px', borderRadius:8, cursor:'pointer' as const,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Dars qo'shish
          </button>
        </div>
      </header>
      {children}
    </section>
  );
}

function headStripe(head: any, groupBy: any) {
  if (groupBy === 'class') {
    return { avatar: (
      <div style={{ width:42, height:42, borderRadius:10, background:'linear-gradient(135deg,#4F46E5,#6366F1)', color:'#fff', font:'800 14px Plus Jakarta Sans', display:'flex' as const, alignItems:'center' as const, justifyContent:'center' as const, letterSpacing:'-0.02em' }}>{head.title}</div>
    )};
  }
  if (groupBy === 'subject' && head.subject) {
    const [bg,fg,bar] = subjColors(head.subject);
    return { avatar: (
      <div style={{ width:42, height:42, borderRadius:10, background:bg, color:fg, font:'800 16px Plus Jakarta Sans', display:'flex' as const, alignItems:'center' as const, justifyContent:'center' as const }}>{head.subject.short[0]}</div>
    )};
  }
  if (groupBy === 'teacher' && head.teacher) {
    return { avatar: (
      <div style={{ width:42, height:42, borderRadius:999, background:head.teacher.tone, color:'#fff', font:'800 14px Plus Jakarta Sans', display:'flex' as const, alignItems:'center' as const, justifyContent:'center' as const, letterSpacing:'-0.02em' }}>{head.teacher.avatar}</div>
    )};
  }
  if (groupBy === 'room' && head.room) {
    const icon = head.room.type === 'gym' ? '🏟' : head.room.type === 'lab' ? '🧪' : head.room.type === 'art' ? '✎' : '▢';
    return { avatar: (
      <div style={{ width:42, height:42, borderRadius:10, background:'#F1F5F9', color:'#334155', font:'700 11px JetBrains Mono', display:'flex' as const, alignItems:'center' as const, justifyContent:'center' as const }}>{head.title}</div>
    )};
  }
  return { avatar:null };
}



// --- lessons/LessonsPage.jsx ---
// ─── LessonsPage — top-level page; tabs + accordion grouped view ────────────

function LessonsPage({ onSave, onRowsChange, subjects = [], teachers = [], rooms = [], classes = [], initialLessons = [] }: any) {
  // Sync global variables for legacy pickers that still use them
  React.useEffect(() => {
    LC_SUBJECTS = subjects;
    LC_SUBJECT_BY_ID = Object.fromEntries(subjects.map((s: any) => [s.id, s]));
    LC_TEACHERS = teachers;
    LC_TEACHER_BY_ID = Object.fromEntries(teachers.map((t: any) => [t.id, t]));
    LC_ROOMS = rooms;
    LC_CLASSES = classes.map((c: any) => typeof c === 'string' ? { name: c, groups: [] } : c);
  }, [subjects, teachers, rooms, classes]);

  const seed = React.useMemo(() => initialLessons.map((r: any) => ({ ...r, dur: r.dur || 1 })), [initialLessons]);
  const [rows, setRows]           = React.useState(seed);
  
  // Update local rows if initialLessons changes
  React.useEffect(() => {
    setRows(seed);
  }, [seed]);

  const [groupBy, setGroupBy]     = React.useState('class');
  const [expanded, setExpanded]   = React.useState(new Set());
  const [openCell, setOpenCell]   = React.useState(null);
  const [query, setQuery]         = React.useState('');
  const [showPaste, setShowPaste] = React.useState(false);
  const [showTmpl,  setShowTmpl]  = React.useState(false);
  const [showNotes, setShowNotes] = React.useState(false);
  const [editClass, setEditClass] = React.useState(null); // class id to edit
  const [showMatrix, setShowMatrix] = React.useState(false);

  // Notify parent of row changes
  const notifyChanges = (newRows: any) => {
    onRowsChange && onRowsChange(newRows);
  };

  // ── Row ops ────────────────────────────────────────────────────────────
  const updateRow = (id: any, patch: any) => setRows((rs: any) => {
    const next = rs.map((r: any) => r.id === id ? { ...r, ...patch } : r);
    notifyChanges(next);
    return next;
  });
  const dupRow = (id: any) => setRows((rs: any) => {
    const i = rs.findIndex((r: any) => r.id === id);
    const next = [...rs.slice(0,i+1), { ...rs[i], id:'L'+Date.now() }, ...rs.slice(i+1)];
    notifyChanges(next);
    return next;
  });
  const delRow = (id: any) => setRows((rs: any) => {
    const next = rs.filter((r: any) => r.id !== id);
    notifyChanges(next);
    return next;
  });

  // Add lesson contextually — pre-fills group dimension
  const addToGroup = (gBy: any, key: any) => {
    const blank = {
      id:'L'+Date.now(),
      classes: [], subjectId:'', teacher:'', room:'', hours:1, dur:1,
    };
    if (gBy === 'class')   blank.classes = [key];
    if (gBy === 'subject') blank.subjectId = key;
    if (gBy === 'teacher') blank.teacher = key;
    if (gBy === 'room')    blank.room = key;
    // Insert at TOP for visibility
    setRows((rs: any) => {
      const next = [blank, ...rs];
      notifyChanges(next);
      return next;
    });
    // Ensure expanded
    const n = new Set(expanded); n.add(key); setExpanded(n);
    // Auto-open subject picker (most common first step)
    setTimeout(() => setOpenCell({ row: blank.id, field: gBy === 'subject' ? 'teacher' : 'subject' }), 60);
  };
  const addLooseRow = () => {
    const blank = { id:'L'+Date.now(), classes:[], subjectId:'', teacher:'', room:'', hours:1, dur:1 };
    setRows((rs: any) => {
      const next = [blank, ...rs];
      notifyChanges(next);
      return next;
    });
    setTimeout(()=>setOpenCell({ row: blank.id, field:'class' }), 60);
  };

  const applyPaste = (parsed: any) => {
    const out = parsed.map((p: any, i: any) => {
      const sub = LC_SUBJECTS.find((s: any) => s.name === p.subject || s.short === p.subject);
      const tch = LC_TEACHERS.find((t: any) => t.name === p.teacher);
      const rm  = LC_ROOMS.find((r: any) => r.no === p.room);
      // Map block pattern → dur
      let dur = 1;
      if (p.block === '2') dur = 2;
      else if (p.block === '3') dur = 3;
      else if (p.block && p.block.includes('+')) dur = parseInt(p.block.split('+')[0],10) || 1;
      return {
        id:'L'+Date.now()+'_'+i,
        classes:p.classes,
        subjectId:sub?.id || '', teacher:tch?.id || '', room:rm?.id || '',
        hours:p.hours, dur,
      };
    });
    setRows((rs: any) => [...out, ...rs]);
  };
  const applyTemplate = (T: any, classes: any) => {
    const out = T.subs.map(([sid, hrs, blk, flag]: any, i: number) => {
      let dur = 1;
      if (blk === '2') dur = 2; else if (blk === '3') dur = 3;
      else if (blk?.includes('+')) dur = parseInt(blk.split('+')[0],10) || 1;
      const teach = flag === 'GROUP'
        ? { groups:[{ label:'', tid:'', room:'' }, { label:'', tid:'', room:'' }] }
        : '';
      return { id:'L'+Date.now()+'_'+i, classes, subjectId:sid, teacher:teach, room:'', hours:hrs, dur };
    });
    setRows((rs: any) => [...out, ...rs]);
  };

  // Click-outside picker close
  React.useEffect(() => {
    if (!openCell) return;
    const onDoc = (e: any) => {
      if (!e.target.closest('[data-row-id]') && !e.target.closest('[role="dialog"]')) setOpenCell(null);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [openCell]);

  // Global stats
  const totalLessons = rows.length;
  const totalHours   = rows.reduce((s: any, r: any) =>s+(r.hours||0),0);
  const totalIncomplete = rows.filter((r: any) => !r.subjectId || (typeof r.teacher === 'string' ? !r.teacher : r.teacher.groups.some((g: any) => !g.tid || !g.label))).length;

  return (
    <div style={{ display:'flex' as const, height:'100vh', overflow:'hidden' as const }}>
      
      <main style={{ flex:1, minWidth:0, display:'flex' as const, flexDirection:'column' as const, background:'#F8FAFC' }}>
        {/* Topbar */}
        <header style={{
          background:'#fff', borderBottom:'1px solid #E2E8F0', padding:'14px 26px',
          display:'flex' as const, alignItems:'center' as const, justifyContent:'space-between' as const, flexShrink:0,
        }}>
          <div>
            <div style={{ font:'500 11px Manrope', color:'#94A3B8', letterSpacing:'.02em' }}>2025–2026 · Kuzgi semestr</div>
            <div style={{ font:'800 24px Plus Jakarta Sans', color:'#0F172A', letterSpacing:'-0.02em', marginTop:1 }}>Darslar</div>
            <div style={{ font:'500 12px Manrope', color:'#94A3B8', marginTop:3 }}>
              Har bir sinf/o'qituvchi uchun fan, soat va davomiyligini kiriting
            </div>
          </div>
          <div style={{ display:'flex' as const, alignItems:'center' as const, gap:8 }}>
            <div style={{ display:'flex' as const, gap:10, alignItems:'center' as const, marginRight:6 }}>
              <Stat label="darslar" val={totalLessons}/>
              <Stat label="haftalik soat" val={totalHours}/>
              <Stat label="tugallanmagan" val={totalIncomplete} warn={totalIncomplete>0}/>
            </div>
            <span style={{ width:1, height:24, background:'#E2E8F0' }}/>
            <button onClick={()=>setShowTmpl(true)} style={ghostBtnT}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              Shablon
            </button>
            <button onClick={()=>setShowPaste(true)} style={ghostBtnT}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
              Excel'dan
            </button>
            <button onClick={()=>setShowMatrix(true)} style={ghostBtnT}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>
              Matritsa
            </button>
            <button onClick={()=>setShowNotes(true)} style={{ ...ghostBtnT, background:'#F8FAFC' }} title="UX logikasi">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
              UX logika
            </button>
            <button style={primaryBtnT} onClick={() => onSave && onSave(rows)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Saqlash
            </button>
          </div>
        </header>

        {/* Body */}
        <div style={{ flex:1, minHeight:0, overflow:'auto' as const }}>
          <div style={{ maxWidth:1380, margin:'0 auto', padding:'22px 26px 80px' }}>

            {/* Group-by tabs (segmented) */}
            <div style={{
              display:'grid' as const, gridTemplateColumns:'repeat(4, 1fr)', gap:0,
              background:'#fff', border:'1px solid #E2E8F0', borderRadius:14, padding:4,
              marginBottom:16, boxShadow:'0 1px 2px rgba(15,23,42,0.03)',
            }}>
              {GROUP_TABS.map((t: any) => {
                const on = groupBy === t.id;
                const count = computeGroups(rows, t.id).length;
                return (
                  <button key={t.id} onClick={()=>{ setGroupBy(t.id); setExpanded(new Set()); }}
                    style={{
                      display:'flex' as const, alignItems:'center' as const, justifyContent:'center' as const, gap:9,
                      padding:'12px 14px',
                      font:'700 13px Plus Jakarta Sans', letterSpacing:'-0.005em',
                      color: on ? '#0F172A' : '#64748B',
                      background: on ? '#F8FAFC' : 'transparent',
                      border:0, borderRadius:10, cursor:'pointer' as const,
                      boxShadow: on ? '0 1px 2px rgba(15,23,42,0.04), inset 0 0 0 1px #E2E8F0' : 'none',
                      transition:'all 140ms ease',
                    }}>
                    {tabIcon(t.id, on)}
                    {t.label}
                    <span style={{
                      font:'700 10px JetBrains Mono',
                      color: on ? '#4338CA' : '#94A3B8',
                      background: on ? '#EEF2FF' : '#F1F5F9',
                      padding:'2px 6px', borderRadius:5,
                    }}>{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Action bar */}
            <div style={{ display:'flex' as const, alignItems:'center' as const, gap:10, marginBottom:14 }}>
              <button onClick={addLooseRow} style={{
                display:'inline-flex' as const, alignItems:'center' as const, gap:7,
                font:'700 13px Manrope', color:'#fff', background:'#0F172A',
                border:0, padding:'10px 16px', borderRadius:10, cursor:'pointer' as const,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                Yangi dars
              </button>
              <div style={{
                flex:1, display:'flex' as const, alignItems:'center' as const, gap:8,
                background:'#fff', border:'1px solid #E2E8F0', borderRadius:10, padding:'0 12px',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input value={query} onChange={e=>setQuery(e.target.value)}
                  placeholder={`${tabPlaceholder(groupBy)} bo'yicha qidirish...`}
                  style={{ flex:1, border:0, outline:0, padding:'11px 0', font:'500 13px Manrope', color:'#0F172A', background:'transparent' }}/>
                {query && (
                  <button onClick={()=>setQuery('')} style={{ width:22, height:22, border:0, background:'#F1F5F9', borderRadius:5, color:'#64748B', cursor:'pointer' as const }}>×</button>
                )}
              </div>
              <button onClick={()=>setExpanded(new Set(computeGroups(rows, groupBy).map(g=>g.key)))} style={ghostBtnT}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                Barchasini yoyish
              </button>
              <button onClick={()=>setExpanded(new Set())} style={ghostBtnT}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
                Yopish
              </button>
            </div>

            {/* Grouped accordion */}
            <GroupedView
              rows={rows} groupBy={groupBy}
              expanded={expanded} setExpanded={setExpanded}
              onAddToGroup={addToGroup}
              onUpdateRow={updateRow} onDupRow={dupRow} onDelRow={delRow}
              onEditClass={(c: any) => setEditClass(c)}
              openCell={openCell}
              onOpen={(rid: any, f: any) =>setOpenCell({ row:rid, field:f })}
              onClose={()=>setOpenCell(null)}
              query={query}
            />
          </div>
        </div>
      </main>

      {showPaste && <BulkPasteModal onClose={()=>setShowPaste(false)} onApply={applyPaste}/>}
      {showTmpl  && <TemplatesModal onClose={()=>setShowTmpl(false)} onApply={applyTemplate}/>}
      <DesignNotes open={showNotes} onClose={()=>setShowNotes(false)}/>
      {editClass && <EditClassDrawer classId={editClass} rows={rows} onClose={()=>setEditClass(null)}/>}
      {showMatrix && <MatrixModal rows={rows} onClose={()=>setShowMatrix(false)}/>}
    </div>
  );
}

function Stat({ label, val, warn }: any) {
  return (
    <div style={{ display:'flex' as const, flexDirection:'column' as const, alignItems:'flex-end' as const, lineHeight:1 }}>
      <span style={{ font:'800 17px JetBrains Mono', color:warn?'#D97706':'#0F172A' }}>{val}</span>
      <span style={{ font:'500 10px Manrope', color:'#94A3B8', marginTop:2, letterSpacing:'.02em' }}>{label}</span>
    </div>
  );
}
function tabPlaceholder(g: any) {
  return g==='class'?'Sinf':g==='teacher'?"O'qituvchi":g==='subject'?'Fan':'Xona';
}
function tabIcon(id: any, on: any) {
  const c = on ? '#4338CA' : '#94A3B8';
  const sw = 1.85;
  const ic = {
    class:    <><path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v6"/><path d="M21 7v6"/><path d="M5 9.5v3a7 7 0 0 0 14 0v-3"/></>,
    teacher:  <><circle cx="9" cy="8" r="3.5"/><path d="M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7"/><circle cx="17" cy="6" r="2.5"/><path d="M21 18c0-2-1.5-4-4-4"/></>,
    subject:  <><path d="M4 5a2 2 0 0 1 2-2h12v17H6a2 2 0 0 0-2 2V5z"/><path d="M8 7h7"/><path d="M8 11h5"/></>,
    room:     <><path d="M21 10l-9-7-9 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10z"/><path d="M9 22V12h6v10"/></>,
  };
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{ic[id]}</svg>
  );
}

// ─── EditClassDrawer — inline editor for class metadata ──────────────────────
function EditClassDrawer({ classId, rows, onClose }: any) {
  const lessonsOfClass = rows.filter((r: any) => r.classes.includes(classId));
  const totalHours = lessonsOfClass.reduce((s: any, r: any) =>s+(r.hours||0),0);
  return (
    <div onClick={onClose} style={{
      position:'fixed' as const, inset:0, background:'rgba(15,23,42,0.32)', zIndex:50,
      display:'flex' as const, justifyContent:'flex-end' as const,
    }} role="dialog">
      <aside onClick={e=>e.stopPropagation()} style={{
        width:420, height:'100%', background:'#fff', boxShadow:'-10px 0 30px -10px rgba(15,23,42,0.18)',
        display:'flex' as const, flexDirection:'column' as const,
      }}>
        <header style={{ padding:'20px 22px', borderBottom:'1px solid #E2E8F0', display:'flex' as const, alignItems:'center' as const, justifyContent:'space-between' as const }}>
          <div>
            <div style={{ font:'500 11px Manrope', color:'#94A3B8' }}>Sinfni tahrirlash</div>
            <div style={{ font:'800 22px Plus Jakarta Sans', color:'#0F172A', marginTop:1 }}>{classId}</div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, border:0, background:'#F1F5F9', borderRadius:8, cursor:'pointer' as const, color:'#475569' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display:'block' as const, margin:'auto' }}><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </header>
        <div style={{ flex:1, overflow:'auto' as const, padding:'18px 22px', display:'flex' as const, flexDirection:'column' as const, gap:18 }}>
          <Field label="Sinf nomi">
            <input defaultValue={classId} style={drawerInp}/>
          </Field>
          <div style={{ display:'grid' as const, gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Field label="O'quvchilar"><input defaultValue="28" style={drawerInp}/></Field>
            <Field label="Sinf rahbari"><input defaultValue="" placeholder="Tanlang..." style={drawerInp}/></Field>
          </div>
          <Field label="Eslatma">
            <textarea rows="3" placeholder="Maxsus shartlar..." style={{...drawerInp, resize:'vertical', font:'500 13px Manrope', padding:'10px 12px'}}/>
          </Field>
          <div style={{ borderTop:'1px solid #F1F5F9', paddingTop:14 }}>
            <div style={{ display:'flex' as const, justifyContent:'space-between' as const, marginBottom:10 }}>
              <div style={{ font:'700 13px Plus Jakarta Sans', color:'#0F172A' }}>Joriy yuk</div>
              <div style={{ font:'700 13px JetBrains Mono', color:'#475569' }}>{lessonsOfClass.length} dars · {totalHours}h</div>
            </div>
            <div style={{ display:'flex' as const, flexDirection:'column' as const, gap:6 }}>
              {lessonsOfClass.slice(0,8).map((r: any) => {
                const s = subjById(r.subjectId);
                const [bg,fg,bar] = s ? subjColors(s) : ['#F1F5F9','#475569','#94A3B8'];
                return (
                  <div key={r.id} style={{ display:'flex' as const, alignItems:'center' as const, gap:10, padding:'8px 10px', background:'#F8FAFC', borderRadius:8 }}>
                    <span style={{ width:22, height:22, borderRadius:5, background:bar, color:'#fff', font:'800 10px Plus Jakarta Sans', display:'flex' as const, alignItems:'center' as const, justifyContent:'center' as const }}>{s?.short[0]||'?'}</span>
                    <span style={{ flex:1, font:'600 12px Manrope', color:'#0F172A' }}>{s?.name||'Fan yo\'q'}</span>
                    <span style={{ font:'700 11px JetBrains Mono', color:'#64748B' }}>{r.hours}h</span>
                    <span style={{ font:'600 10px Plus Jakarta Sans', color:'#94A3B8', textTransform:'uppercase' as const, letterSpacing:'.05em' }}>{['','yakka','juftlik','uchlik'][r.dur||1]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <footer style={{ padding:14, borderTop:'1px solid #E2E8F0', display:'flex' as const, gap:8, justifyContent:'flex-end' as const }}>
          <button onClick={onClose} style={ghostBtnT}>Bekor</button>
          <button onClick={onClose} style={primaryBtnT}>Saqlash</button>
        </footer>
      </aside>
    </div>
  );
}
function Field({ label, children }: any) {
  return (
    <label style={{ display:'flex' as const, flexDirection:'column' as const, gap:6 }}>
      <span style={{ font:'700 10px Plus Jakarta Sans', color:'#64748B', letterSpacing:'.08em', textTransform:'uppercase' as const }}>{label}</span>
      {children}
    </label>
  );
}
const drawerInp = {
  font:'600 14px Manrope', color:'#0F172A',
  border:'1px solid #E2E8F0', borderRadius:8, padding:'10px 12px',
  outline:0, background:'#fff',
};

// ─── MatrixModal — wrap Matrix view in a fullscreen modal ───────────────────
function MatrixModal({ rows, onClose }: any) {
  return (
    <div onClick={onClose} style={{
      position:'fixed' as const, inset:0, background:'rgba(15,23,42,0.5)', zIndex:50,
      display:'flex' as const, alignItems:'center' as const, justifyContent:'center' as const, padding:30,
    }} role="dialog">
      <div onClick={e=>e.stopPropagation()} style={{
        background:'#fff', borderRadius:16, width:'100%', maxWidth:1280, maxHeight:'92vh',
        overflow:'auto' as const, boxShadow:'0 24px 60px -16px rgba(15,23,42,0.32)', padding:24,
      }}>
        <div style={{ display:'flex' as const, justifyContent:'space-between' as const, alignItems:'center' as const, marginBottom:16 }}>
          <div>
            <div style={{ font:'500 11px Manrope', color:'#94A3B8' }}>Yagona ko'rinish</div>
            <div style={{ font:'800 20px Plus Jakarta Sans', color:'#0F172A' }}>Matritsa — sinf × fan</div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, border:0, background:'#F1F5F9', borderRadius:8, cursor:'pointer' as const }}>×</button>
        </div>
        <MatrixView rows={rows} classes={LC_CLASSES}/>
      </div>
    </div>
  );
}

const ghostBtnT = {
  display:'inline-flex' as const, alignItems:'center' as const, gap:6,
  font:'600 12px Manrope', color:'#475569', background:'#fff',
  border:'1px solid #E2E8F0', padding:'8px 12px', borderRadius:8, cursor:'pointer' as const,
};
const primaryBtnT = {
  display:'inline-flex' as const, alignItems:'center' as const, gap:6,
  font:'700 12px Manrope', color:'#fff', background:'#4F46E5',
  border:0, padding:'8px 14px', borderRadius:8, cursor:'pointer' as const,
};




// --- lessons/Groups.jsx ---
const getGroupsForClasses = (classNames: any) => {
  const groups = new Set();
  classNames.forEach((name: any) => {
    const c = LC_CLASSES.find((cl: any) => cl.name === name);
    if (c && c.groups) {
      c.groups.forEach((g: any) => groups.add(g.name));
    }
  });
  return [...groups];
};

export function initLessonsData(
  classes: (EtClass | string)[],
  subjects: EtSubject[],
  teachers: EtTeacher[],
  rooms: EtRoom[],
  lessons: EtLessonRow[],
): void {
  LC_CLASSES = classes.map((c) => typeof c === 'string' ? { name: c, groups: [] } : c);
  LC_SUBJECTS = subjects;
  LC_SUBJECT_BY_ID = Object.fromEntries(subjects.map((s) => [s.id, s]));
  LC_TEACHERS = teachers;
  LC_TEACHER_BY_ID = Object.fromEntries(teachers.map((t) => [t.id, t]));
  LC_ROOMS = rooms;
  LC_SEED = lessons;
}

export default LessonsPage;
