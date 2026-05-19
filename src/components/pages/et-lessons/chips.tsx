import React from 'react';
import { roomById, subjById, subjColors, teacherById } from './catalog';
import { cellBtn2, emptyCellBtn2 } from './ui';

export function ClassChips({ classes, onClick }: any) {
  if (!classes.length) return <button onClick={onClick} style={emptyCellBtn2}>+ Sinf</button>;
  return (
    <button onClick={onClick} style={cellBtn2}>
      <div style={{ display: 'flex' as const, flexWrap: 'wrap' as const, gap: 4 }}>
        {classes.slice(0, 3).map((c: any) => (
          <span key={c} style={{ font: '700 11px JetBrains Mono', padding: '3px 7px', borderRadius: 6, background: '#EEF2FF', color: '#4338CA' }}>{c}</span>
        ))}
        {classes.length > 3 && (
          <span style={{ font: '700 11px JetBrains Mono', padding: '3px 7px', borderRadius: 6, background: '#F1F5F9', color: '#475569' }}>+{classes.length - 3}</span>
        )}
      </div>
    </button>
  );
}

export function SubjectChip({ subjectId, onClick }: any) {
  if (!subjectId) return <button onClick={onClick} style={emptyCellBtn2}>+ Fan</button>;
  const s = subjById(subjectId);
  if (!s) return <button onClick={onClick} style={emptyCellBtn2}>+ Fan</button>;
  const [bg, fg, bar] = subjColors(s);
  return (
    <button onClick={onClick} style={cellBtn2}>
      <span style={{ display: 'inline-flex' as const, alignItems: 'center' as const, gap: 8, padding: '5px 10px 5px 6px', borderRadius: 8, background: bg, color: fg, font: '700 13px Manrope' }}>
        <span style={{ width: 18, height: 18, borderRadius: 5, background: bar, color: '#fff', font: '800 10px Plus Jakarta Sans', display: 'inline-flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const }}>{s.short[0]}</span>
        {s.name}
      </span>
    </button>
  );
}

export function TeacherChip({ tid, onClick, dense = false }: any) {
  if (!tid) return <button onClick={onClick} style={emptyCellBtn2}>+ O'qituvchi</button>;
  const t = teacherById(tid);
  if (!t) return <button onClick={onClick} style={emptyCellBtn2}>+ O'qituvchi</button>;
  const over = t.load >= t.cap;
  return (
    <button onClick={onClick} style={cellBtn2}>
      <span style={{ display: 'inline-flex' as const, alignItems: 'center' as const, gap: 8, minWidth: 0 }}>
        <span style={{ width: 24, height: 24, borderRadius: 999, background: t.tone, color: '#fff', font: '800 10px Plus Jakarta Sans', display: 'inline-flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const, flexShrink: 0, letterSpacing: '-0.02em' }}>{t.avatar}</span>
        <span style={{ minWidth: 0, overflow: 'hidden' as const }}>
          <div style={{ font: '600 13px Manrope', color: '#0F172A', lineHeight: 1.2, overflow: 'hidden' as const, textOverflow: 'ellipsis' as const, whiteSpace: 'nowrap' as const }}>{t.name}</div>
          {!dense && <div style={{ font: '500 10px JetBrains Mono', color: over ? '#DC2626' : '#94A3B8', marginTop: 1 }}>{t.load}/{t.cap}h</div>}
        </span>
      </span>
    </button>
  );
}

export function RoomChip({ rid, onClick }: any) {
  if (!rid) return <button onClick={onClick} style={emptyCellBtn2}>—</button>;
  const r = roomById(rid);
  if (!r) return <button onClick={onClick} style={emptyCellBtn2}>—</button>;
  return (
    <button onClick={onClick} style={cellBtn2}>
      <span style={{ display: 'inline-flex' as const, alignItems: 'center' as const, gap: 6 }}>
        <span style={{ font: '700 12px JetBrains Mono', padding: '3px 8px', borderRadius: 6, background: '#F1F5F9', color: '#334155' }}>{r.no}</span>
        <span style={{ font: '500 12px Manrope', color: '#64748B', overflow: 'hidden' as const, textOverflow: 'ellipsis' as const, whiteSpace: 'nowrap' as const }}>{r.label}</span>
      </span>
    </button>
  );
}
