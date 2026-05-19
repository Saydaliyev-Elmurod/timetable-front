import React from 'react';
import {
  LC_CLASSES,
  LC_ROOMS,
  LC_SUBJECT_BY_ID,
  LC_SUBJECTS,
  LC_TEACHER_BY_ID,
  LC_TEACHERS,
} from './et-lessons/catalog';
import {
  GROUP_TABS,
  GroupedView,
  computeGroups,
  tabIcon,
  tabPlaceholder,
} from './et-lessons/GroupedView';
import { MatrixModal } from './et-lessons/MatrixView';
import { BulkPasteModal, DesignNotes, TemplatesModal } from './et-lessons/modals';
import { EditClassDrawer, SidePanel } from './et-lessons/side-panels';
import { Stat, ghostBtnT, primaryBtnT } from './et-lessons/ui';

// Re-export catalog initializer + types so external callers keep the same import surface.
export { initLessonsData } from './et-lessons/catalog';
export type {
  EtClass,
  EtClassGroup,
  EtGroupAssignment,
  EtLessonRow,
  EtRoom,
  EtSubject,
  EtTeacher,
  EtTeacherValue,
} from './et-lessons/types';

function LessonsPage({
  onSave,
  onRowsChange,
  subjects = [],
  teachers = [],
  rooms = [],
  classes = [],
  initialLessons = [],
}: any) {
  // Sync module-level catalog whenever props change. The catalog has to be a
  // mutable singleton because every picker/chip reads through it.
  React.useEffect(() => {
    // Mutating the exported `let` bindings in catalog.ts is intentional —
    // these are the singleton-stores the pickers read from.
    (LC_SUBJECTS as any).length = 0;
    subjects.forEach((s: any) => (LC_SUBJECTS as any).push(s));
    Object.keys(LC_SUBJECT_BY_ID).forEach((k) => delete (LC_SUBJECT_BY_ID as any)[k]);
    subjects.forEach((s: any) => ((LC_SUBJECT_BY_ID as any)[s.id] = s));

    (LC_TEACHERS as any).length = 0;
    teachers.forEach((t: any) => (LC_TEACHERS as any).push(t));
    Object.keys(LC_TEACHER_BY_ID).forEach((k) => delete (LC_TEACHER_BY_ID as any)[k]);
    teachers.forEach((t: any) => ((LC_TEACHER_BY_ID as any)[t.id] = t));

    (LC_ROOMS as any).length = 0;
    rooms.forEach((r: any) => (LC_ROOMS as any).push(r));

    (LC_CLASSES as any).length = 0;
    classes
      .map((c: any) => (typeof c === 'string' ? { name: c, groups: [] } : c))
      .forEach((c: any) => (LC_CLASSES as any).push(c));
  }, [subjects, teachers, rooms, classes]);

  const seed = React.useMemo(
    () => initialLessons.map((r: any) => ({ ...r, dur: r.dur || 1 })),
    [initialLessons],
  );
  const [rows, setRows] = React.useState<any[]>(seed);
  React.useEffect(() => { setRows(seed); }, [seed]);

  const [groupBy, setGroupBy] = React.useState<string>('class');
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const [openCell, setOpenCell] = React.useState<{ row: any; field: string } | null>(null);
  const [query, setQuery] = React.useState('');
  const [showPaste, setShowPaste] = React.useState(false);
  const [showTmpl, setShowTmpl] = React.useState(false);
  const [showNotes, setShowNotes] = React.useState(false);
  const [editClass, setEditClass] = React.useState<string | null>(null);
  const [showMatrix, setShowMatrix] = React.useState(false);

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
    const next = [...rs.slice(0, i + 1), { ...rs[i], id: 'L' + Date.now() }, ...rs.slice(i + 1)];
    notifyChanges(next);
    return next;
  });
  const delRow = (id: any) => setRows((rs: any) => {
    const next = rs.filter((r: any) => r.id !== id);
    notifyChanges(next);
    return next;
  });

  // Add lesson contextually — pre-fills group dimension.
  const addToGroup = (gBy: any, key: any) => {
    const blank: any = {
      id: 'L' + Date.now(),
      classes: [], subjectId: '', teacher: '', room: '', hours: 1, dur: 1,
    };
    if (gBy === 'class') blank.classes = [key];
    if (gBy === 'subject') blank.subjectId = key;
    if (gBy === 'teacher') blank.teacher = key;
    if (gBy === 'room') blank.room = key;
    setRows((rs: any) => {
      const next = [blank, ...rs];
      notifyChanges(next);
      return next;
    });
    const n = new Set(expanded);
    n.add(key);
    setExpanded(n);
    setTimeout(() => setOpenCell({ row: blank.id, field: gBy === 'subject' ? 'teacher' : 'subject' }), 60);
  };

  const addLooseRow = () => {
    const blank = { id: 'L' + Date.now(), classes: [], subjectId: '', teacher: '', room: '', hours: 1, dur: 1 };
    setRows((rs: any) => {
      const next = [blank, ...rs];
      notifyChanges(next);
      return next;
    });
    setTimeout(() => setOpenCell({ row: blank.id, field: 'class' }), 60);
  };

  const applyPaste = (parsed: any) => {
    const out = parsed.map((p: any, i: any) => {
      const sub = LC_SUBJECTS.find((s) => s.name === p.subject || s.short === p.subject);
      const tch = LC_TEACHERS.find((t) => t.name === p.teacher);
      const rm = LC_ROOMS.find((r) => r.no === p.room);
      let dur = 1;
      if (p.block === '2') dur = 2;
      else if (p.block === '3') dur = 3;
      else if (p.block && p.block.includes('+')) dur = parseInt(p.block.split('+')[0], 10) || 1;
      return {
        id: 'L' + Date.now() + '_' + i,
        classes: p.classes,
        subjectId: sub?.id || '',
        teacher: tch?.id || '',
        room: rm?.id || '',
        hours: p.hours,
        dur,
      };
    });
    setRows((rs: any) => [...out, ...rs]);
  };

  const applyTemplate = (T: any, classNames: any) => {
    const out = T.subs.map(([sid, hrs, blk, flag]: any, i: number) => {
      let dur = 1;
      if (blk === '2') dur = 2;
      else if (blk === '3') dur = 3;
      else if (blk?.includes('+')) dur = parseInt(blk.split('+')[0], 10) || 1;
      const teach = flag === 'GROUP'
        ? { groups: [{ label: '', tid: '', room: '' }, { label: '', tid: '', room: '' }] }
        : '';
      return { id: 'L' + Date.now() + '_' + i, classes: classNames, subjectId: sid, teacher: teach, room: '', hours: hrs, dur };
    });
    setRows((rs: any) => [...out, ...rs]);
  };

  // Click-outside picker close.
  React.useEffect(() => {
    if (!openCell) return;
    const onDoc = (e: any) => {
      if (!e.target.closest('[data-row-id]') && !e.target.closest('[role="dialog"]')) {
        setOpenCell(null);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [openCell]);

  const totalLessons = rows.length;
  const totalHours = rows.reduce((s: any, r: any) => s + (r.hours || 0), 0);
  const totalIncomplete = rows.filter((r: any) =>
    !r.subjectId
      || (typeof r.teacher === 'string'
        ? !r.teacher
        : r.teacher.groups.some((g: any) => !g.tid || !g.label))
  ).length;

  return (
    <div style={{ display: 'flex' as const, height: '100vh', overflow: 'hidden' as const }}>
      <main style={{ flex: 1, minWidth: 0, display: 'flex' as const, flexDirection: 'column' as const, background: '#F8FAFC' }}>
        {/* Topbar */}
        <header style={{
          background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '14px 26px',
          display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, flexShrink: 0,
        }}>
          <div>
            <div style={{ font: '500 11px Manrope', color: '#94A3B8', letterSpacing: '.02em' }}>2025–2026 · Kuzgi semestr</div>
            <div style={{ font: '800 24px Plus Jakarta Sans', color: '#0F172A', letterSpacing: '-0.02em', marginTop: 1 }}>Darslar</div>
            <div style={{ font: '500 12px Manrope', color: '#94A3B8', marginTop: 3 }}>
              Har bir sinf/o'qituvchi uchun fan, soat va davomiyligini kiriting
            </div>
          </div>
          <div style={{ display: 'flex' as const, alignItems: 'center' as const, gap: 8 }}>
            <div style={{ display: 'flex' as const, gap: 10, alignItems: 'center' as const, marginRight: 6 }}>
              <Stat label="darslar" val={totalLessons} />
              <Stat label="haftalik soat" val={totalHours} />
              <Stat label="tugallanmagan" val={totalIncomplete} warn={totalIncomplete > 0} />
            </div>
            <span style={{ width: 1, height: 24, background: '#E2E8F0' }} />
            <button onClick={() => setShowTmpl(true)} style={ghostBtnT}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
              Shablon
            </button>
            <button onClick={() => setShowPaste(true)} style={ghostBtnT}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /></svg>
              Excel'dan
            </button>
            <button onClick={() => setShowMatrix(true)} style={ghostBtnT}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18M15 3v18" /></svg>
              Matritsa
            </button>
            <button onClick={() => setShowNotes(true)} style={{ ...ghostBtnT, background: '#F8FAFC' }} title="UX logikasi">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
              UX logika
            </button>
            <button style={primaryBtnT} onClick={() => onSave && onSave(rows)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
              Saqlash
            </button>
          </div>
        </header>

        {/* Body */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' as const }}>
          <div style={{ maxWidth: 1380, margin: '0 auto', padding: '22px 26px 80px' }}>

            {/* Group-by tabs (segmented) */}
            <div style={{
              display: 'grid' as const, gridTemplateColumns: 'repeat(4, 1fr)', gap: 0,
              background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: 4,
              marginBottom: 16, boxShadow: '0 1px 2px rgba(15,23,42,0.03)',
            }}>
              {GROUP_TABS.map((t: any) => {
                const on = groupBy === t.id;
                const count = computeGroups(rows, t.id).length;
                return (
                  <button key={t.id} onClick={() => { setGroupBy(t.id); setExpanded(new Set()); }}
                    style={{
                      display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 9,
                      padding: '12px 14px',
                      font: '700 13px Plus Jakarta Sans', letterSpacing: '-0.005em',
                      color: on ? '#0F172A' : '#64748B',
                      background: on ? '#F8FAFC' : 'transparent',
                      border: 0, borderRadius: 10, cursor: 'pointer' as const,
                      boxShadow: on ? '0 1px 2px rgba(15,23,42,0.04), inset 0 0 0 1px #E2E8F0' : 'none',
                      transition: 'all 140ms ease',
                    }}>
                    {tabIcon(t.id, on)}
                    {t.label}
                    <span style={{
                      font: '700 10px JetBrains Mono',
                      color: on ? '#4338CA' : '#94A3B8',
                      background: on ? '#EEF2FF' : '#F1F5F9',
                      padding: '2px 6px', borderRadius: 5,
                    }}>{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Action bar */}
            <div style={{ display: 'flex' as const, alignItems: 'center' as const, gap: 10, marginBottom: 14 }}>
              <button onClick={addLooseRow} style={{
                display: 'inline-flex' as const, alignItems: 'center' as const, gap: 7,
                font: '700 13px Manrope', color: '#fff', background: '#0F172A',
                border: 0, padding: '10px 16px', borderRadius: 10, cursor: 'pointer' as const,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                Yangi dars
              </button>
              <div style={{
                flex: 1, display: 'flex' as const, alignItems: 'center' as const, gap: 8,
                background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: '0 12px',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                <input value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder={`${tabPlaceholder(groupBy)} bo'yicha qidirish...`}
                  style={{ flex: 1, border: 0, outline: 0, padding: '11px 0', font: '500 13px Manrope', color: '#0F172A', background: 'transparent' }} />
                {query && (
                  <button onClick={() => setQuery('')} style={{ width: 22, height: 22, border: 0, background: '#F1F5F9', borderRadius: 5, color: '#64748B', cursor: 'pointer' as const }}>×</button>
                )}
              </div>
              <button onClick={() => setExpanded(new Set(computeGroups(rows, groupBy).map((g) => g.key)))} style={ghostBtnT}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                Barchasini yoyish
              </button>
              <button onClick={() => setExpanded(new Set())} style={ghostBtnT}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15" /></svg>
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
              onOpen={(rid: any, f: any) => setOpenCell({ row: rid, field: f })}
              onClose={() => setOpenCell(null)}
              query={query}
            />
          </div>
        </div>
      </main>

      <SidePanel rows={rows} filterClasses={[]} />

      {showPaste && <BulkPasteModal onClose={() => setShowPaste(false)} onApply={applyPaste} />}
      {showTmpl && <TemplatesModal onClose={() => setShowTmpl(false)} onApply={applyTemplate} />}
      <DesignNotes open={showNotes} onClose={() => setShowNotes(false)} />
      {editClass && <EditClassDrawer classId={editClass} rows={rows} onClose={() => setEditClass(null)} />}
      {showMatrix && <MatrixModal rows={rows} onClose={() => setShowMatrix(false)} />}
    </div>
  );
}

export default LessonsPage;
