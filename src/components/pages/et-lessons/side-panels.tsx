import React from 'react';
import { computeTeacherLoad, subjById, subjColors, teacherById } from './catalog';
import { Field, Section, drawerInp, ghostBtnT, primaryBtnT } from './ui';

// ─── SidePanel — live validation + teacher load + class hours summary ───────

export function SidePanel({ rows, filterClasses: _filterClasses }: any) {
  const teacherLoad = computeTeacherLoad(rows);

  const classHours: Record<string, number> = {};
  for (const r of rows) {
    for (const c of r.classes) {
      classHours[c] = (classHours[c] || 0) + (r.hours || 0);
    }
  }

  const issues: Array<{ id: any; kind: string; msg: string }> = [];
  for (const r of rows) {
    if (!r.classes.length) issues.push({ id: r.id, kind: 'err', msg: 'Sinfsiz dars qatori' });
    if (!r.subjectId) issues.push({ id: r.id, kind: 'err', msg: 'Fan tanlanmagan' });
    if (!r.teacher || (typeof r.teacher === 'object' && r.teacher.groups?.some((g: any) => !g.tid))) {
      issues.push({ id: r.id, kind: 'err', msg: "O'qituvchi yetishmaydi" });
    }
  }
  Object.entries(teacherLoad).forEach(([tid, load]) => {
    const t = teacherById(tid);
    if (t && load > t.cap) issues.push({ id: 't' + tid, kind: 'warn', msg: `${t.name} — yuk ${load}/${t.cap}h (oshib ketgan)` });
  });

  return (
    <aside style={{
      width: 300, flexShrink: 0, background: '#fff', borderLeft: '1px solid #E2E8F0',
      display: 'flex' as const, flexDirection: 'column' as const, overflow: 'hidden' as const, fontFamily: 'Manrope',
    }}>
      <div style={{ padding: '18px 18px 12px' }}>
        <div style={{ font: '700 11px Plus Jakarta Sans', letterSpacing: '.12em', textTransform: 'uppercase' as const, color: '#4338CA' }}>Tekshiruv</div>
        <div style={{ font: '800 22px Plus Jakarta Sans', color: '#0F172A', marginTop: 4, letterSpacing: '-0.01em' }}>
          {issues.length === 0
            ? <span style={{ color: '#0D9488' }}>Hammasi joyida</span>
            : <>{issues.length} ta <span style={{ color: '#64748B', font: '600 13px Manrope', verticalAlign: 'middle', marginLeft: 4 }}>tekshirish kerak</span></>}
        </div>
      </div>

      <div style={{ overflowY: 'auto' as const, flex: 1, padding: '0 14px 18px' }}>
        {issues.length > 0 && (
          <Section title="Muammolar">
            <div style={{ display: 'flex' as const, flexDirection: 'column' as const, gap: 6 }}>
              {issues.slice(0, 5).map((it: any, i: any) => (
                <div key={i} style={{
                  display: 'flex' as const, alignItems: 'flex-start' as const, gap: 8,
                  padding: '8px 10px', borderRadius: 8,
                  background: it.kind === 'err' ? '#FEF2F2' : '#FFFBEB',
                  border: '1px solid ' + (it.kind === 'err' ? '#FECACA' : '#FDE68A'),
                }}>
                  <span style={{
                    width: 16, height: 16, borderRadius: 999, flexShrink: 0, marginTop: 1,
                    background: it.kind === 'err' ? '#EF4444' : '#F59E0B', color: '#fff',
                    display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const, font: '800 10px Plus Jakarta Sans',
                  }}>!</span>
                  <span style={{ font: '500 12px Manrope', color: '#0F172A' }}>{it.msg}</span>
                </div>
              ))}
              {issues.length > 5 && (
                <div style={{ font: '500 11px Manrope', color: '#94A3B8', textAlign: 'center' as const, padding: 4 }}>… va {issues.length - 5} tasi yana</div>
              )}
            </div>
          </Section>
        )}

        <Section title="Sinflar bo'yicha haftalik soat">
          <div style={{ display: 'flex' as const, flexDirection: 'column' as const, gap: 5 }}>
            {Object.entries(classHours).slice(0, 8).map(([c, h]) => {
              const max = 36;
              const tone = h > max ? '#EF4444' : h > 30 ? '#F59E0B' : '#4F46E5';
              return (
                <div key={c} style={{ display: 'grid' as const, gridTemplateColumns: '48px 1fr 42px', alignItems: 'center' as const, gap: 8 }}>
                  <span style={{ font: '700 11px JetBrains Mono', color: '#475569' }}>{c}</span>
                  <span style={{ height: 6, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' as const }}>
                    <span style={{ display: 'block' as const, height: '100%', width: Math.min(100, (h / max) * 100) + '%', background: tone, borderRadius: 3 }} />
                  </span>
                  <span style={{ font: '700 12px JetBrains Mono', color: tone, textAlign: 'right' as const }}>{h}h</span>
                </div>
              );
            })}
          </div>
        </Section>

        <Section title="O'qituvchi yuki" subTitle="kiritilgan darslar bo'yicha">
          <div style={{ display: 'flex' as const, flexDirection: 'column' as const, gap: 6 }}>
            {Object.entries(teacherLoad).sort((a: any, b: any) => b[1] - a[1]).slice(0, 7).map(([tid, load]) => {
              const t = teacherById(tid);
              if (!t) return null;
              const ratio = load / t.cap;
              const tone = ratio > 1 ? '#EF4444' : ratio >= 0.9 ? '#F59E0B' : '#0D9488';
              return (
                <div key={tid} style={{ display: 'grid' as const, gridTemplateColumns: '24px 1fr 50px', alignItems: 'center' as const, gap: 8 }}>
                  <span style={{ width: 22, height: 22, borderRadius: 999, background: t.tone, color: '#fff', font: '800 10px Plus Jakarta Sans', display: 'inline-flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const, letterSpacing: '-0.02em' }}>{t.avatar}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ font: '600 12px Manrope', color: '#0F172A', overflow: 'hidden' as const, textOverflow: 'ellipsis' as const, whiteSpace: 'nowrap' as const }}>{t.name}</div>
                    <span style={{ display: 'block' as const, height: 4, background: '#F1F5F9', borderRadius: 2, overflow: 'hidden' as const, marginTop: 2 }}>
                      <span style={{ display: 'block' as const, height: '100%', width: Math.min(100, ratio * 100) + '%', background: tone, borderRadius: 2 }} />
                    </span>
                  </div>
                  <span style={{ font: '700 11px JetBrains Mono', color: tone, textAlign: 'right' as const }}>{load}/{t.cap}</span>
                </div>
              );
            })}
          </div>
        </Section>
      </div>
    </aside>
  );
}

// ─── EditClassDrawer ─────────────────────────────────────────────────────────

export function EditClassDrawer({ classId, rows, onClose }: any) {
  const lessonsOfClass = rows.filter((r: any) => r.classes.includes(classId));
  const totalHours = lessonsOfClass.reduce((s: any, r: any) => s + (r.hours || 0), 0);
  return (
    <div onClick={onClose} style={{
      position: 'fixed' as const, inset: 0, background: 'rgba(15,23,42,0.32)', zIndex: 50,
      display: 'flex' as const, justifyContent: 'flex-end' as const,
    }} role="dialog">
      <aside onClick={(e) => e.stopPropagation()} style={{
        width: 420, height: '100%', background: '#fff', boxShadow: '-10px 0 30px -10px rgba(15,23,42,0.18)',
        display: 'flex' as const, flexDirection: 'column' as const,
      }}>
        <header style={{ padding: '20px 22px', borderBottom: '1px solid #E2E8F0', display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const }}>
          <div>
            <div style={{ font: '500 11px Manrope', color: '#94A3B8' }}>Sinfni tahrirlash</div>
            <div style={{ font: '800 22px Plus Jakarta Sans', color: '#0F172A', marginTop: 1 }}>{classId}</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, border: 0, background: '#F1F5F9', borderRadius: 8, cursor: 'pointer' as const, color: '#475569' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: 'block' as const, margin: 'auto' }}><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </header>
        <div style={{ flex: 1, overflow: 'auto' as const, padding: '18px 22px', display: 'flex' as const, flexDirection: 'column' as const, gap: 18 }}>
          <Field label="Sinf nomi">
            <input defaultValue={classId} style={drawerInp} />
          </Field>
          <div style={{ display: 'grid' as const, gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="O'quvchilar"><input defaultValue="28" style={drawerInp} /></Field>
            <Field label="Sinf rahbari"><input defaultValue="" placeholder="Tanlang..." style={drawerInp} /></Field>
          </div>
          <Field label="Eslatma">
            <textarea rows={3} placeholder="Maxsus shartlar..." style={{ ...drawerInp, resize: 'vertical', font: '500 13px Manrope', padding: '10px 12px' }} />
          </Field>
          <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 14 }}>
            <div style={{ display: 'flex' as const, justifyContent: 'space-between' as const, marginBottom: 10 }}>
              <div style={{ font: '700 13px Plus Jakarta Sans', color: '#0F172A' }}>Joriy yuk</div>
              <div style={{ font: '700 13px JetBrains Mono', color: '#475569' }}>{lessonsOfClass.length} dars · {totalHours}h</div>
            </div>
            <div style={{ display: 'flex' as const, flexDirection: 'column' as const, gap: 6 }}>
              {lessonsOfClass.slice(0, 8).map((r: any) => {
                const s = subjById(r.subjectId);
                const [_bg, _fg, bar] = s ? subjColors(s) : ['#F1F5F9', '#475569', '#94A3B8'];
                return (
                  <div key={r.id} style={{ display: 'flex' as const, alignItems: 'center' as const, gap: 10, padding: '8px 10px', background: '#F8FAFC', borderRadius: 8 }}>
                    <span style={{ width: 22, height: 22, borderRadius: 5, background: bar, color: '#fff', font: '800 10px Plus Jakarta Sans', display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const }}>{s?.short[0] || '?'}</span>
                    <span style={{ flex: 1, font: '600 12px Manrope', color: '#0F172A' }}>{s?.name || "Fan yo'q"}</span>
                    <span style={{ font: '700 11px JetBrains Mono', color: '#64748B' }}>{r.hours}h</span>
                    <span style={{ font: '600 10px Plus Jakarta Sans', color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '.05em' }}>{['', 'yakka', 'juftlik', 'uchlik'][r.dur || 1]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <footer style={{ padding: 14, borderTop: '1px solid #E2E8F0', display: 'flex' as const, gap: 8, justifyContent: 'flex-end' as const }}>
          <button onClick={onClose} style={ghostBtnT}>Bekor</button>
          <button onClick={onClose} style={primaryBtnT}>Saqlash</button>
        </footer>
      </aside>
    </div>
  );
}
