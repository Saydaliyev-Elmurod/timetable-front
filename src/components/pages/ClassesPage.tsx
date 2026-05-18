import React, { useState, useEffect, useMemo } from 'react';
import { Download, Upload, Plus, Edit, Trash2, X, Loader2, Search, Check, Layers, Users, DoorOpen, Calendar, LayoutGrid } from 'lucide-react';
import { useTranslation } from '@/i18n/index';
import { toast } from 'sonner';
import { ClassService, ClassResponse, ClassRequest } from '@/lib/classes';
import { TeacherService, TeacherResponse, TimeSlot } from '@/lib/teachers';
import { RoomService, RoomResponse } from '@/lib/rooms';
import { organizationApi } from '@/api/organizationApi';
import ImportModal from '@/components/shared/ImportModal';

// ─── Constants & Styles ────────────────────────────────────────────────

const SX_PALETTE = [
  { id: 'indigo', base: '#4F46E5', tint: '#EEF2FF', ink: '#3730A3' },
  { id: 'emerald', base: '#10B981', tint: '#ECFDF5', ink: '#065F46' },
  { id: 'rose', base: '#F43F5E', tint: '#FFF1F2', ink: '#9F1239' },
  { id: 'amber', base: '#F59E0B', tint: '#FFFBEB', ink: '#92400E' },
  { id: 'sky', base: '#0EA5E9', tint: '#F0F9FF', ink: '#075985' },
  { id: 'violet', base: '#8B5CF6', tint: '#F5F3FF', ink: '#5B21B6' },
];

const palOf = (id: number) => SX_PALETTE[id % SX_PALETTE.length];

const CL_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const btnPrimary = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  background: '#4F46E5', color: '#fff', border: 0,
  padding: '10px 18px', borderRadius: 10,
  font: '700 13px Manrope', cursor: 'pointer',
  boxShadow: '0 4px 12px -4px rgba(79, 70, 229, 0.4)',
  transition: 'all 150ms'
};

const btnSecondary = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  background: '#fff', color: '#475569', border: '1px solid #E2E8F0',
  padding: '10px 18px', borderRadius: 10,
  font: '700 13px Manrope', cursor: 'pointer',
  transition: 'all 150ms'
};

const inp = {
  width: '100%', border: '1.5px solid #E2E8F0', borderRadius: 10,
  padding: '10px 14px', font: '500 14px Manrope', color: '#0F172A',
  outline: 0, transition: 'border-color 150ms'
};

// ─── Helpers ───────────────────────────────────────────────────────────

type AvailState = Record<string, Record<number, boolean>>;

const getFullAvail = (periods: number[]): AvailState => {
  const res: AvailState = {};
  CL_DAYS.forEach(d => {
    res[d] = {};
    periods.forEach(p => res[d][p] = true);
  });
  return res;
};

const convertToApiFormat = (state: AvailState): TimeSlot[] => {
  return Object.entries(state).map(([day, pMap]) => ({
    dayOfWeek: day,
    lessons: Object.entries(pMap).filter(([_, v]) => v).map(([p]) => Number(p)).sort((a, b) => a - b)
  }));
};

const convertFromApiFormat = (slots: TimeSlot[] | undefined, periods: number[]): AvailState => {
  const res = getFullAvail(periods);
  CL_DAYS.forEach(d => periods.forEach(p => res[d][p] = false));
  if (slots) {
    slots.forEach(s => {
      if (res[s.dayOfWeek]) {
        s.lessons.forEach(l => res[s.dayOfWeek][l] = true);
      }
    });
  }
  return res;
};

// ─── Components ────────────────────────────────────────────────────────

function AvailMini({ avail, periods }: { avail: AvailState, periods: number[] }) {
  const color = '#10B981';
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {CL_DAYS.map(d => (
        <div key={d} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {periods.slice(0, 8).map(p => (
            <div key={p} style={{
              width: 4, height: 4, borderRadius: 1,
              background: avail[d]?.[p] ? color : '#E2E8F0'
            }} />
          ))}
        </div>
      ))}
    </div>
  );
}

function AvailGrid({ avail, periods, onChange }: { avail: AvailState, periods: number[], onChange: (s: AvailState) => void }) {
  const toggle = (d: string, p: number) => {
    const next = { ...avail, [d]: { ...avail[d], [p]: !avail[d][p] } };
    onChange(next);
  };

  const toggleDay = (d: string) => {
    const allOn = periods.every(p => avail[d][p]);
    const next = { ...avail, [d]: {} as any };
    periods.forEach(p => next[d][p] = !allOn);
    onChange(next);
  };

  const togglePeriod = (p: number) => {
    const allOn = CL_DAYS.every(d => avail[d][p]);
    const next = { ...avail };
    CL_DAYS.forEach(d => {
      next[d] = { ...next[d], [p] : !allOn };
    });
    onChange(next);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '40px repeat(8, 1fr)', gap: 4 }}>
      <div />
      {periods.slice(0, 8).map(p => (
        <button key={p} onClick={() => togglePeriod(p)} style={{ border: 0, background: 'transparent', font: '800 10px JetBrains Mono', color: '#94A3B8', cursor: 'pointer' }}>{p}</button>
      ))}
      {CL_DAYS.map(d => (
        <React.Fragment key={d}>
          <button onClick={() => toggleDay(d)} style={{ border: 0, background: 'transparent', font: '700 10px Manrope', color: '#94A3B8', textAlign: 'left', cursor: 'pointer' }}>{d.slice(0, 3)}</button>
          {periods.slice(0, 8).map(p => (
            <button key={p} onClick={() => toggle(d, p)} style={{ height: 24, borderRadius: 4, border: 0, cursor: 'pointer', background: avail[d][p] ? '#10B981' : '#F1F5F9', transition: 'all 100ms' }} />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}

function ClassRow({ t, cls, periods, selected, onSelect, onEdit, onDelete }: any) {
  const pal = palOf(cls.id);
  const avail = useMemo(() => convertFromApiFormat(cls.availabilities, periods), [cls, periods]);
  const totalHours = cls.availabilities?.reduce((acc: number, s: any) => acc + s.lessons.length, 0) || 0;

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '40px 1.2fr 1fr 140px 90px',
      alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid #F1F5F9',
      background: selected ? pal.tint : '#fff',
      transition: 'background 150ms'
    }}>
      <input type="checkbox" checked={selected} onChange={() => onSelect(cls.id)} style={{ cursor: 'pointer', width: 18, height: 18 }} />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: pal.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', color: pal.base, font: '800 16px Manrope' }}>
          {cls.name.match(/\d+/) || cls.name.charAt(0)}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ font: '700 15px Plus Jakarta Sans', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cls.name}</div>
          <div style={{ font: '700 10px JetBrains Mono', color: pal.ink, opacity: 0.7 }}>{cls.shortName}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {cls.teacher ? (
           <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: '600 12px Manrope', color: '#475569', background: '#F1F5F9', padding: '4px 10px', borderRadius: 8 }}>
             <Users size={12} />
             {cls.teacher.fullName}
           </div>
        ) : (
          <span style={{ font: '500 12px Manrope', color: '#94A3B8' }}>Ustoz biriktirilmagan</span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <AvailMini avail={avail} periods={periods} />
        <div style={{ font: '700 11px JetBrains Mono', color: '#64748B' }}>{totalHours} s.</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
        <button onClick={() => onEdit(cls)} style={{ width: 34, height: 34, borderRadius: 10, border: 0, background: '#F1F5F9', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Edit size={15} />
        </button>
        <button onClick={() => onDelete(cls.id, cls.name)} style={{ width: 34, height: 34, borderRadius: 10, border: 0, background: '#FFF1F2', color: '#F43F5E', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Main Page Component ───────────────────────────────────────────────

export default function ClassesPage() {
  const { t } = useTranslation();
  const [library, setLibrary] = useState<ClassResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [periods, setPeriods] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  const [teachers, setTeachers] = useState<TeacherResponse[]>([]);
  const [rooms, setRooms] = useState<RoomResponse[]>([]);

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [editing, setEditing] = useState<ClassResponse | { new: true } | { bulkTimeoff: true } | null>(null);
  const [confirmDel, setConfirmDel] = useState<{ id?: number, name?: string, bulk?: boolean, n?: number } | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showBatch, setShowBatch] = useState(false);

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    fetchData();
  }, [page, size]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [clsPage, tchs, rms, org] = await Promise.all([
        ClassService.getPaginated(page, size),
        TeacherService.getAll(),
        RoomService.getAll(),
        organizationApi.get()
      ]);
      setLibrary(clsPage.content);
      setTotalElements(clsPage.totalElements);
      setTeachers(tchs);
      setRooms(rms);
      if (org?.periods) {
        const nonBreak = org.periods.filter((p: any) => !p.isBreak).length;
        setPeriods(Array.from({ length: nonBreak }, (_, i) => i + 1));
      }
    } catch (error) {
      toast.error("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (data: any) => {
    try {
      if (editing && 'bulkTimeoff' in editing) {
        await ClassService.bulkTimeoff({
          applyTo: Array.from(selected),
          timeOff: data.availabilities
        });
        setSelected(new Set());
      } else if (editing && !('new' in editing)) {
        await ClassService.update((editing as any).id, data);
      } else if (Array.isArray(data)) {
        await ClassService.createBulk(data);
      } else {
        await ClassService.create(data);
      }
      toast.success("Muvaffaqiyatli saqlandi");
      setEditing(null);
      fetchData();
    } catch (error) {
      toast.error("Saqlashda xatolik");
    }
  };

  const handleDelete = async (id?: number) => {
    try {
      if (confirmDel?.bulk) {
        await ClassService.deleteBulk(Array.from(selected));
        toast.success("Sinflar o'chirildi");
        setSelected(new Set());
      } else if (id) {
        await ClassService.delete(id);
        toast.success("Sinf o'chirildi");
      }
      setConfirmDel(null);
      fetchData();
    } catch (error) {
      toast.error("O'chirishda xatolik");
    }
  };

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const filtered = useMemo(() => {
    if (!query) return library;
    return library.filter(c => c.name.toLowerCase().includes(query.toLowerCase()) || c.shortName.toLowerCase().includes(query.toLowerCase()));
  }, [library, query]);

  if (isLoading && library.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 400 }}>
        <Loader2 className="animate-spin" size={32} color="#4F46E5" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      {/* Toolbar */}
      <div style={{ padding: '12px 0', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: 240 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input 
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Sinfni qidiring..."
            style={{ width: '100%', border: '1.5px solid #E2E8F0', borderRadius: 9, padding: '10px 12px 10px 34px', font: '500 13px Manrope', color: '#0F172A', outline: 0 }} 
          />
        </div>

        <span style={{ flex: 1 }} />
        <span style={{ font: '600 12px Manrope', color: '#64748B' }}>{totalElements} ta sinf</span>

        <button onClick={() => setShowImport(true)} style={btnSecondary}>
          <Upload size={14} />
          Import
        </button>

        <button onClick={() => setShowBatch(true)} style={btnSecondary}>
          <Layers size={14} />
          Guruhli yaratish
        </button>

        <button onClick={() => setEditing({ new: true })} style={btnPrimary}>
          <Plus size={14} strokeWidth={2.5} />
          Yangi sinf
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 20px -4px rgba(0,0,0,0.05)' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '40px 1.2fr 1fr 140px 90px',
          gap: 18, padding: '14px 18px', background: '#FAFBFD', borderBottom: '1px solid #E2E8F0',
          font: '800 11px Plus Jakarta Sans', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em'
        }}>
          <div />
          <span>Sinf nomi</span>
          <span>Sinf rahbari</span>
          <span>Mavjud vaqt</span>
          <span style={{ textAlign: 'right' }}>Amallar</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8' }}>
            <Layers size={40} style={{ marginBottom: 12, opacity: 0.5 }} />
            <div style={{ font: '700 16px Manrope', color: '#0F172A' }}>Hech qanday sinf topilmadi</div>
          </div>
        ) : (
          filtered.map(c => (
            <ClassRow 
              key={c.id} cls={c} periods={periods}
              selected={selected.has(c.id)}
              onSelect={toggleSelect}
              onEdit={setEditing}
              onDelete={(id: number, name: string) => setConfirmDel({ id, name })}
            />
          ))
        )}
      </div>

      {/* Pagination Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
        <span style={{ font: '600 13px Manrope', color: '#94A3B8' }}>Jami {totalElements} ta sinf</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)} style={{ ...btnSecondary, padding: '8px 14px' }}>Oldingi</button>
          <button disabled={library.length < size} onClick={() => setPage(p => p + 1)} style={{ ...btnSecondary, padding: '8px 14px' }}>Keyingi</button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#0F172A', color: '#fff', borderRadius: 12, padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 12, zIndex: 55,
          boxShadow: '0 24px 60px -16px rgba(15,23,42,0.4)',
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, font: '800 13px JetBrains Mono' }}>
            <span style={{ width: 22, height: 22, borderRadius: 6, background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '800 10px JetBrains Mono' }}>{selected.size}</span>
            ta tanlandi
          </span>
          <span style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.18)' }} />
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setEditing({ bulkTimeoff: true })} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              font: '700 12px Manrope', color: '#fff', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
              padding: '8px 12px', borderRadius: 7, cursor: 'pointer',
            }}>
              <LayoutGrid size={13} />
              Vaqtlarni o'zgartirish
            </button>
          </div>
          <button onClick={() => setConfirmDel({ bulk: true, n: selected.size })} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            font: '700 12px Manrope', color: '#fff', background: '#DC2626', border: 0,
            padding: '8px 12px', borderRadius: 7, cursor: 'pointer',
          }}>
            <Trash2 size={13} />
            O'chirish
          </button>
          <button onClick={() => setSelected(new Set())} style={{
            font: '700 12px Manrope', color: 'rgba(255,255,255,0.7)', background: 'transparent',
            border: 0, padding: '7px 10px', borderRadius: 7, cursor: 'pointer',
          }}>Bekor</button>
        </div>
      )}

      {/* Modals */}
      {editing && (
        <ClassEditor 
          initial={editing === true || (editing as any).new ? null : editing} 
          periods={periods} teachers={teachers} rooms={rooms}
          onClose={() => setEditing(null)}
          onSave={handleSave} 
        />
      )}

      {confirmDel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 400, boxShadow: '0 20px 50px -12px rgba(0,0,0,0.2)' }}>
            <h3 style={{ font: '800 20px Plus Jakarta Sans', color: '#0F172A', marginBottom: 8 }}>{confirmDel.bulk ? "Sinflarni o'chirish" : "Sinfni o'chirish"}</h3>
            <p style={{ font: '500 14px Manrope', color: '#64748B', marginBottom: 24 }}>
              {confirmDel.bulk 
                ? `Siz tanlagan ${confirmDel.n} ta sinfni o'chirishni tasdiqlaysizmi?` 
                : `"${confirmDel.name}" sinfini o'chirishni tasdiqlaysizmi?`
              } Bu amalni qaytarib bo'lmaydi.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDel(null)} style={btnSecondary}>Bekor</button>
              <button onClick={() => handleDelete(confirmDel.id)} style={{ ...btnPrimary, background: '#EF4444' }}>O'chirish</button>
            </div>
          </div>
        </div>
      )}

      {showBatch && (
        <BatchCreateModal 
          library={library}
          periods={periods}
          onClose={() => setShowBatch(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// ─── Batch Create Modal ────────────────────────────────────────────────

function BatchCreateModal({ library, periods, onClose, onSave }: any) {
  const [selectedGrades, setSelectedGrades] = useState<number[]>([]);
  const [selectedLetters, setSelectedLetters] = useState<string[]>([]);
  
  const grades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const letters = ['A', 'B', 'V', 'G', 'D', 'E', 'J', 'I'];

  const generated = useMemo(() => {
    const res: any[] = [];
    selectedGrades.forEach(g => {
      selectedLetters.forEach(l => {
        const name = `${g}-${l}`;
        const exists = library.some((c: any) => c.name === name);
        res.push({ grade: g, letter: l, name, exists });
      });
    });
    return res;
  }, [selectedGrades, selectedLetters, library]);

  const handleCreate = () => {
    const toCreate = generated.filter(c => !c.exists).map(c => ({
      name: c.name,
      shortName: c.name,
      availabilities: convertToApiFormat(getFullAvail(periods))
    }));
    if (toCreate.length > 0) onSave(toCreate);
    else onClose();
  };

  const toggleGrade = (g: number) => setSelectedGrades(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  const toggleLetter = (l: string) => setSelectedLetters(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 540, boxShadow: '0 32px 64px -12px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', maxHeight: '92vh' }}>
        <header style={{ padding: '24px 28px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ font: '800 22px Plus Jakarta Sans', color: '#0F172A' }}>Sinflarni guruh bo'yicha yaratish</h2>
            <p style={{ font: '500 13px Manrope', color: '#64748B', marginTop: 4 }}>Parallelni va harflarni belgilang — barchasi bir martada yaratiladi</p>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 12, border: 0, background: '#F1F5F9', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={20} />
          </button>
        </header>

        <div style={{ flex: 1, overflow: 'auto', padding: 28, display: 'flex', flexDirection: 'column', gap: 24 }} className="et-premium-scrollbar">
          <div>
            <label style={{ font: '700 11px Plus Jakarta Sans', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 12 }}>Parallellar</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {grades.map(g => {
                const on = selectedGrades.includes(g);
                return (
                  <button key={g} onClick={() => toggleGrade(g)} style={{
                    padding: '8px 16px', borderRadius: 10, font: '700 13px Manrope', cursor: 'pointer', border: '1.5px solid',
                    background: on ? '#4F46E5' : '#fff', borderColor: on ? '#4F46E5' : '#E2E8F0', color: on ? '#fff' : '#475569',
                    transition: 'all 120ms'
                  }}>{g}-sinf</button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ font: '700 11px Plus Jakarta Sans', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 12 }}>Harflar</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {letters.map(l => {
                const on = selectedLetters.includes(l);
                return (
                  <button key={l} onClick={() => toggleLetter(l)} style={{
                    width: 42, height: 42, borderRadius: 10, font: '800 14px JetBrains Mono', cursor: 'pointer', border: '1.5px solid',
                    background: on ? '#4F46E5' : '#fff', borderColor: on ? '#4F46E5' : '#E2E8F0', color: on ? '#fff' : '#475569',
                    transition: 'all 120ms'
                  }}>{l}</button>
                );
              })}
            </div>
          </div>

          {generated.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <label style={{ font: '700 11px Plus Jakarta Sans', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ko'rib chiqish</label>
                <span style={{ font: '700 12px Manrope', color: '#64748B' }}>{generated.filter(c => !c.exists).length} yangi · {generated.filter(c => c.exists).length} mavjud</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {generated.map(c => (
                  <div key={c.name} style={{
                    padding: '10px 14px', borderRadius: 12, border: '1.5px solid',
                    background: c.exists ? '#fff' : '#EEF2FF', borderColor: c.exists ? '#FFE4E6' : '#C7D2FE',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}>
                    <span style={{ font: '800 14px Plus Jakarta Sans', color: '#0F172A' }}>{c.name}</span>
                    <span style={{ font: '700 10px Manrope', color: c.exists ? '#F43F5E' : '#4F46E5', textTransform: 'uppercase' }}>{c.exists ? 'mavjud' : 'yangi'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <footer style={{ padding: '20px 28px', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 12, justifyContent: 'flex-end', background: '#FAFBFD' }}>
          <button onClick={onClose} style={btnSecondary}>Bekor qilish</button>
          <button onClick={handleCreate} disabled={generated.length === 0} style={{ ...btnPrimary, opacity: generated.length === 0 ? 0.5 : 1 }}>
            {generated.filter(c => !c.exists).length} ta sinf yaratish
          </button>
        </footer>
      </div>
    </div>
  );
}

// ─── Class Editor Modal ───────────────────────────────────────────────

function ClassEditor({ initial, periods, teachers, rooms, onClose, onSave }: any) {
  const isEdit = !!initial && !('bulkTimeoff' in initial) && !('new' in initial);
  const isBulk = !!initial && 'bulkTimeoff' in initial;
  const isNew = !!initial && 'new' in initial;

  const [entries, setEntries] = useState(() => 
    isEdit ? [{ name: initial.name, shortName: initial.shortName }] : [{ name: '', shortName: '' }]
  );
  const [teacherId, setTeacherId] = useState<string>(isEdit ? String(initial.teacher?.id || '') : '');
  const [avail, setAvail] = useState<AvailState>(() => 
    isEdit ? convertFromApiFormat(initial.availabilities, periods) : getFullAvail(periods)
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
  const updateEntry = (i: number, patch: any) => setEntries(prev => prev.map((e, idx) => idx === i ? { ...e, ...patch } : e));
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
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.fullName}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label style={{ font: '700 12px Manrope', color: '#64748B', display: 'block', marginBottom: 8 }}>Mavjud dars soatlari</label>
            <div style={{ background: '#FAFBFD', border: '1px solid #F1F5F9', borderRadius: 16, padding: 16 }}>
              <AvailGrid avail={avail} periods={periods} onChange={setAvail} />
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
