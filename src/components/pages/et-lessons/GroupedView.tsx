import React from 'react';
import { LC_SUBJECTS, roomById, subjById, subjColors, teacherById } from './catalog';
import { LessonRow } from './rows';

export const GROUP_TABS = [
  { id: 'class', label: 'Sinflar', sub: "sinf bo'yicha guruhlash" },
  { id: 'teacher', label: "O'qituvchilar", sub: "o'qituvchi bo'yicha" },
  { id: 'subject', label: 'Fanlar', sub: 'fan bo\'yicha' },
  { id: 'room', label: 'Xonalar', sub: "xona bo'yicha" },
];

// Compute groups for the active tab.
export function computeGroups(rows: any, groupBy: any) {
  const buckets: Record<string, { key: string; rows: any[]; hoursSum: number }> = {};
  const push = (key: any, row: any, hours: any) => {
    if (!buckets[key]) buckets[key] = { key, rows: [], hoursSum: 0 };
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

function gridCols(g: any) {
  const showClass = g !== 'class';
  const showSubj = g !== 'subject';
  const showTeach = g !== 'teacher';
  const showRoom = g !== 'room';
  return [
    showClass && '140px',
    showSubj && '180px',
    showTeach && '1fr',
    '90px', '170px',
    showRoom && '170px',
    '88px',
  ].filter(Boolean).join(' ');
}

function headCells(g: any) {
  const out: string[] = [];
  if (g !== 'class') out.push('Sinf');
  if (g !== 'subject') out.push('Fan');
  if (g !== 'teacher') out.push("O'qituvchi");
  out.push('Soat');
  out.push('Davomiyligi');
  if (g !== 'room') out.push('Xona');
  out.push('Holat');
  return out;
}

function headStripe(head: any, groupBy: any) {
  if (groupBy === 'class') {
    return {
      avatar: (
        <div style={{ width: 42, height: 42, borderRadius: 10, background: 'linear-gradient(135deg,#4F46E5,#6366F1)', color: '#fff', font: '800 14px Plus Jakarta Sans', display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const, letterSpacing: '-0.02em' }}>{head.title}</div>
      ),
    };
  }
  if (groupBy === 'subject' && head.subject) {
    const [bg, fg, _bar] = subjColors(head.subject);
    return {
      avatar: (
        <div style={{ width: 42, height: 42, borderRadius: 10, background: bg, color: fg, font: '800 16px Plus Jakarta Sans', display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const }}>{head.subject.short[0]}</div>
      ),
    };
  }
  if (groupBy === 'teacher' && head.teacher) {
    return {
      avatar: (
        <div style={{ width: 42, height: 42, borderRadius: 999, background: head.teacher.tone, color: '#fff', font: '800 14px Plus Jakarta Sans', display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const, letterSpacing: '-0.02em' }}>{head.teacher.avatar}</div>
      ),
    };
  }
  if (groupBy === 'room' && head.room) {
    return {
      avatar: (
        <div style={{ width: 42, height: 42, borderRadius: 10, background: '#F1F5F9', color: '#334155', font: '700 11px JetBrains Mono', display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const }}>{head.title}</div>
      ),
    };
  }
  return { avatar: null };
}

const EDIT_TITLE: Record<string, string> = {
  class: 'Sinfni tahrirlash',
  teacher: "O'qituvchini tahrirlash",
  subject: 'Fanni tahrirlash',
  room: 'Xonani tahrirlash',
};

function GroupCard({ head, groupBy, open, onToggle, onAdd, onEdit, children }: any) {
  const stripe = headStripe(head, groupBy);
  return (
    <section style={{
      background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden' as const,
      boxShadow: open ? '0 8px 20px -8px rgba(15,23,42,0.08)' : '0 1px 2px rgba(15,23,42,0.04)',
      transition: 'box-shadow 200ms ease',
    }}>
      <header style={{
        display: 'grid' as const, gridTemplateColumns: 'auto 1fr auto', gap: 14, alignItems: 'center' as const,
        padding: '14px 16px', cursor: 'pointer' as const, userSelect: 'none' as const,
      }} onClick={onToggle}>
        <div style={{ display: 'flex' as const, alignItems: 'center' as const, gap: 12 }}>
          <button onClick={(e: any) => { e.stopPropagation(); onToggle(); }} style={{
            width: 28, height: 28, border: 0, background: '#F1F5F9', borderRadius: 7,
            display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const, cursor: 'pointer' as const,
            transition: 'transform 200ms ease', transform: open ? 'rotate(90deg)' : 'none',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
          </button>
          {stripe.avatar}
          <div>
            <div style={{ font: '800 17px Plus Jakarta Sans', color: '#0F172A', letterSpacing: '-0.01em' }}>{head.title}</div>
            {head.sub && <div style={{ font: '500 12px Manrope', color: '#94A3B8', marginTop: 1 }}>{head.sub}</div>}
          </div>
        </div>
        <div style={{ display: 'flex' as const, alignItems: 'center' as const, gap: 18, flexWrap: 'wrap' as const }}>
          {head.meta.map(([label, val]: any, i: number) => (
            <div key={i} style={{ display: 'flex' as const, alignItems: 'baseline' as const, gap: 5 }}>
              <span style={{ font: '700 16px JetBrains Mono', color: '#0F172A' }}>{val}</span>
              <span style={{ font: '500 12px Manrope', color: '#94A3B8' }}>{label}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex' as const, gap: 6 }}>
          {onEdit && (
            <button onClick={(e: any) => { e.stopPropagation(); onEdit(); }} title={EDIT_TITLE[groupBy] || 'Tahrirlash'} style={{
              display: 'inline-flex' as const, alignItems: 'center' as const, gap: 6,
              font: '600 12px Manrope', color: '#475569', background: '#fff',
              border: '1px solid #E2E8F0', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' as const,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
              Tahrirlash
            </button>
          )}
          <button onClick={(e: any) => { e.stopPropagation(); onAdd(); }} style={{
            display: 'inline-flex' as const, alignItems: 'center' as const, gap: 6,
            font: '700 12px Manrope', color: '#fff', background: '#0F172A',
            border: 0, padding: '8px 14px', borderRadius: 8, cursor: 'pointer' as const,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
            Dars qo'shish
          </button>
        </div>
      </header>
      {children}
    </section>
  );
}

export function GroupedView({ rows, groupBy, expanded, setExpanded, onAddToGroup, onUpdateRow, onDupRow, onDelRow, onEditGroup, openCell, onOpen, onClose, query }: any) {
  const groups = computeGroups(rows, groupBy);

  const renderHead = (g: any): any => {
    const k = g.key;
    const teachers = new Set();
    const subjects = new Set();
    const rooms = new Set();
    const classes = new Set();
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
        title: 'Tayinlanmagan darslar',
        kind: 'misc',
        meta: [['darslar', g.rows.length], ['soat', g.hoursSum]],
      };
    }
    if (groupBy === 'class') {
      return {
        title: k,
        kind: 'class',
        meta: [
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
      return {
        title: s?.name, kind: 'subject', subject: s, meta: [
          ['darslar', g.rows.length],
          ['jami soat', g.hoursSum],
          ["o'qituvchi", teachers.size],
          ['sinf', classes.size],
        ],
      };
    }
    if (groupBy === 'teacher') {
      const t = teacherById(k);
      if (!t) return { title: '—', kind: 'teacher', meta: [] };
      return {
        title: t.name, kind: 'teacher', teacher: t, meta: [
          ['darslar', g.rows.length],
          ['haftalik soat', g.hoursSum],
          ['fan', subjects.size],
          ['sinf', classes.size],
        ],
      };
    }
    if (groupBy === 'room') {
      const rm = roomById(k);
      return {
        title: rm?.no, sub: rm?.label, kind: 'room', room: rm, meta: [
          ['darslar', g.rows.length],
          ['jami soat', g.hoursSum],
          ['sinf', classes.size],
          ['fan', subjects.size],
        ],
      };
    }
    return { title: k, meta: [] };
  };

  const filtGroups = query
    ? groups.filter((g: any) => {
        const h = renderHead(g);
        return (h.title || '').toLowerCase().includes(query.toLowerCase());
      })
    : groups;

  filtGroups.sort((a: any, b: any) => {
    if (groupBy === 'class') return a.key.localeCompare(b.key, undefined, { numeric: true });
    if (groupBy === 'subject') return LC_SUBJECTS.findIndex((s) => s.id === a.key) - LC_SUBJECTS.findIndex((s) => s.id === b.key);
    if (groupBy === 'teacher') return (teacherById(b.key)?.load || 0) - (teacherById(a.key)?.load || 0);
    if (groupBy === 'room') return (roomById(a.key)?.no || '').localeCompare(roomById(b.key)?.no || '');
    return 0;
  });

  return (
    <div style={{ display: 'flex' as const, flexDirection: 'column' as const, gap: 10 }}>
      {filtGroups.length === 0 && (
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '40px 24px', textAlign: 'center' as const, color: '#94A3B8', font: '500 14px Manrope' }}>
          Bu yo'nalish bo'yicha guruhlar topilmadi
        </div>
      )}
      {filtGroups.map((g: any) => {
        const head = renderHead(g);
        const isOpen = expanded.has(g.key);
        return (
          <GroupCard key={g.key} head={head} groupBy={groupBy}
            open={isOpen}
            onToggle={() => {
              const n = new Set(expanded); n.has(g.key) ? n.delete(g.key) : n.add(g.key);
              setExpanded(n);
            }}
            onAdd={() => onAddToGroup(groupBy, g.key)}
            onEdit={g.key === 'MISC' ? null : () => onEditGroup(groupBy, g.key)}
          >
            {isOpen && (
              <>
                <div style={{
                  display: 'grid' as const, gridTemplateColumns: gridCols(groupBy),
                  background: '#F8FAFC', borderTop: '1px solid #E2E8F0',
                  font: '700 10px Plus Jakarta Sans', letterSpacing: '.1em', textTransform: 'uppercase' as const, color: '#64748B',
                }}>
                  {headCells(groupBy).map((h: any, i: any) => (
                    <div key={i} style={{ padding: '9px 14px', borderRight: i === headCells(groupBy).length - 1 ? 0 : '1px solid #F1F5F9' }}>{h}</div>
                  ))}
                </div>
                {g.rows.map((r: any) => (
                  <LessonRow key={r.id + '-' + g.key} row={r} groupBy={groupBy}
                    onChange={(p: any) => onUpdateRow(r.id, p)}
                    onDup={() => onDupRow(r.id)} onDelete={() => onDelRow(r.id)}
                    openCell={openCell} onOpen={(rid: any, f: any) => onOpen(rid, f)} onClose={onClose}
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

export function tabPlaceholder(g: any) {
  return g === 'class' ? 'Sinf' : g === 'teacher' ? "O'qituvchi" : g === 'subject' ? 'Fan' : 'Xona';
}

export function tabIcon(id: any, on: any) {
  const c = on ? '#4338CA' : '#94A3B8';
  const sw = 1.85;
  const ic: Record<string, React.ReactNode> = {
    class: <><path d="M3 7l9-4 9 4-9 4-9-4z" /><path d="M3 7v6" /><path d="M21 7v6" /><path d="M5 9.5v3a7 7 0 0 0 14 0v-3" /></>,
    teacher: <><circle cx="9" cy="8" r="3.5" /><path d="M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7" /><circle cx="17" cy="6" r="2.5" /><path d="M21 18c0-2-1.5-4-4-4" /></>,
    subject: <><path d="M4 5a2 2 0 0 1 2-2h12v17H6a2 2 0 0 0-2 2V5z" /><path d="M8 7h7" /><path d="M8 11h5" /></>,
    room: <><path d="M21 10l-9-7-9 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10z" /><path d="M9 22V12h6v10" /></>,
  };
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{ic[id]}</svg>
  );
}
