import React from 'react';
import { roomById, subjById, subjColors, teacherById } from './catalog';
import { Field, drawerInp, ghostBtnT, primaryBtnT } from './ui';

// ─── Edit drawers (class / teacher / subject / room) ───────────────────────
//
// One drawer for every group dimension: edit the entity's fields and review the
// lessons it appears in. `EditEntityDrawer` switches the editable fields by
// `kind`; the shell, lesson-load list, and footer are shared.

const rowHasTeacher = (r: any, tid: any) =>
  typeof r.teacher === 'string' ? r.teacher === tid : !!r.teacher?.groups?.some((g: any) => g.tid === tid);

const rowHasRoom = (r: any, rid: any) =>
  typeof r.teacher === 'string' ? r.room === rid : !!r.teacher?.groups?.some((g: any) => g.room === rid);

const durLabel = (d: any) => ['', 'yakka', 'juftlik', 'uchlik'][d || 1] || `${d}lik`;

function DrawerShell({ eyebrow, title, onClose, onSave, saving, children }: any) {
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
            <div style={{ font: '500 11px Manrope', color: '#94A3B8' }}>{eyebrow}</div>
            <div style={{ font: '800 22px Plus Jakarta Sans', color: '#0F172A', marginTop: 1 }}>{title}</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, border: 0, background: '#F1F5F9', borderRadius: 8, cursor: 'pointer' as const, color: '#475569' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: 'block' as const, margin: 'auto' }}><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </header>
        <div style={{ flex: 1, overflow: 'auto' as const, padding: '18px 22px', display: 'flex' as const, flexDirection: 'column' as const, gap: 18 }}>
          {children}
        </div>
        <footer style={{ padding: 14, borderTop: '1px solid #E2E8F0', display: 'flex' as const, gap: 8, justifyContent: 'flex-end' as const }}>
          <button onClick={onClose} disabled={saving} style={ghostBtnT}>Bekor</button>
          <button onClick={onSave || onClose} disabled={saving} style={{ ...primaryBtnT, opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saqlanmoqda…' : 'Saqlash'}
          </button>
        </footer>
      </aside>
    </div>
  );
}

function LessonLoadList({ lessons }: any) {
  const totalHours = lessons.reduce((s: any, r: any) => s + (r.hours || 0), 0);
  return (
    <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 14 }}>
      <div style={{ display: 'flex' as const, justifyContent: 'space-between' as const, marginBottom: 10 }}>
        <div style={{ font: '700 13px Plus Jakarta Sans', color: '#0F172A' }}>Joriy yuk</div>
        <div style={{ font: '700 13px JetBrains Mono', color: '#475569' }}>{lessons.length} dars · {totalHours}h</div>
      </div>
      <div style={{ display: 'flex' as const, flexDirection: 'column' as const, gap: 6 }}>
        {lessons.slice(0, 10).map((r: any) => {
          const s = subjById(r.subjectId);
          const [_bg, _fg, bar] = s ? subjColors(s) : ['#F1F5F9', '#475569', '#94A3B8'];
          const cls = (r.classes || []).join(', ');
          return (
            <div key={r.id} style={{ display: 'flex' as const, alignItems: 'center' as const, gap: 10, padding: '8px 10px', background: '#F8FAFC', borderRadius: 8 }}>
              <span style={{ width: 22, height: 22, borderRadius: 5, background: bar, color: '#fff', font: '800 10px Plus Jakarta Sans', display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const, flexShrink: 0 }}>{s?.short[0] || '?'}</span>
              <span style={{ flex: 1, minWidth: 0, font: '600 12px Manrope', color: '#0F172A', overflow: 'hidden' as const, textOverflow: 'ellipsis' as const, whiteSpace: 'nowrap' as const }}>
                {s?.name || "Fan yo'q"}{cls && <span style={{ color: '#94A3B8', fontWeight: 500 }}> · {cls}</span>}
              </span>
              <span style={{ font: '700 11px JetBrains Mono', color: '#64748B' }}>{r.hours}h</span>
              <span style={{ font: '600 10px Plus Jakarta Sans', color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '.05em' }}>{durLabel(r.dur)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Per-kind drawer config: eyebrow, lessons selector, initial form (prefilled
// from the resolved backend entity when available, else the catalog/Et shape),
// and the editable fields. Save merges the form into the full entity in
// LessonsPage (`onEntitySave`) so non-edited backend fields are preserved.
const ENTITY_CONFIG: Record<string, any> = {
  teacher: {
    eyebrow: "O'qituvchini tahrirlash",
    lessonsOf: (rows: any, key: any) => rows.filter((r: any) => rowHasTeacher(r, key)),
    title: (e: any, key: any) => e?.fullName || teacherById(key)?.name || key,
    init: (e: any, key: any) => ({
      fullName: e?.fullName ?? teacherById(key)?.name ?? '',
      shortName: e?.shortName ?? '',
    }),
    fields: (form: any, set: any) => (
      <>
        <Field label="Ism familiya"><input value={form.fullName} onChange={(ev) => set('fullName', ev.target.value)} style={drawerInp} /></Field>
        <Field label="Qisqartma"><input value={form.shortName} onChange={(ev) => set('shortName', ev.target.value)} style={drawerInp} /></Field>
      </>
    ),
  },
  subject: {
    eyebrow: 'Fanni tahrirlash',
    lessonsOf: (rows: any, key: any) => rows.filter((r: any) => r.subjectId === key),
    title: (e: any, key: any) => e?.name || subjById(key)?.name || key,
    init: (e: any, key: any) => ({
      name: e?.name ?? subjById(key)?.name ?? '',
      shortName: e?.shortName ?? subjById(key)?.short ?? '',
    }),
    fields: (form: any, set: any) => (
      <>
        <Field label="Fan nomi"><input value={form.name} onChange={(ev) => set('name', ev.target.value)} style={drawerInp} /></Field>
        <Field label="Qisqartma"><input value={form.shortName} onChange={(ev) => set('shortName', ev.target.value)} style={drawerInp} /></Field>
      </>
    ),
  },
  room: {
    eyebrow: 'Xonani tahrirlash',
    lessonsOf: (rows: any, key: any) => rows.filter((r: any) => rowHasRoom(r, key)),
    title: (e: any, key: any) => e?.name || roomById(key)?.no || key,
    init: (e: any, key: any) => ({
      name: e?.name ?? roomById(key)?.no ?? '',
      type: e?.type ?? 'SHARED',
    }),
    fields: (form: any, set: any) => (
      <>
        <Field label="Xona nomi"><input value={form.name} onChange={(ev) => set('name', ev.target.value)} style={drawerInp} /></Field>
        <Field label="Turi">
          <select value={form.type} onChange={(ev) => set('type', ev.target.value)} style={drawerInp}>
            <option value="SHARED">Umumiy</option>
            <option value="SPECIAL">Maxsus</option>
          </select>
        </Field>
      </>
    ),
  },
  class: {
    eyebrow: 'Sinfni tahrirlash',
    lessonsOf: (rows: any, key: any) => rows.filter((r: any) => r.classes.includes(key)),
    title: (e: any, key: any) => e?.name || key,
    init: (e: any, key: any) => ({ name: e?.name ?? key }),
    fields: (form: any, set: any) => (
      <Field label="Sinf nomi"><input value={form.name} onChange={(ev) => set('name', ev.target.value)} style={drawerInp} /></Field>
    ),
  },
};

export function EditEntityDrawer({ kind, entityKey, rows, resolveEntity, onEntitySave, onClose }: any) {
  const cfg = ENTITY_CONFIG[kind] || ENTITY_CONFIG.class;
  const entity = resolveEntity ? resolveEntity(kind, entityKey) : null;
  const [form, setForm] = React.useState<any>(() => cfg.init(entity, entityKey));
  const [saving, setSaving] = React.useState(false);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const lessons = cfg.lessonsOf(rows, entityKey);

  const handleSave = async () => {
    if (!onEntitySave) { onClose(); return; }
    setSaving(true);
    const ok = await onEntitySave(kind, entityKey, form);
    setSaving(false);
    if (ok !== false) onClose();
  };

  return (
    <DrawerShell eyebrow={cfg.eyebrow} title={cfg.title(entity, entityKey)} onClose={onClose} onSave={handleSave} saving={saving}>
      {cfg.fields(form, set)}
      <LessonLoadList lessons={lessons} />
    </DrawerShell>
  );
}
