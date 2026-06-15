import { useState, memo } from 'react';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { AvailState, getFullAvail, convertToApiFormat, convertFromApiFormat } from '@/lib/availability';
import type { ClassResponse } from '@/lib/classes';
import type { TeacherResponse } from '@/lib/teachers';
import type { RoomResponse } from '@/lib/rooms';
import { AvailGrid } from '../AvailGrid';
import { btnPrimary, btnSecondary, inp } from '../crudStyles';
import { API_DAY_SHORT } from '../types';

/**
 * Single source of truth for the Class create/edit/bulk-timeoff modal.
 *
 * Consumed by BOTH `ClassesPage` (management) and the timetable view's
 * `EntityEditorProvider`. Keep it presentational: it owns only its form state
 * and calls `onSave(data)` — the parent decides which service call to make
 * (create / update / createBulk / bulkTimeoff) so the modal stays identical
 * everywhere. Do NOT fork this for the timetable view.
 */
export type ClassEditorInitial =
  | ClassResponse
  | { new: true }
  | { bulkTimeoff: true }
  | null;

export interface ClassEditorProps {
  initial: ClassEditorInitial;
  periods: number[];
  days: string[];
  teachers: TeacherResponse[];
  rooms?: RoomResponse[];
  onClose: () => void;
  onSave: (data: unknown) => void;
}

function ClassEditorImpl({ initial, periods, days, teachers, rooms: _rooms, onClose, onSave }: ClassEditorProps) {
  const isEdit = !!initial && !('bulkTimeoff' in initial) && !('new' in initial);
  const isBulk = !!initial && 'bulkTimeoff' in initial;
  const isNew = !!initial && 'new' in initial;

  const init = initial as ClassResponse;

  const [entries, setEntries] = useState(() =>
    isEdit ? [{ name: init.name, shortName: init.shortName }] : [{ name: '', shortName: '' }]
  );
  const [teacherId, setTeacherId] = useState<string>(isEdit ? String(init.teacher?.id || '') : '');
  const [avail, setAvail] = useState<AvailState>(() =>
    isEdit ? convertFromApiFormat(init.availabilities, periods, days) : getFullAvail(periods, days)
  );

  const handleSave = () => {
    if (isBulk) {
      onSave({ availabilities: convertToApiFormat(avail) });
      return;
    }

    const filled = entries.filter(e => e.name.trim());
    if (filled.length === 0) {
      toast.error("Sinf nomini kiritish majburiy");
      return;
    }

    if (isEdit) {
      const e = filled[0];
      onSave({
        name: e.name.trim(),
        shortName: e.shortName.trim() || e.name.trim(),
        teacherId: teacherId ? parseInt(teacherId) : null,
        availabilities: convertToApiFormat(avail)
      });
    } else {
      const requests = filled.map(e => ({
        name: e.name.trim(),
        shortName: e.shortName.trim() || e.name.trim(),
        teacherId: teacherId ? parseInt(teacherId) : null,
        availabilities: convertToApiFormat(avail)
      }));
      onSave(requests);
    }
  };

  const addEntry = () => setEntries(prev => [...prev, { name: '', shortName: '' }]);
  const updateEntry = (i: number, patch: Partial<{ name: string; shortName: string }>) =>
    setEntries(prev => prev.map((e, idx) => idx === i ? { ...e, ...patch } : e));
  const removeEntry = (i: number) => setEntries(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: '#fff', width: '100%', maxWidth: 540, borderRadius: 24, boxShadow: '0 32px 64px -12px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', maxHeight: '92vh', overflow: 'hidden' }}>
        <header style={{ padding: '24px 28px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ font: '800 11px Plus Jakarta Sans', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{isBulk ? "Ommaviy tahrirlash" : "Sinf Ma'lumotlari"}</div>
            <h2 style={{ font: '800 22px Plus Jakarta Sans', color: '#0F172A', marginTop: 2 }}>{isBulk ? "Vaqtlarni o'zgartirish" : (isEdit ? entries[0].name : "Yangi sinf qo'shish")}</h2>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 12, border: 0, background: '#F1F5F9', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={20} />
          </button>
        </header>

        <div style={{ flex: 1, overflow: 'auto', padding: 28, display: 'flex', flexDirection: 'column', gap: 24 }} className="et-premium-scrollbar">
          {!isBulk && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {entries.map((e, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr' + (isNew && entries.length > 1 ? ' 44px' : ''), gap: 12, alignItems: 'flex-end' }}>
                    <div>
                      {i === 0 && <label style={{ font: '700 12px Manrope', color: '#64748B', display: 'block', marginBottom: 8 }}>Sinf nomi *</label>}
                      <input value={e.name} onChange={ev => updateEntry(i, { name: ev.target.value })} style={inp} placeholder="Masalan: 10-A" autoFocus={i === 0} />
                    </div>
                    <div>
                      {i === 0 && <label style={{ font: '700 12px Manrope', color: '#64748B', display: 'block', marginBottom: 8 }}>Qisqa nomi</label>}
                      <input value={e.shortName} onChange={ev => updateEntry(i, { shortName: ev.target.value.toUpperCase() })} style={{ ...inp, fontFamily: 'JetBrains Mono' }} placeholder="10A" />
                    </div>
                    {isNew && entries.length > 1 && (
                      <button onClick={() => removeEntry(i)} style={{ width: 42, height: 42, borderRadius: 12, border: '1.5px solid #E2E8F0', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}

                {isNew && (
                  <button onClick={addEntry} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, font: '700 13px Manrope', color: '#4F46E5', background: '#EEF2FF', border: '1.5px dashed #C7D2FE', padding: '10px 16px', borderRadius: 12, marginTop: 4, cursor: 'pointer' }}>
                    <Plus size={16} /> Yangi sinf
                  </button>
                )}
              </div>

              <div>
                <label style={{ font: '700 12px Manrope', color: '#64748B', display: 'block', marginBottom: 8 }}>Sinf rahbari</label>
                <select
                  value={teacherId}
                  onChange={e => setTeacherId(e.target.value)}
                  style={{ ...inp, appearance: 'none', background: '#fff' }}
                >
                  <option value="">Tanlanmagan</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.fullName}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label style={{ font: '700 12px Manrope', color: '#64748B', display: 'block', marginBottom: 8 }}>Mavjud dars soatlari</label>
            <div style={{ background: '#FAFBFD', border: '1px solid #F1F5F9', borderRadius: 16, padding: 16 }}>
              <AvailGrid avail={avail} periods={periods} days={days} onChange={setAvail} dayLabel={(d) => API_DAY_SHORT[d] || d.slice(0, 3)} />
            </div>
          </div>
        </div>

        <footer style={{ padding: '20px 28px', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 12, justifyContent: 'flex-end', background: '#FAFBFD' }}>
          <button onClick={onClose} style={btnSecondary}>Bekor</button>
          <button onClick={handleSave} style={btnPrimary}>
            {isBulk ? "Hammasiga qo'llash" : (isEdit ? "Saqlash" : (entries.length > 1 ? "Barchasini qo'shish" : "Qo'shish"))}
          </button>
        </footer>
      </div>
    </div>
  );
}

export const ClassEditor = memo(ClassEditorImpl);
