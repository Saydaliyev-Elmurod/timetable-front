import React from 'react';
import { LC_CLASSES, LC_SUBJECTS, subjColors } from './catalog';
import { mxCell, mxHead } from './ui';

export function MatrixView({ rows, classes, onCellEdit }: any) {
  // Build a lookup: { subjectId: { classCode: { hours, teacher } } }
  const map: Record<string, Record<string, any>> = {};
  for (const r of rows) {
    if (!r.subjectId) continue;
    map[r.subjectId] = map[r.subjectId] || {};
    for (const c of r.classes) {
      map[r.subjectId][c] = {
        hours: r.hours,
        teacher: r.teacher,
        room: r.room,
        grouped: !!(r.teacher && r.teacher.groups),
      };
    }
  }
  return (
    <div style={{
      background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden' as const,
      boxShadow: '0 4px 12px -2px rgba(15,23,42,0.05)',
    }}>
      <div style={{ overflowX: 'auto' as const }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: 0, minWidth: '100%', font: '500 13px Manrope' }}>
          <thead>
            <tr>
              <th style={{ ...mxHead, left: 0, position: 'sticky' as const, zIndex: 3, minWidth: 180, background: '#F8FAFC', textAlign: 'left' as const, paddingLeft: 14 }}>Fan</th>
              {classes.map((c: any) => {
                const code = typeof c === 'string' ? c : c.name;
                return (
                  <th key={code} style={{ ...mxHead, minWidth: 64, textAlign: 'center' as const }}>
                    <span style={{ font: '700 11px JetBrains Mono', color: '#475569' }}>{code}</span>
                  </th>
                );
              })}
              <th style={{ ...mxHead, minWidth: 64, textAlign: 'right' as const, paddingRight: 12 }}>
                <span style={{ font: '700 10px Plus Jakarta Sans', letterSpacing: '.1em', color: '#94A3B8', textTransform: 'uppercase' as const }}>Jami</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {LC_SUBJECTS.map((s: any) => {
              const row = map[s.id] || {};
              const [bg, fg, bar] = subjColors(s);
              const total = classes.reduce((sum: any, c: any) => sum + (row[c]?.hours || 0), 0);
              return (
                <tr key={s.id}>
                  <td style={{ ...mxCell, position: 'sticky' as const, left: 0, background: '#fff', zIndex: 2, paddingLeft: 14, borderRight: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex' as const, alignItems: 'center' as const, gap: 8 }}>
                      <span style={{ width: 22, height: 22, borderRadius: 6, background: bg, color: fg, font: '800 11px Plus Jakarta Sans', display: 'inline-flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const }}>{s.short[0]}</span>
                      <span style={{ font: '600 13px Manrope', color: '#0F172A' }}>{s.name}</span>
                    </div>
                  </td>
                  {classes.map((c: any) => {
                    const code = typeof c === 'string' ? c : c.name;
                    const cell = row[code];
                    const h = cell?.hours;
                    return (
                      <td key={code} style={{ ...mxCell, textAlign: 'center' as const, padding: 0 }}>
                        <button onClick={() => onCellEdit && onCellEdit(s.id, code)}
                          style={{
                            width: '100%', height: '100%', minHeight: 42,
                            border: 0, cursor: 'pointer' as const,
                            background: h ? bg : 'transparent',
                            color: h ? fg : '#CBD5E1',
                            font: '800 14px Plus Jakarta Sans', letterSpacing: '-0.01em',
                            position: 'relative' as const,
                          }}>
                          {h ? (
                            <>
                              {h}
                              {cell?.grouped && (
                                <span title="Guruhli" style={{ position: 'absolute' as const, top: 3, right: 5, font: '700 8px JetBrains Mono', color: fg, opacity: .7 }}>÷2</span>
                              )}
                            </>
                          ) : '·'}
                        </button>
                      </td>
                    );
                  })}
                  <td style={{ ...mxCell, textAlign: 'right' as const, paddingRight: 12 }}>
                    <span style={{ font: '700 13px JetBrains Mono', color: total > 0 ? '#0F172A' : '#CBD5E1' }}>{total || '—'}</span>
                  </td>
                </tr>
              );
            })}
            <tr>
              <td style={{ ...mxCell, position: 'sticky' as const, left: 0, background: '#F8FAFC', zIndex: 2, paddingLeft: 14, borderRight: '1px solid #E2E8F0', borderTop: '2px solid #E2E8F0' }}>
                <span style={{ font: '700 11px Plus Jakarta Sans', letterSpacing: '.08em', textTransform: 'uppercase' as const, color: '#64748B' }}>Sinf yuki</span>
              </td>
              {classes.map((c: any) => {
                const code = typeof c === 'string' ? c : c.name;
                const sum = LC_SUBJECTS.reduce((s: any, sub: any) => s + (map[sub.id]?.[code]?.hours || 0), 0);
                const tone = sum > 36 ? '#DC2626' : sum > 30 ? '#D97706' : '#0D9488';
                return (
                  <td key={code} style={{ ...mxCell, textAlign: 'center' as const, borderTop: '2px solid #E2E8F0', background: '#F8FAFC' }}>
                    <span style={{ font: '800 12px JetBrains Mono', color: sum ? tone : '#CBD5E1' }}>{sum || '·'}</span>
                  </td>
                );
              })}
              <td style={{ ...mxCell, borderTop: '2px solid #E2E8F0', background: '#F8FAFC' }} />
            </tr>
          </tbody>
        </table>
      </div>
      <div style={{ padding: '10px 14px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex' as const, alignItems: 'center' as const, gap: 12, font: '500 11px Manrope', color: '#64748B' }}>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: '#4F46E5' }} />
        <span>Bir katakka soatlar — bosing va o'qituvchi tanlang. ÷2 — guruhli darslar. Pastdagi qator sinfning umumiy yuki.</span>
        <span style={{ marginLeft: 'auto', font: '500 11px JetBrains Mono', color: '#94A3B8' }}>shift+click — qatordagi barcha sinflarni teng to'ldirish</span>
      </div>
    </div>
  );
}

// ─── MatrixModal — wrap Matrix view in a fullscreen modal ───────────────────
export function MatrixModal({ rows, onClose }: any) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed' as const, inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 50,
      display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const, padding: 30,
    }} role="dialog">
      <div onClick={(e) => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 1280, maxHeight: '92vh',
        overflow: 'auto' as const, boxShadow: '0 24px 60px -16px rgba(15,23,42,0.32)', padding: 24,
      }}>
        <div style={{ display: 'flex' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 16 }}>
          <div>
            <div style={{ font: '500 11px Manrope', color: '#94A3B8' }}>Yagona ko'rinish</div>
            <div style={{ font: '800 20px Plus Jakarta Sans', color: '#0F172A' }}>Matritsa — sinf × fan</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, border: 0, background: '#F1F5F9', borderRadius: 8, cursor: 'pointer' as const }}>×</button>
        </div>
        <MatrixView rows={rows} classes={LC_CLASSES} />
      </div>
    </div>
  );
}
