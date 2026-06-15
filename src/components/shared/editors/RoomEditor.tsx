import { useState, memo } from 'react';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { AvailState, getFullAvail, convertToApiFormat, convertFromApiFormat } from '@/lib/availability';
import { RoomType, type RoomResponse } from '@/lib/rooms';
import { AvailGrid } from '../AvailGrid';
import { btnPrimary, btnSecondary, inp } from '../crudStyles';
import { API_DAY_SHORT } from '../types';

/**
 * Single source of truth for the Room create/edit/bulk-timeoff modal.
 * Shared between `RoomsPage` and the timetable view. See `ClassEditor` for
 * the contract (presentational; parent owns the service call via `onSave`).
 */
export type RoomEditorInitial =
  | RoomResponse
  | { new: true }
  | { bulkTimeoff: true }
  | null;

export interface RoomEditorProps {
  initial: RoomEditorInitial;
  periods: number[];
  days: string[];
  onClose: () => void;
  onSave: (data: unknown) => void;
}

function RoomEditorImpl({ initial, periods, days, onClose, onSave }: RoomEditorProps) {
  const isEdit = !!initial && !('bulkTimeoff' in initial) && !('new' in initial);
  const isBulk = !!initial && 'bulkTimeoff' in initial;
  const isNew = !!initial && 'new' in initial;

  const init = initial as RoomResponse;

  const [entries, setEntries] = useState(() =>
    isEdit ? [{ name: init.name, shortName: init.shortName, type: init.type || RoomType.SHARED }]
           : [{ name: '', shortName: '', type: RoomType.SHARED }]
  );
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
      toast.error("Xona nomini kiritish majburiy");
      return;
    }

    if (isEdit) {
      const e = filled[0];
      const data = {
        name: e.name.trim(),
        shortName: e.shortName.trim() || e.name.trim().substring(0, 5),
        type: e.type,
        availabilities: convertToApiFormat(avail)
      };
      onSave(data);
    } else {
      const requests = filled.map(e => ({
        name: e.name.trim(),
        shortName: e.shortName.trim() || e.name.trim().substring(0, 5),
        type: e.type,
        availabilities: convertToApiFormat(avail)
      }));
      onSave(requests);
    }
  };

  const addEntry = () => setEntries(prev => [...prev, { name: '', shortName: '', type: RoomType.SHARED }]);
  const updateEntry = (i: number, patch: Partial<{ name: string; shortName: string; type: RoomType }>) =>
    setEntries(prev => prev.map((e, idx) => idx === i ? { ...e, ...patch } : e));
  const removeEntry = (i: number) => setEntries(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: '#fff', width: '100%', maxWidth: 550, borderRadius: 20, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        <header style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ font: '700 10px Inter', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{isBulk ? "Ommaviy" : (isEdit ? "Tahrirlash" : "Yangi")}</div>
            <div style={{ font: '800 20px Manrope', color: '#0F172A', marginTop: 2 }}>{isBulk ? "Vaqtlarni o'zgartirish" : (isEdit ? entries[0].name : "Xona qo'shish")}</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, border: 0, background: '#F1F5F9', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
        </header>

        <div style={{ flex: 1, overflow: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {!isBulk && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {entries.map((e, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 0.6fr 0.6fr' + (isNew && entries.length > 1 ? ' 40px' : ''), gap: 10, alignItems: 'flex-end' }}>
                  <div>
                    {i === 0 && <label style={{ font: '700 12px Manrope', color: '#64748B', display: 'block', marginBottom: 6 }}>Nomi *</label>}
                    <input value={e.name} onChange={ev => updateEntry(i, { name: ev.target.value })} style={inp} placeholder="Xona nomi" autoFocus={i === 0} />
                  </div>
                  <div>
                    {i === 0 && <label style={{ font: '700 12px Manrope', color: '#64748B', display: 'block', marginBottom: 6 }}>Qisqa nomi</label>}
                    <input value={e.shortName} onChange={ev => updateEntry(i, { shortName: ev.target.value })} style={inp} placeholder="Qisqa" />
                  </div>
                  <div>
                    {i === 0 && <label style={{ font: '700 12px Manrope', color: '#64748B', display: 'block', marginBottom: 6 }}>Turi</label>}
                    <select value={e.type} onChange={ev => updateEntry(i, { type: ev.target.value as RoomType })} style={inp}>
                      <option value={RoomType.SHARED}>Umumiy</option>
                      <option value={RoomType.SPECIAL}>Maxsus</option>
                    </select>
                  </div>
                  {isNew && entries.length > 1 && (
                    <button onClick={() => removeEntry(i)} style={{ width: 38, height: 42, borderRadius: 10, border: '1px solid #E2E8F0', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={14} /></button>
                  )}
                </div>
              ))}
              {isNew && (
                <button onClick={addEntry} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, font: '700 12px Manrope', color: '#4F46E5', background: '#EEF2FF', border: '1.5px dashed #C7D2FE', padding: '8px 12px', borderRadius: 10, marginTop: 4, cursor: 'pointer' }}>
                  <Plus size={14} /> Yangi xona
                </button>
              )}
            </div>
          )}

          <div>
            <label style={{ font: '700 12px Manrope', color: '#64748B', display: 'block', marginBottom: 8 }}>Mavjud vaqtlari</label>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 12 }}>
              <AvailGrid
                avail={avail}
                periods={periods}
                days={days}
                onChange={setAvail}
                onColor="#4F46E5"
                offColor="#E2E8F0"
                cellRadius={6}
                dayLabel={(d) => API_DAY_SHORT[d] || d.slice(0, 3)}
                dayHeaderFont="700 11px Inter"
                dayHeaderColor="#64748B"
                periodFont="700 10px Inter"
                periodColor="#94A3B8"
              />
            </div>
          </div>
        </div>

        <footer style={{ padding: '20px 24px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button onClick={onClose} style={{ ...btnSecondary, paddingLeft: 24, paddingRight: 24 }}>Bekor qilish</button>
          <button onClick={handleSave} style={{ ...btnPrimary, paddingLeft: 24, paddingRight: 24 }}>Saqlash</button>
        </footer>
      </div>
    </div>
  );
}

export const RoomEditor = memo(RoomEditorImpl);
