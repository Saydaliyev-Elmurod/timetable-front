import React from 'react';
import { ClassChips, RoomChip, SubjectChip, TeacherChip } from './chips';
import {
  ClassPicker,
  GroupLabelInput,
  RoomPicker,
  SubjectPicker,
  TeacherPicker,
} from './pickers';
import { cellWrap2, iconBtn2, miniBtn2, miniIcon } from './ui';

// ─── DurationChips ───────────────────────────────────────────────────────────
export function DurationChips({ dur, onChange }: any) {
  const opts = [
    { v: 1, label: 'Yakka', desc: '1 soat', dots: 1 },
    { v: 2, label: 'Juftlik', desc: '2 soat ketma-ket', dots: 2 },
    { v: 3, label: 'Uchlik', desc: '3 soat ketma-ket', dots: 3 },
  ];
  return (
    <div style={{ display: 'flex' as const, gap: 3, padding: '2px 0' }}>
      {opts.map((o: any) => {
        const on = dur === o.v;
        return (
          <button key={o.v} onClick={() => onChange(o.v)} title={o.desc}
            style={{
              flex: 1, display: 'flex' as const, flexDirection: 'column' as const, alignItems: 'center' as const, gap: 3,
              padding: '5px 4px', borderRadius: 7, cursor: 'pointer' as const,
              border: on ? '1px solid #4F46E5' : '1px solid #E2E8F0',
              background: on ? '#EEF2FF' : '#fff',
            }}>
            <div style={{ display: 'flex' as const, gap: 2 }}>
              {Array.from({ length: o.dots }).map((_: any, i: any) => (
                <div key={i} style={{ width: 5, height: 5, borderRadius: 1.5, background: on ? '#4F46E5' : '#CBD5E1' }} />
              ))}
            </div>
            <span style={{ font: '700 10px Plus Jakarta Sans', color: on ? '#4338CA' : '#64748B', letterSpacing: '.02em' }}>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── GroupRow — one sub-group within a split lesson ──────────────────────────
export function GroupRow({ g, gi, total, subjectId, classes: _classes, onChange, onRemove, onAddBelow, openCell, onOpen, onClose }: any) {
  const tone = ['#4F46E5', '#0D9488', '#D97706', '#7C3AED', '#0EA5E9'][gi % 5];
  const tint = ['rgba(79,70,229,0.06)', 'rgba(20,184,166,0.07)', 'rgba(217,119,6,0.07)', 'rgba(124,58,237,0.07)', 'rgba(14,165,233,0.07)'][gi % 5];
  const [editing, setEditing] = React.useState(!g.label);

  return (
    <div style={{
      display: 'grid' as const, gridTemplateColumns: '14px 110px 1fr 22px',
      alignItems: 'center' as const, gap: 6, padding: '4px 6px', borderRadius: 8,
      background: tint,
    }}>
      <span style={{ width: 3, height: 18, borderRadius: 2, background: tone }} />
      {editing ? (
        <GroupLabelInput value={g.label} classes={_classes} onCommit={(v: any) => { onChange({ label: v }); setEditing(false); }} onClose={() => setEditing(false)} />
      ) : (
        <button onClick={() => setEditing(true)} style={{
          font: '700 10px Plus Jakarta Sans', letterSpacing: '.04em', textTransform: 'uppercase' as const,
          color: tone, background: 'transparent', border: '1px dashed transparent', borderRadius: 5,
          padding: '4px 6px', textAlign: 'left' as const, cursor: 'pointer' as const,
          overflow: 'hidden' as const, textOverflow: 'ellipsis' as const, whiteSpace: 'nowrap' as const,
        }} title="Guruh nomini tahrirlash">
          {g.label || '+ nom kiriting'}
        </button>
      )}
      <div style={{ position: 'relative' as const }}>
        <TeacherChip tid={g.tid} dense onClick={() => onOpen('gteacher-' + gi)} />
        {openCell?.field === 'gteacher-' + gi && (
          <TeacherPicker subjectId={subjectId} value={g.tid}
            onPick={(tid: any) => onChange({ tid })} onClose={onClose} />
        )}
      </div>
      <div style={{ display: 'flex' as const, flexDirection: 'column' as const, gap: 2 }}>
        {gi === total - 1 && (
          <button onClick={onAddBelow} title="Yana guruh qo'shish" style={miniIcon}>+</button>
        )}
        <button onClick={onRemove} title="Guruhni olib tashlash" style={miniIcon}>×</button>
      </div>
    </div>
  );
}

// ─── LessonRow — compact row used inside grouped accordion ───────────────────
export function LessonRow({ row, groupBy, onChange, onDup, onDelete, openCell, onOpen, onClose }: any) {
  const r = row;
  const isGroup = typeof r.teacher === 'object' && r.teacher && r.teacher.groups;
  const set = (patch: any) => onChange({ ...r, ...patch });
  const splitToGroups = () => {
    const baseTid = typeof r.teacher === 'string' ? r.teacher : '';
    set({
      teacher: {
        groups: [
          { label: '', tid: baseTid, room: r.room },
          { label: '', tid: '', room: '' },
        ],
      },
    });
  };
  const unsplit = () => {
    const g = r.teacher.groups[0];
    set({ teacher: g.tid || '', room: g.room || '' });
  };

  const errs = [];
  if (!r.subjectId) errs.push('Fan');
  if (!isGroup && !r.teacher) errs.push("O'qituvchi");
  if (isGroup && r.teacher.groups.some((g: any) => !g.tid || !g.label)) errs.push('Guruh');
  const ok = errs.length === 0;

  const showClass = groupBy !== 'class';
  const showSubj = groupBy !== 'subject';
  const showTeach = groupBy !== 'teacher';
  const showRoom = groupBy !== 'room';

  const cols = [
    showClass && '140px',
    showSubj && '180px',
    showTeach && '1fr',
    '90px',
    '170px',
    showRoom && '170px',
    '88px',
  ].filter(Boolean).join(' ');

  return (
    <div data-row-id={r.id} style={{
      display: 'grid' as const, gridTemplateColumns: cols,
      alignItems: 'stretch' as const, borderTop: '1px solid #F1F5F9',
      background: '#fff', transition: 'background 120ms',
    }}>
      {showClass && (
        <div style={cellWrap2}>
          <ClassChips classes={r.classes} onClick={() => onOpen(r.id, 'class')} />
          {openCell?.row === r.id && openCell.field === 'class' && (
            <ClassPicker values={r.classes} onChange={(v: any) => set({ classes: v })} onClose={onClose} />
          )}
        </div>
      )}
      {showSubj && (
        <div style={cellWrap2}>
          <SubjectChip subjectId={r.subjectId} onClick={() => onOpen(r.id, 'subject')} />
          {openCell?.row === r.id && openCell.field === 'subject' && (
            <SubjectPicker value={r.subjectId} onPick={(sid: any) => set({ subjectId: sid })} onClose={onClose} />
          )}
        </div>
      )}
      {showTeach && (
        <div style={{ ...cellWrap2, padding: '4px 4px' }}>
          {!isGroup ? (
            <div style={{ display: 'flex' as const, alignItems: 'center' as const, gap: 6, width: '100%' }}>
              <div style={{ flex: 1, minWidth: 0, position: 'relative' as const }}>
                <TeacherChip tid={r.teacher} onClick={() => onOpen(r.id, 'teacher')} />
                {openCell?.row === r.id && openCell.field === 'teacher' && (
                  <TeacherPicker subjectId={r.subjectId} value={r.teacher}
                    onPick={(tid: any) => set({ teacher: tid })} onClose={onClose}
                    contextLabel={r.classes[0] ? `${r.classes[0]} uchun` : ''} />
                )}
              </div>
              <button onClick={splitToGroups} title="Guruhga bo'lish" style={miniBtn2}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v18M4 9h16M4 15h16" /></svg>
                guruh
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex' as const, flexDirection: 'column' as const, gap: 4, width: '100%' }}>
              {r.teacher.groups.map((g: any, gi: any) => (
                <GroupRow key={gi} g={g} gi={gi} total={r.teacher.groups.length}
                  subjectId={r.subjectId} classes={r.classes}
                  openCell={openCell} onOpen={(f: any) => onOpen(r.id, f)} onClose={onClose}
                  onChange={(patch: any) => {
                    const groups = r.teacher.groups.map((gg: any, i: any) => i === gi ? { ...gg, ...patch } : gg);
                    set({ teacher: { groups } });
                  }}
                  onRemove={() => {
                    if (r.teacher.groups.length <= 2) { unsplit(); return; }
                    const groups = r.teacher.groups.filter((_: any, i: any) => i !== gi);
                    set({ teacher: { groups } });
                  }}
                  onAddBelow={() => {
                    const groups = [...r.teacher.groups, { label: '', tid: '', room: '' }];
                    set({ teacher: { groups } });
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
          onChange={(e: any) => set({ hours: Math.max(1, parseInt(e.target.value, 10) || 1) })}
          style={{
            width: '100%', font: '700 16px JetBrains Mono', color: '#0F172A',
            border: '1px solid transparent', borderRadius: 8,
            padding: '7px 10px', background: 'transparent', textAlign: 'center' as const,
            outline: 0,
          }}
        />
      </div>

      {/* Davomiyligi — chips 1/2/3 */}
      <div style={cellWrap2}>
        <DurationChips dur={r.dur || 1} onChange={(d: any) => set({ dur: d })} />
      </div>

      {/* Room */}
      {showRoom && (
        <div style={cellWrap2}>
          {!isGroup ? (
            <>
              <RoomChip rid={r.room} onClick={() => onOpen(r.id, 'room')} />
              {openCell?.row === r.id && openCell.field === 'room' && (
                <RoomPicker subjectId={r.subjectId} value={r.room}
                  onPick={(rid: any) => set({ room: rid })} onClose={onClose} />
              )}
            </>
          ) : (
            <div style={{ display: 'flex' as const, flexDirection: 'column' as const, gap: 4, width: '100%', padding: '2px 0' }}>
              {r.teacher.groups.map((g: any, gi: any) => (
                <div key={gi} style={{ position: 'relative' as const }}>
                  <RoomChip rid={g.room} onClick={() => onOpen(r.id, 'groom-' + gi)} />
                  {openCell?.row === r.id && openCell.field === 'groom-' + gi && (
                    <RoomPicker subjectId={r.subjectId} value={g.room}
                      onPick={(rid: any) => {
                        const groups = r.teacher.groups.map((gg: any, i: any) => i === gi ? { ...gg, room: rid } : gg);
                        set({ teacher: { groups } });
                      }} onClose={onClose} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Status / actions */}
      <div style={{ display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'flex-end' as const, gap: 2, padding: '0 8px', borderLeft: '1px solid #F1F5F9' }}>
        {ok ? (
          <span title="Tayyor" style={{ width: 18, height: 18, borderRadius: 999, background: '#F0FDFA', color: '#0D9488', display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
          </span>
        ) : (
          <span title={errs.join(' · ') + ' yetishmaydi'} style={{ width: 18, height: 18, borderRadius: 999, background: '#FEF3C7', color: '#D97706', display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const, font: '800 11px Plus Jakarta Sans' }}>!</span>
        )}
        <button onClick={onDup} title="Dublikat" style={iconBtn2}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
        </button>
        <button onClick={onDelete} title="O'chirish" style={iconBtn2}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
        </button>
      </div>
    </div>
  );
}
