import { useState, memo } from 'react';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { AvailState, getFullAvail, convertToApiFormat, convertFromApiFormat } from '@/lib/availability';
import type { TeacherResponse } from '@/lib/teachers';
import type { SubjectResponse } from '@/lib/subjects';
import { AvailGrid } from '../AvailGrid';
import { btnPrimary, btnSecondary, inp } from '../crudStyles';
import { API_DAY_SHORT } from '../types';

/**
 * Single source of truth for the Teacher create/edit/bulk-timeoff modal.
 * Shared between `TeachersPage` and the timetable view. See `ClassEditor` for
 * the contract (presentational; parent owns the service call via `onSave`).
 */
export type TeacherEditorInitial =
  | TeacherResponse
  | { new: true }
  | { bulkTimeoff: true }
  | null;

export interface TeacherEditorProps {
  initial: TeacherEditorInitial;
  periods: number[];
  days: string[];
  subjects: SubjectResponse[];
  onClose: () => void;
  onSave: (data: unknown) => void;
}

function TeacherEditorImpl({ initial, periods, days, subjects, onClose, onSave }: TeacherEditorProps) {
  const isEdit = !!initial && !('bulkTimeoff' in initial) && !('new' in initial);
  const isBulk = !!initial && 'bulkTimeoff' in initial;
  const isNew = !!initial && 'new' in initial;

  const init = initial as TeacherResponse;

  const [entries, setEntries] = useState(() =>
    isEdit ? [{ fullName: init.fullName, shortName: init.shortName }] : [{ fullName: '', shortName: '' }]
  );
  const [selectedSubs, setSelectedSubs] = useState<number[]>(isEdit ? (init.subjects || []).map((s) => s.id) : []);
  const [avail, setAvail] = useState<AvailState>(() =>
    isEdit ? convertFromApiFormat(init.availabilities, periods, days) : getFullAvail(periods, days)
  );

  const handleSave = () => {
    if (isBulk) {
      onSave({ availabilities: convertToApiFormat(avail) });
      return;
    }

    const filled = entries.filter(e => e.fullName.trim());
    if (filled.length === 0) {
      toast.error("Kamida bitta o'qituvchi ismini kiritish majburiy");
      return;
    }

    if (isEdit) {
      const e = filled[0];
      const data = {
        fullName: e.fullName.trim(),
        shortName: e.shortName.trim() || e.fullName.trim().split(' ').map((s: string) => s[0]).join('').toUpperCase(),
        subjects: selectedSubs,
        availabilities: convertToApiFormat(avail),
        deletedSubjects: (init.subjects || []).map((s) => s.id).filter((id: number) => !selectedSubs.includes(id))
      };
      onSave(data);
    } else {
      const requests = filled.map((e) => ({
        fullName: e.fullName.trim(),
        shortName: e.shortName.trim() || e.fullName.trim().split(' ').map((s: string) => s[0]).join('').toUpperCase(),
        subjects: selectedSubs,
        availabilities: convertToApiFormat(avail)
      }));
      onSave(requests);
    }
  };

  const addEntry = () => setEntries(prev => [...prev, { fullName: '', shortName: '' }]);
  const updateEntry = (i: number, patch: Partial<{ fullName: string; shortName: string }>) =>
    setEntries(prev => prev.map((e, idx) => idx === i ? { ...e, ...patch } : e));
  const removeEntry = (i: number) => setEntries(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderRadius: 20, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        <header style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ font: '700 10px Plus Jakarta Sans', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {isBulk ? "Ommaviy" : (isEdit ? "Tahrirlash" : "Yangi")}
            </div>
            <div style={{ font: '800 20px Plus Jakarta Sans', color: '#0F172A', marginTop: 2 }}>
              {isBulk ? "Vaqtlarni o'zgartirish" : (isEdit ? entries[0].fullName : "O'qituvchi qo'shish")}
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, border: 0, background: '#F1F5F9', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </header>

        <div style={{ flex: 1, overflow: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }} className="et-premium-scrollbar">
          {!isBulk && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {entries.map((e, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr' + (isNew && entries.length > 1 ? ' 40px' : ''), gap: 12, alignItems: 'flex-end' }}>
                    <div>
                      <label style={{ font: '700 12px Manrope', color: '#64748B', display: 'block', marginBottom: 6 }}>{i === 0 ? "To'liq ismi *" : ""}</label>
                      <input value={e.fullName} onChange={ev => updateEntry(i, { fullName: ev.target.value })} style={inp} placeholder="Masalan: Aziz Azizov" autoFocus={i === 0} />
                    </div>
                    <div>
                      <label style={{ font: '700 12px Manrope', color: '#64748B', display: 'block', marginBottom: 6 }}>{i === 0 ? "Qisqa nomi" : ""}</label>
                      <input value={e.shortName} onChange={ev => updateEntry(i, { shortName: ev.target.value.toUpperCase() })} style={{ ...inp, fontFamily: 'JetBrains Mono' }} placeholder="A.A." />
                    </div>
                    {isNew && entries.length > 1 && (
                      <button onClick={() => removeEntry(i)} style={{ width: 38, height: 38, borderRadius: 9, border: '1.5px solid #E2E8F0', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}

                {isNew && (
                  <button onClick={addEntry} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, font: '700 12px Manrope', color: '#4F46E5', background: '#EEF2FF', border: '1.5px dashed #C7D2FE', padding: '8px 12px', borderRadius: 9, marginTop: 4, cursor: 'pointer' }}>
                    <Plus size={14} /> Yangi o'qituvchi
                  </button>
                )}
              </div>

              <div>
                <label style={{ font: '700 12px Manrope', color: '#64748B', display: 'block', marginBottom: 6 }}>Fanlari</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '10px', border: '1.5px solid #E2E8F0', borderRadius: 10 }}>
                  {subjects.map((s) => {
                    const on = selectedSubs.includes(s.id);
                    return (
                      <button key={s.id} onClick={() => {
                        setSelectedSubs(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]);
                      }} style={{
                        font: '600 11px Manrope', padding: '4px 10px', borderRadius: 8, border: '1.5px solid',
                        borderColor: on ? (s.color || '#4F46E5') : '#E2E8F0',
                        background: on ? (s.color || '#4F46E5') + '10' : '#fff',
                        color: on ? (s.color || '#4F46E5') : '#64748B',
                        cursor: 'pointer', transition: 'all 120ms'
                      }}>
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <div>
            <label style={{ font: '700 12px Manrope', color: '#64748B', display: 'block', marginBottom: 6 }}>Mavjud vaqtlari</label>
            <div style={{ background: '#FAFBFD', border: '1px solid #F1F5F9', borderRadius: 12, padding: 12 }}>
              <AvailGrid avail={avail} periods={periods} days={days} onChange={setAvail} dayLabel={(d: string) => API_DAY_SHORT[d] || d.slice(0, 3)} />
            </div>
          </div>
        </div>

        <footer style={{ padding: 16, borderTop: '1px solid #F1F5F9', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnSecondary}>Bekor</button>
          <button onClick={handleSave} style={btnPrimary}>
            {isBulk ? "Hammasiga qo'llash" : (isEdit ? "Saqlash" : (entries.length > 1 ? "Barchasini qo'shish" : "Qo'shish"))}
          </button>
        </footer>
      </div>
    </div>
  );
}

export const TeacherEditor = memo(TeacherEditorImpl);
