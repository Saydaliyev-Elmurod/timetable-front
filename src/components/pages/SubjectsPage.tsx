import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from '@/i18n/index';
import { SubjectService, SubjectResponse, SubjectRequest } from '@/lib/subjects';
import { TimeSlot } from '@/lib/teachers';
import { organizationApi } from '@/api/organizationApi';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Search, Filter, SortAsc, LayoutGrid, Check, X, ChevronDown, HelpCircle, Edit } from 'lucide-react';

// ─── Design Tokens & Constants ──────────────────────────────────────────

const CL_DAYS = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sha', 'Yak'];

const SX_PALETTE = [
  { id: 'indigo', base: '#4F46E5', tint: '#EEF2FF', ink: '#3730A3' },
  { id: 'blue', base: '#3B82F6', tint: '#DBEAFE', ink: '#1E40AF' },
  { id: 'sky', base: '#0EA5E9', tint: '#E0F2FE', ink: '#075985' },
  { id: 'teal', base: '#14B8A6', tint: '#CCFBF1', ink: '#115E59' },
  { id: 'emerald', base: '#10B981', tint: '#D1FAE5', ink: '#065F46' },
  { id: 'lime', base: '#84CC16', tint: '#ECFCCB', ink: '#3F6212' },
  { id: 'amber', base: '#F59E0B', tint: '#FEF3C7', ink: '#92400E' },
  { id: 'orange', base: '#F97316', tint: '#FFEDD5', ink: '#9A3412' },
  { id: 'rose', base: '#F43F5E', tint: '#FFE4E6', ink: '#9F1239' },
  { id: 'pink', base: '#DB2777', tint: '#FCE7F3', ink: '#9D174D' },
  { id: 'fuchsia', base: '#C026D3', tint: '#FAE8FF', ink: '#86198F' },
  { id: 'violet', base: '#8B5CF6', tint: '#EDE9FE', ink: '#5B21B6' },
  { id: 'slate', base: '#475569', tint: '#F1F5F9', ink: '#1E293B' },
];

const SX_PAL_BY_BASE = Object.fromEntries(SX_PALETTE.map(p => [p.base, p]));
const palOf = (color: string) => SX_PAL_BY_BASE[color] || SX_PALETTE[0];

const SX_WEIGHT_PRESETS = [
  { v: 2, label: 'Yengil', desc: 'Erkin joylashtirish' },
  { v: 4, label: "O'rtacha", desc: "Mumkin bo'lganda ertalab" },
  { v: 6, label: 'Muhim', desc: 'Asosan ertalab' },
  { v: 8, label: 'Yuqori', desc: 'Ertalab + bir kunda jamlash' },
  { v: 10, label: 'Kritik', desc: 'Avval joylashtiriladi' },
];

const SX_CATEGORIES = [
  { id: 'ALL', label: 'Barchasi' },
  { id: 'EXACT', label: 'Aniq fanlar' },
  { id: 'NATURAL', label: 'Tabiiy fanlar' },
  { id: 'LANGUAGES', label: 'Tillar' },
  { id: 'SOCIAL', label: 'Ijtimoiy fanlar' },
  { id: 'CREATIVE', label: 'Amaliy va ijodiy' },
];

function getWeightColor(v: number) {
  if (v >= 9) return { base: '#DC2626', tint: '#FEF2F2', ink: '#991B1B', light: '#FCA5A5' }; // Red
  if (v >= 7) return { base: '#F97316', tint: '#FFF7ED', ink: '#9A3412', light: '#FDBA74' }; // Orange
  if (v >= 5) return { base: '#F59E0B', tint: '#FFFBEB', ink: '#92400E', light: '#FCD34D' }; // Amber
  if (v >= 3) return { base: '#84CC16', tint: '#F7FEE7', ink: '#3F6212', light: '#BEF264' }; // Lime
  return { base: '#10B981', tint: '#F0FDF4', ink: '#065F46', light: '#6EE7B7' }; // Green
}

function weightLabel(v: number) {
  if (v >= 9) return 'Kritik';
  if (v >= 7) return 'Yuqori';
  if (v >= 5) return 'Muhim';
  if (v >= 3) return "O'rtacha";
  return 'Yengil';
}

// ─── Helpers ───────────────────────────────────────────────────────────

function getLocalizedName(sub: any, locale: string) {
  if (locale === 'uz') return sub.nameUz || sub.name;
  if (locale === 'ru') return sub.nameRu || sub.name;
  if (locale === 'en') return sub.nameEn || sub.name;
  return sub.name;
}

const dayMapToApi: Record<string, string> = {
  'Du': 'MONDAY',
  'Se': 'TUESDAY',
  'Ch': 'WEDNESDAY',
  'Pa': 'THURSDAY',
  'Ju': 'FRIDAY',
  'Sha': 'SATURDAY',
  'Yak': 'SUNDAY'
};

const dayMapFromApi: Record<string, string> = {
  'MONDAY': 'Du',
  'TUESDAY': 'Se',
  'WEDNESDAY': 'Ch',
  'THURSDAY': 'Pa',
  'FRIDAY': 'Ju',
  'SATURDAY': 'Sha',
  'SUNDAY': 'Yak'
};

type AvailState = Record<string, Record<number, boolean>>;

const getEmptyAvail = (periods: number[]): AvailState => {
  const res: AvailState = {};
  CL_DAYS.forEach(d => {
    res[d] = {};
    periods.forEach(p => res[d][p] = false);
  });
  return res;
};

const getFullAvail = (periods: number[]): AvailState => {
  const res: AvailState = {};
  CL_DAYS.forEach(d => {
    res[d] = {};
    periods.forEach(p => res[d][p] = true);
  });
  return res;
};

const convertToApiFormat = (avail: AvailState) => {
  return Object.entries(avail).map(([day, periods]) => ({
    dayOfWeek: dayMapToApi[day] || day,
    lessons: Object.entries(periods)
      .filter(([_, value]) => value)
      .map(([period, _]) => parseInt(period))
  }));
};

const convertFromApiFormat = (apiAvail: any[], periods: number[]): AvailState => {
  const result = getEmptyAvail(periods);
  if (!apiAvail) return result;
  apiAvail.forEach(slot => {
    const d = dayMapFromApi[slot.dayOfWeek];
    if (d && result[d]) {
      slot.lessons.forEach((p: number) => {
        if (result[d].hasOwnProperty(p)) {
          result[d][p] = true;
        }
      });
    }
  });
  return result;
};

// ─── Sub-Components ─────────────────────────────────────────────────────

function WeightBadge({ value }: { value: number }) {
  const w = getWeightColor(value);

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span style={{
        font: '800 13px JetBrains Mono', color: w.ink,
        background: w.tint, padding: '4px 8px', borderRadius: 7,
        minWidth: 38, textAlign: 'center', letterSpacing: '.02em',
        border: `1px solid ${w.base}25`,
      }}>{value}<span style={{ color: w.light, fontWeight: 600 }}>/10</span></span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{
          width: 54, height: 5, borderRadius: 999, background: w.tint, overflow: 'hidden',
          position: 'relative',
        }}>
          <span style={{
            position: 'absolute', inset: 0,
            width: `${value * 10}%`, background: w.base, borderRadius: 999,
          }} />
        </span>
        <span style={{ font: '600 10px Manrope', color: w.ink, opacity: 0.8, letterSpacing: '.02em' }}>{weightLabel(value)}</span>
      </div>
    </div>
  );
}

function AvailMini({ avail, periods }: { avail: AvailState, periods: number[] }) {
  const color = '#10B981'; // Fixed green color
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {CL_DAYS.map(d => (
        <div key={d} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {periods.slice(0, 7).map(p => (
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

// ─── Main Page Component ───────────────────────────────────────────────

export default function SubjectsPage() {
  const [library, setLibrary] = useState<SubjectResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [periods, setPeriods] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  
  const [query, setQuery] = useState('');
  const [catFilter, setCatFilter] = useState('ALL');
  const [weightFilter, setWeightFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [editing, setEditing] = useState<SubjectResponse | { new: true } | { bulkWeight: true } | { bulkTimeoff: true } | null>(null);
  const [templates, setTemplates] = useState<SubjectResponse[]>([]);
  const [showTmpl, setShowTmpl] = useState(false);
  const [confirmDel, setConfirmDel] = useState<{ id?: number, name?: string, bulk?: boolean, n?: number } | null>(null);
  const { t, locale } = useTranslation();

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Fetch data
  useEffect(() => {
    fetchData();
  }, [page, size, sortBy]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 0) fetchData();
      else setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const sortParam = sortBy === 'weight' ? 'weight,desc' : 'name,asc';
      const [subsPage, org, tmpls] = await Promise.all([
        SubjectService.getPaginated(page, size, query, undefined, sortParam),
        organizationApi.get(),
        SubjectService.getTemplates()
      ]);
      setLibrary(subsPage.content);
      setTotalPages(subsPage.totalPages);
      setTotalElements(subsPage.totalElements);
      setTemplates(tmpls);
      if (org?.periods) {
        const nonBreak = org.periods.filter(p => !p.isBreak).length;
        setPeriods(Array.from({ length: nonBreak }, (_, i) => i + 1));
      }
    } catch (error) {
      toast.error("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setIsLoading(false);
    }
  };

  // Sort (Filtering now handled by backend)
  const sorted = useMemo(() => {
    let arr = [...library];
    if (sortBy === 'name') arr.sort((a, b) => a.name.localeCompare(b.name, 'uz'));
    if (sortBy === 'weight') arr.sort((a, b) => (b.weight || 0) - (a.weight || 0));
    return arr;
  }, [library, sortBy]);

  // Operations
  const handleSave = async (data: SubjectRequest | SubjectRequest[] | any) => {
    try {
      if (Array.isArray(data)) {
        await SubjectService.bulkCreate(data);
      } else if ((editing as any)?.bulkWeight) {
        await SubjectService.bulkUpdate({
          ids: Array.from(selected),
          weight: data.weight
        });
        setSelected(new Set());
      } else if ((editing as any)?.bulkTimeoff) {
        await SubjectService.bulkUpdate({
          ids: Array.from(selected),
          availabilities: data.availabilities
        });
        setSelected(new Set());
      } else if (editing && !('new' in editing)) {
        await SubjectService.update((editing as any).id, data);
      } else {
        await SubjectService.create(data);
      }
      toast.success("Muvaffaqiyatli saqlandi");
      setEditing(null);
      fetchData();
    } catch (error) {
      toast.error("Saqlashda xatolik");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await SubjectService.delete(id);
      toast.success("Fan o'chirildi");
      setConfirmDel(null);
      fetchData();
    } catch (error) {
      toast.error("O'chirishda xatolik");
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    try {
      await SubjectService.bulkDelete(Array.from(selected));
      toast.success(`${selected.size} ta fan o'chirildi`);
      setSelected(new Set());
      setConfirmDel(null);
      fetchData();
    } catch (error) {
      toast.error("O'chirishda xatolik");
    }
  };

  const applyTemplates = async (selectedTemplates: SubjectResponse[]) => {
    const requests: SubjectRequest[] = selectedTemplates.map(t => ({
      name: t.name,
      nameUz: t.nameUz,
      nameRu: t.nameRu,
      nameEn: t.nameEn,
      shortName: t.shortName,
      color: t.color || '#4F46E5',
      weight: t.weight || 6,
      availabilities: convertToApiFormat(getFullAvail(periods)),
      emoji: t.emoji || '📖'
    }));
    await handleSave(requests);
  };

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const filtered = sorted;
  const allSelected = selected.size === filtered.length && filtered.length > 0;
  const someSelected = selected.size > 0 && !allSelected;
  const toggleSelectAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map(s => s.id)));
  };

  if (isLoading && library.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 400 }}>
        <Loader2 className="animate-spin" size={32} color="#4F46E5" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <div style={{ padding: '12px 0', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: 240 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input 
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('subjects.search_placeholder', 'Fanni qidiring...')}
            style={{ width: '100%', border: '1.5px solid #E2E8F0', borderRadius: 9, padding: '10px 12px 10px 34px', font: '500 13px Manrope', color: '#0F172A', outline: 0 }} 
          />
        </div>

        <Select 
          label={t('subjects.sort_by', 'Saralash')}
          value={sortBy} 
          onChange={(v: any) => { setSortBy(v); setPage(0); }}
          options={[
            { v: 'name', label: t('subjects.sort_name', 'Nomi (A–Z)') },
            { v: 'weight', label: t('subjects.sort_weight', 'Vazni (yuqoridan)') },
          ]}
        />

        <span style={{ flex: 1 }} />
        <span style={{ font: '600 12px Manrope', color: '#64748B' }}>{totalElements} ta fan</span>

        <button onClick={() => setShowTmpl(true)} style={btnSecondary}>
          <LayoutGrid size={14} />
          To'plamlar
        </button>

        <button onClick={() => setEditing({ new: true })} style={btnPrimary}>
          <Plus size={14} strokeWidth={2.5} />
          Yangi fan
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflow: 'auto', paddingBottom: 100 }} className="et-premium-scrollbar">
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: 'var(--et-shadow-sm)' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '30px 4px 1.4fr 1.1fr 130px 90px',
            gap: 18, padding: '10px 18px',
            background: '#FAFBFD', borderBottom: '1px solid #E2E8F0',
            font: '700 10px Plus Jakarta Sans', color: '#64748B',
            letterSpacing: '.08em', textTransform: 'uppercase',
          }}>
            <button onClick={toggleSelectAll} style={{
              width: 20, height: 20, borderRadius: 5,
              border: allSelected ? '2px solid #4F46E5' : '1.5px solid #CBD5E1',
              background: allSelected ? '#4F46E5' : (someSelected ? '#EEF2FF' : 'transparent'),
              cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {allSelected ? <Check size={11} stroke="#fff" strokeWidth={3} />
                : someSelected ? <span style={{ width: 8, height: 2, background: '#4F46E5', borderRadius: 2 }} />
                  : null}
            </button>
            <span />
            <span>Fan</span>
            <span>Vazn</span>
            <span>Mavjud vaqt</span>
            <span style={{ textAlign: 'right' }}>Amallar</span>
          </div>

          {sorted.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '70px 20px', color: '#94A3B8' }}>
              <div style={{ font: '800 16px Plus Jakarta Sans', color: '#0F172A' }}>Hech narsa topilmadi</div>
            </div>
          ) : (
            sorted.map(s => (
              <SubjectRow key={s.id} sub={s} periods={periods}
                selected={selected.has(s.id)}
                onSelect={toggleSelect}
                onEdit={setEditing}
                onDelete={(id: number, name: string) => setConfirmDel({ id, name })} />
            ))
          )}
        </div>

        {/* Footer actions & Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, paddingBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Select 
              label="Sahifa hajmi" 
              value={size} 
              onChange={(v: any) => { setSize(Number(v)); setPage(0); }}
              options={[
                { v: 10, label: '10' },
                { v: 20, label: '20' },
                { v: 40, label: '40' },
              ]}
            />
            <span style={{ font: '500 12px Manrope', color: '#94A3B8' }}>Jami: {totalElements}</span>
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button 
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                style={{ ...btnSecondary, padding: '8px 12px', opacity: page === 0 ? 0.5 : 1 }}
              > Oldingi </button>
              
              <div style={{ display: 'flex', gap: 5 }}>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button 
                    key={i}
                    onClick={() => setPage(i)}
                    style={{
                      width: 34, height: 34, borderRadius: 8, border: '1px solid #E2E8F0',
                      background: page === i ? '#4F46E5' : '#fff',
                      color: page === i ? '#fff' : '#64748B',
                      font: '700 13px Manrope', cursor: 'pointer',
                      transition: 'all 120ms'
                    }}
                  > {i + 1} </button>
                ))}
              </div>

              <button 
                disabled={page === totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                style={{ ...btnSecondary, padding: '8px 12px', opacity: page === totalPages - 1 ? 0.5 : 1 }}
              > Keyingi </button>
            </div>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#0F172A', color: '#fff', borderRadius: 12, padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 12, zIndex: 55,
          boxShadow: '0 24px 60px -16px rgba(15,23,42,0.4)',
          animation: 'et-pop 220ms var(--et-ease-out-expo)',
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, font: '800 13px JetBrains Mono' }}>
            <span style={{ width: 22, height: 22, borderRadius: 6, background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '800 10px JetBrains Mono' }}>{selected.size}</span>
            ta tanlandi
          </span>
          <span style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.18)' }} />
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setEditing({ bulkWeight: true })} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              font: '700 12px Manrope', color: '#fff', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
              padding: '8px 12px', borderRadius: 7, cursor: 'pointer',
            }}>
              <Edit size={13} />
              Vaznni o'zgartirish
            </button>
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
        <SubjectEditor
          initial={editing === true || (editing as any).new ? null : editing}
          periods={periods}
          onClose={() => setEditing(null)}
          onSave={handleSave} />
      )}
      {showTmpl && (
        <TemplatesModal 
          onClose={() => setShowTmpl(false)} 
          onApply={applyTemplates} 
          templates={templates} 
          locale={locale}
        />
      )}
      {confirmDel && (
        <ConfirmDelete
          payload={confirmDel}
          onCancel={() => setConfirmDel(null)}
          onConfirm={() => {
            if (confirmDel.bulk) handleBulkDelete();
            else if (confirmDel.id) handleDelete(confirmDel.id);
          }} />
      )}
    </div>
  );
}

// ─── Row Component ─────────────────────────────────────────────────────

function SubjectRow({ sub, periods, selected, onSelect, onEdit, onDelete }: any) {
  const p = palOf(sub.color || '#4F46E5');
  const avail = useMemo(() => convertFromApiFormat(sub.availabilities, periods), [sub.availabilities, periods]);
  
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '30px 4px 1.4fr 140px 1.1fr 90px',
      alignItems: 'center', gap: 18, padding: '12px 18px',
      background: selected ? p.tint : '#fff',
      borderBottom: '1px solid #F1F5F9',
      transition: 'background 120ms ease',
    }}>
      <button onClick={() => onSelect?.(sub.id)} style={{
        width: 20, height: 20, borderRadius: 5,
        border: selected ? `2px solid ${p.base}` : '1.5px solid #CBD5E1',
        background: selected ? p.base : 'transparent',
        cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{selected && <Check size={11} stroke="#fff" strokeWidth={3} />}</button>

      <div style={{ width: 4, height: 36, background: p.base, borderRadius: 2 }} />

      <div style={{ minWidth: 0 }}>
        <div style={{
          font: '700 15px Plus Jakarta Sans', color: '#0F172A',
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{getLocalizedName(sub, useTranslation().locale)}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 3 }}>
          <span style={{
            font: '700 10px JetBrains Mono', color: p.ink, background: p.tint,
            padding: '2px 6px', borderRadius: 4, letterSpacing: '.05em',
          }}>{sub.shortName}</span>
        </div>
      </div>

      <WeightBadge value={sub.weight || 1} />

      <div><AvailMini avail={avail} periods={periods} /></div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button onClick={() => onEdit?.(sub)} title="Tahrirlash" style={iconRowBtn(false)}>
          <Edit size={15} />
        </button>
        <button onClick={() => onDelete?.(sub.id, sub.name)} title="O'chirish" style={iconRowBtn(true)}>
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Editor Component (with Batch support) ──────────────────────────────

function SubjectEditor({ initial, periods, onClose, onSave }: any) {
  const isEdit = !!initial && !('bulkWeight' in initial) && !('bulkTimeoff' in initial) && !('new' in initial);
  const isBulkWeight = !!initial && 'bulkWeight' in initial;
  const isBulkTimeoff = !!initial && 'bulkTimeoff' in initial;
  const isBulk = isBulkWeight || isBulkTimeoff;

  const [entries, setEntries] = useState(() => 
    isEdit ? [{ name: getLocalizedName(initial, useTranslation().locale), short: initial.shortName }] : [{ name: '', short: '' }]
  );
  const [color, setColor] = useState(isEdit ? initial.color : '#4F46E5');
  const [weight, setWeight] = useState(isEdit ? initial.weight : 6);
  const [avail, setAvail] = useState<AvailState>(() => 
    isEdit ? convertFromApiFormat(initial.availabilities, periods) : getFullAvail(periods)
  );

  const p = palOf(color);

  const handleInternalSave = () => {
    if (isBulkWeight) {
      onSave({ weight });
      return;
    }
    if (isBulkTimeoff) {
      onSave({ availabilities: convertToApiFormat(avail) });
      return;
    }
    const filled = entries.filter(e => e.name.trim().length >= 2);
    if (filled.length === 0) return;
    
    const requests: SubjectRequest[] = filled.map(e => ({
      name: e.name.trim(),
      nameUz: e.name.trim(),
      nameRu: e.name.trim(),
      nameEn: e.name.trim(),
      shortName: e.short.trim() || e.name.trim().slice(0, 3).toUpperCase(),
      color, weight,
      availabilities: convertToApiFormat(avail)
    }));
    onSave(isEdit ? requests[0] : requests);
  };

  const addEntry = () => setEntries(prev => [...prev, { name: '', short: '' }]);
  const updateEntry = (i: number, patch: any) => setEntries(prev => prev.map((e, idx) => idx === i ? { ...e, ...patch } : e));
  const removeEntry = (i: number) => setEntries(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev);

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      backdropFilter: 'saturate(140%) blur(4px)',
      animation: 'et-fade 200ms ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 16,
        width: '100%', maxWidth: 640, maxHeight: '94vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 32px 80px -20px rgba(15,23,42,0.4)',
        animation: 'et-pop 220ms cubic-bezier(0.22,1,0.36,1)',
      }}>
        <header style={{ padding: '18px 22px 16px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ font: '700 10px Plus Jakarta Sans', color: '#94A3B8', letterSpacing: '.12em', textTransform: 'uppercase' }}>
              {isBulkWeight ? "Vaznni o'zgartirish" : (isBulkTimeoff ? "Vaqtlarni o'zgartirish" : (isEdit ? "Fanni tahrirlash" : "Yangi fan qo'shish"))}
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, border: 0, background: '#F1F5F9', borderRadius: 8, cursor: 'pointer', color: '#475569' }}><X size={13} strokeWidth={2.5} /></button>
        </header>

        <div style={{ flex: 1, overflow: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 20 }} className="et-premium-scrollbar">
          
          {!isBulk && (
            <Field label={isEdit ? "Fan nomi" : "Fanlar ro'yxati"} required>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {entries.map((e, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8 }}>
                    <input value={e.name} onChange={ev => updateEntry(i, { name: ev.target.value })} placeholder="Nomi" style={inp} autoFocus={i === 0} />
                    <input value={e.short} onChange={ev => updateEntry(i, { short: ev.target.value.toUpperCase().slice(0, 5) })} placeholder="Qisqa" style={{ ...inp, width: 80, fontFamily: 'JetBrains Mono' }} />
                    {!isEdit && entries.length > 1 && (
                      <button onClick={() => removeEntry(i)} style={{ width: 38, height: 38, borderRadius: 9, border: '1.5px solid #E2E8F0', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
                    )}
                  </div>
                ))}
                {!isEdit && (
                  <button onClick={addEntry} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, font: '700 12px Manrope', color: '#4F46E5', background: '#EEF2FF', border: '1.5px dashed #C7D2FE', padding: '8px 12px', borderRadius: 9, marginTop: 4 }}>
                    <Plus size={14} /> Yana bir fan
                  </button>
                )}
              </div>
            </Field>
          )}

          {!isBulk && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
              <Field label="Rang">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: 6, border: '1.5px solid #E2E8F0', borderRadius: 9, background: '#fff' }}>
                  {SX_PALETTE.map(P => (
                    <button key={P.id} onClick={() => setColor(P.base)} style={{
                      width: 30, height: 30, background: P.base,
                      border: P.base === color ? '2px solid #0F172A' : '2px solid transparent',
                      borderRadius: 7, cursor: 'pointer', position: 'relative',
                      boxShadow: P.base === color ? `0 0 0 2px ${P.tint}` : 'none'
                    }}>
                      {P.base === color && <Check size={12} stroke="#fff" strokeWidth={3} style={{ position: 'absolute', inset: 0, margin: 'auto' }} />}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {(isBulkWeight || !isBulk) && (
            <Field label="Vazn (1–10)">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'inline-flex', border: '1.5px solid #E2E8F0', borderRadius: 9, overflow: 'hidden' }}>
                  <button onClick={() => setWeight(Math.max(1, weight - 1))} style={stepBtn}>−</button>
                  <input readOnly value={weight} style={{ width: 50, border: 0, textAlign: 'center', font: '800 16px JetBrains Mono' }} />
                  <button onClick={() => setWeight(Math.min(10, weight + 1))} style={stepBtn}>+</button>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ height: 8, borderRadius: 9, background: getWeightColor(weight).tint, overflow: 'hidden' }}>
                    <div style={{ width: `${weight * 10}%`, height: '100%', background: getWeightColor(weight).base, transition: 'width 200ms' }} />
                  </div>
                  <div style={{ font: '700 11px Plus Jakarta Sans', color: getWeightColor(weight).ink, marginTop: 4 }}>{weightLabel(weight)}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                {SX_WEIGHT_PRESETS.map(W => {
                  const on = weight === W.v;
                  const wc = getWeightColor(W.v);
                  return (
                    <button key={W.v} onClick={() => setWeight(W.v)} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7,
                      font: '600 12px Manrope',
                      color: on ? wc.ink : '#475569',
                      background: on ? wc.tint : '#fff',
                      border: `1px solid ${on ? wc.base : '#E2E8F0'}`,
                      padding: '6px 11px', borderRadius: 7, cursor: 'pointer',
                      transition: 'all 120ms'
                    }}>
                      <span style={{
                        font: '800 10px JetBrains Mono',
                        color: on ? '#fff' : '#94A3B8',
                        background: on ? wc.base : '#F1F5F9',
                        padding: '1px 5px', borderRadius: 3, minWidth: 18, textAlign: 'center',
                      }}>{W.v}</span>
                      {W.label}
                    </button>
                  );
                })}
              </div>
            </Field>
          )}

          {(isBulkTimeoff || !isBulk) && (
            <Field label="Mavjud dars soatlari">
              <div style={{ background: '#FAFBFD', border: '1px solid #F1F5F9', borderRadius: 10, padding: 12 }}>
                <AvailGrid avail={avail} periods={periods} onChange={setAvail} />
              </div>
            </Field>
          )}
        </div>

        <footer style={{ padding: 14, borderTop: '1px solid #F1F5F9', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ font: '700 12px Manrope', color: '#475569', background: '#fff', border: '1px solid #E2E8F0', padding: '10px 14px', borderRadius: 9, cursor: 'pointer' }}>Bekor</button>
          <button onClick={handleInternalSave} style={{
            font: '700 12px Manrope', color: '#fff',
            background: p.base, border: 0,
            padding: '10px 16px', borderRadius: 9,
            cursor: 'pointer',
            boxShadow: `0 4px 12px -4px ${p.base}`,
          }}>{isBulk ? "Hammasiga qo'llash" : (isEdit ? "Saqlash" : "Qo'shish")}</button>
        </footer>
      </div>
    </div>
  );
}

// ─── Templates Modal ───────────────────────────────────────────────────

function TemplatesModal({ onClose, onApply, templates, locale }: any) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [cat, setCat] = useState('ALL');

  const filtered = useMemo(() => {
    if (cat === 'ALL') return templates;
    return templates.filter((t: any) => t.category === cat);
  }, [templates, cat]);

  const toggle = (id: number) => {
    setSelectedIds(prev => {
      const copy = new Set(prev);
      copy.has(id) ? copy.delete(id) : copy.add(id);
      return copy;
    });
  };

  const toggleAll = () => {
    const allInFilteredSelected = filtered.every((t: any) => selectedIds.has(t.id));
    const copy = new Set(selectedIds);
    if (allInFilteredSelected) {
      filtered.forEach((t: any) => copy.delete(t.id));
    } else {
      filtered.forEach((t: any) => copy.add(t.id));
    }
    setSelectedIds(copy);
  };

  const handleApply = () => {
    const selected = templates.filter((t: any) => selectedIds.has(t.id));
    onApply(selected);
    onClose();
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 30,
      backdropFilter: 'saturate(140%) blur(4px)',
      animation: 'et-fade 200ms ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 18, width: '100%', maxWidth: 760, maxHeight: '85vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 24px 60px -16px rgba(15,23,42,0.32)',
        animation: 'et-pop 220ms cubic-bezier(0.22,1,0.36,1)',
      }}>
        <header style={{ padding: '20px 24px 14px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ font: '700 10px Plus Jakarta Sans', color: '#94A3B8', letterSpacing: '.12em', textTransform: 'uppercase' }}>Tezkor qo'shish</div>
            <div style={{ font: '800 20px Plus Jakarta Sans', color: '#0F172A', marginTop: 3 }}>Tayyor to'plamlar</div>
          </div>
          <button onClick={toggleAll} style={{
            font: '700 12px Manrope', color: '#4F46E5', background: '#EEF2FF', border: 0,
            padding: '8px 12px', borderRadius: 9, cursor: 'pointer'
          }}>
            {filtered.every((t: any) => selectedIds.has(t.id)) ? "Hammasini bekor qilish" : "Hammasini tanlash"}
          </button>
        </header>
        
        {/* Category Filter */}
        <div style={{ display: 'flex', gap: 8, padding: '0 24px 14px', borderBottom: '1px solid #F1F5F9', flexWrap: 'wrap' }}>
          {SX_CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setCat(c.id)} style={{
              font: '700 11px Manrope', color: cat === c.id ? '#fff' : '#64748B',
              background: cat === c.id ? '#4F46E5' : '#F1F5F9',
              border: 0, padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
              transition: 'all 120ms'
            }}>
              {useTranslation().t(`subjects.categories.${c.id}`)}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {filtered.map((t: any) => {
              const isSelected = selectedIds.has(t.id);
              const p = palOf(t.color || '#4F46E5');
              return (
                <button key={t.id} onClick={() => toggle(t.id)} style={{
                  textAlign: 'left', padding: '12px 14px',
                  background: isSelected ? p.tint : '#fff',
                  border: isSelected ? `2px solid ${p.base}` : '1.5px solid #E2E8F0',
                  borderRadius: 12, cursor: 'pointer', transition: 'all 140ms ease',
                  display: 'flex', alignItems: 'center', gap: 12
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: '700 13px Plus Jakarta Sans', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {getLocalizedName(t, locale)}
                    </div>
                    <div style={{ font: '700 10px JetBrains Mono', color: p.ink, marginTop: 2 }}>{t.shortName}</div>
                  </div>
                  {isSelected && (
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: p.base, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={12} color="#fff" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <footer style={{ padding: 14, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ font: '700 12px Manrope', color: '#475569', background: '#fff', border: '1px solid #E2E8F0', padding: '10px 14px', borderRadius: 9, cursor: 'pointer' }}>Bekor</button>
          <button disabled={selectedIds.size === 0} onClick={handleApply} style={{
            font: '700 12px Manrope', color: '#fff',
            background: selectedIds.size > 0 ? '#4F46E5' : '#CBD5E1', border: 0,
            padding: '10px 16px', borderRadius: 9,
            cursor: selectedIds.size > 0 ? 'pointer' : 'not-allowed',
          }}>
            {selectedIds.size > 0 ? `${selectedIds.size} ta fanni qo'shish` : "Fanni tanlang"}
          </button>
        </footer>
      </div>
    </div>
  );
}

// ─── Shared UI Elements ───────────────────────────────────────────────

function AvailGrid({ avail, periods, onChange }: any) {
  const color = '#10B981'; // Fixed green color
  
  const toggle = (d: string, p: number) => {
    const dayAvail = avail[d] || {};
    const copy = { ...avail, [d]: { ...dayAvail, [p]: !dayAvail[p] } };
    onChange(copy);
  };

  const toggleDay = (e: React.MouseEvent, d: string) => {
    e.stopPropagation();
    const dayAvail = avail[d] || {};
    const allSelected = periods.every((p: number) => dayAvail[p]);
    const nextValue = !allSelected;
    
    const nextDayAvail = { ...dayAvail };
    periods.forEach((p: number) => { nextDayAvail[p] = nextValue; });
    
    onChange({ ...avail, [d]: nextDayAvail });
  };

  const togglePeriod = (e: React.MouseEvent, p: number) => {
    e.stopPropagation();
    const allSelected = CL_DAYS.every(d => avail[d]?.[p]);
    const nextValue = !allSelected;

    const nextAvail = { ...avail };
    CL_DAYS.forEach(d => {
      const dayAvail = { ...(nextAvail[d] || {}) };
      dayAvail[p] = nextValue;
      nextAvail[d] = dayAvail;
    });
    onChange(nextAvail);
  };
  
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 4 }}>
      <div />
      {periods.map((p: number) => (
        <div 
          key={p} 
          onClick={(e) => togglePeriod(e, p)}
          style={{ textAlign: 'center', font: '800 10px JetBrains Mono', color: '#94A3B8', cursor: 'pointer', padding: '4px 0' }}
        >
          {p}
        </div>
      ))}
      {CL_DAYS.map(d => (
        <React.Fragment key={d}>
          <div 
            onClick={(e) => toggleDay(e, d)}
            style={{ font: '800 11px Plus Jakarta Sans', color: '#475569', display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '4px 0' }}
          >
            {d}
          </div>
          {periods.map((p: number) => (
            <button key={p} onClick={() => toggle(d, p)} style={{
              height: 24, borderRadius: 4, border: '1px solid #E2E8F0',
              background: avail[d]?.[p] ? color : '#fff',
              cursor: 'pointer', transition: 'all 100ms'
            }} />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}

function Field({ label, required, children }: any) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ font: '700 10px Plus Jakarta Sans', color: '#64748B', letterSpacing: '.08em', textTransform: 'uppercase' }}>
        {label}{required && <span style={{ color: '#DC2626' }}>*</span>}
      </span>
      {children}
    </label>
  );
}

function Select({ label, value, onChange, options }: any) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
      <span style={{ font: '500 11px Manrope', color: '#94A3B8' }}>{label}:</span>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        font: '600 12px Manrope', color: '#0F172A', background: '#fff',
        border: '1px solid #E2E8F0', padding: '8px 28px 8px 11px', borderRadius: 8, cursor: 'pointer',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>")`,
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
      }}>
        {options.map((o: any) => <option key={o.v} value={o.v}>{o.label}</option>)}
      </select>
    </label>
  );
}

function ConfirmDelete({ payload, onCancel, onConfirm }: any) {
  return (
    <div onClick={onCancel} style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 110,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      backdropFilter: 'saturate(140%) blur(3px)',
      animation: 'et-fade 160ms ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 14, width: '100%', maxWidth: 380, padding: '22px 22px 18px',
        boxShadow: '0 24px 60px -16px rgba(15,23,42,0.32)',
        animation: 'et-pop 200ms cubic-bezier(0.22,1,0.36,1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trash2 size={18} />
          </div>
          <div>
            <div style={{ font: '800 16px Plus Jakarta Sans', color: '#0F172A' }}>{payload.bulk ? `${payload.n} ta fanni o'chirish?` : "Fanni o'chirish?"}</div>
            <div style={{ font: '500 12px Manrope', color: '#64748B', marginTop: 2 }}>Bu amalni qaytarib bo'lmaydi.</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ font: '700 12px Manrope', color: '#475569', background: '#fff', border: '1px solid #E2E8F0', padding: '10px 14px', borderRadius: 9, cursor: 'pointer' }}>Bekor</button>
          <button onClick={onConfirm} style={{ font: '700 12px Manrope', color: '#fff', background: '#DC2626', border: 0, padding: '10px 16px', borderRadius: 9, cursor: 'pointer' }}>O'chirish</button>
        </div>
      </div>
    </div>
  );
}

const btnSecondary = {
  display: 'inline-flex', alignItems: 'center', gap: 7,
  font: '700 12px Manrope', color: '#475569', background: '#fff',
  border: '1px solid #E2E8F0', padding: '9px 14px', borderRadius: 9, cursor: 'pointer',
};

const btnPrimary = {
  display: 'inline-flex', alignItems: 'center', gap: 7,
  font: '700 13px Manrope', color: '#fff', background: '#0F172A',
  border: 0, padding: '9px 14px', borderRadius: 9, cursor: 'pointer',
  boxShadow: '0 4px 12px -4px rgba(15,23,42,0.4)',
};

const iconRowBtn = (danger: boolean) => ({
  width: 34, height: 34, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  color: danger ? '#DC2626' : '#475569',
  background: '#fff', border: `1px solid ${danger ? '#FECACA' : '#E2E8F0'}`,
  borderRadius: 8, cursor: 'pointer', transition: 'all 120ms ease',
});

const inp = {
  font: '600 14px Manrope', color: '#0F172A',
  border: '1.5px solid #E2E8F0', borderRadius: 9, padding: '10px 12px',
  outline: 0, background: '#fff', width: '100%', boxSizing: 'border-box' as const,
};

const stepBtn = {
  width: 30, border: 0, background: '#F8FAFC', cursor: 'pointer',
  font: '800 16px JetBrains Mono', color: '#475569',
};
