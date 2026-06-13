import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useCrudResource } from '@/hooks';
import { useTranslation } from '@/i18n/index';
import { SubjectService, SubjectResponse, SubjectRequest } from '@/lib/subjects';
import { TimeSlot } from '@/lib/teachers';
import { organizationApi } from '@/api/organizationApi';
import { toast } from 'sonner';
import { Plus, Trash2, Filter, SortAsc, LayoutGrid, Check, X, ChevronDown, HelpCircle, Edit } from 'lucide-react';
import { CrudPageHeader, BulkActionBar, Pagination, getActiveApiDays, AvailMini, PageLoading, TipsSidebar, TipItem } from '@/components/shared';
import { PageContainer } from '@/components/shared/PageContainer';
import { CL_DAYS, palOf, dayMapFromApi } from './subjects-page/constants';
import {
  convertFromApiFormat,
  convertToApiFormat,
  getFullAvail,
  getLocalizedName,
  getWeightColor,
  weightLabel,
} from './subjects-page/helpers';
import {
  AvailGrid,
  ConfirmDelete,
  Field,
  Select as SelectField,
} from './subjects-page/ui';
import { btnPrimary, iconRowBtn, inp } from './subjects-page/styles';
import { SubjectEditor } from './subjects-page/SubjectEditor';
import { TemplatesModal } from './subjects-page/TemplatesModal';

const SUBJECT_TIPS: TipItem[] = [
  {
    id: 'descr_name',
    title: 'Tavsifli nom bering',
    description: '“Matematika 5-A” emas, faqat “Matematika”. Sinf darslarni biriktirishda aniqlanadi.',
    icon: Edit,
  },
  {
    id: 'weight_imp',
    title: 'Vazn = muhimlik',
    description: 'Yuqori vaznli fanlar jadvalda avval va ertalabki soatlarga joylashtiriladi.',
    icon: SortAsc,
  },
  {
    id: 'limit_avail',
    title: 'Mavjud vaqtni cheklang',
    description: 'Fizika faqat ertalab kerakmi? Mos kataklarni o\'chiring — qolgani avtomatik to\'ldiriladi.',
    icon: LayoutGrid,
  },
  {
    id: 'use_abbr',
    title: 'Qisqartmadan foydalaning',
    description: 'MAT, FIZ kabi 3 harfli kodlar tor jadval kataklarida toza ko\'rinadi.',
    icon: HelpCircle,
  },
];

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

// ─── Main Page Component ───────────────────────────────────────────────

export default function SubjectsPage() {
  const [periods, setPeriods] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  const [activeDays, setActiveDays] = useState<string[]>([...CL_DAYS]);

  const [catFilter, setCatFilter] = useState('ALL');
  const [weightFilter, setWeightFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [editing, setEditing] = useState<SubjectResponse | { new: true } | { bulkWeight: true } | { bulkTimeoff: true } | null>(null);
  const [templates, setTemplates] = useState<SubjectResponse[]>([]);
  const [showTmpl, setShowTmpl] = useState(false);
  const [confirmDel, setConfirmDel] = useState<{ id?: number, name?: string, bulk?: boolean, n?: number } | null>(null);
  const { t, locale } = useTranslation();

  // Closing over sortBy: when it changes, fetchFn identity changes → hook refetches
  const fetchSubjects = useCallback(
    (page: number, size: number, query: string) => {
      const sortParam = sortBy === 'weight' ? 'weight,desc' : 'name,asc';
      return SubjectService.getPaginated(page, size, query, undefined, sortParam);
    },
    [sortBy],
  );

  const {
    items: library,
    isLoading,
    totalElements,
    totalPages,
    page, size, setPage, setSize,
    query, setQuery,
    selected, setSelected, toggleSelect, clearSelection,
    refresh: fetchData,
  } = useCrudResource<SubjectResponse>(fetchSubjects, {
    searchDebounceMs: 400,
  });

  // One-time templates & periods fetch
  useEffect(() => {
    SubjectService.getTemplates().then(setTemplates).catch(() => {});
    organizationApi.get().then((org) => {
      if (org?.periods) {
        const nonBreak = org.periods.filter(p => !p.isBreak).length;
        setPeriods(Array.from({ length: nonBreak }, (_, i) => i + 1));
      }
      // Backend ish kunlarini o'zbekcha kalitga (CL_DAYS) map qilamiz.
      setActiveDays(getActiveApiDays(org?.daysOfWeek).map((d) => dayMapFromApi[d]).filter(Boolean));
    }).catch(() => {});
  }, []);

  // Sort (Filtering now handled by backend)
  const sorted = useMemo(() => {
    let arr = [...library];
    if (sortBy === 'name') arr.sort((a, b) => getLocalizedName(a, locale).localeCompare(getLocalizedName(b, locale), 'uz'));
    if (sortBy === 'weight') arr.sort((a, b) => (b.weight || 0) - (a.weight || 0));
    return arr;
  }, [library, sortBy, locale]);

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
        clearSelection();
      } else if ((editing as any)?.bulkTimeoff) {
        await SubjectService.bulkUpdate({
          ids: Array.from(selected),
          availabilities: data.availabilities
        });
        clearSelection();
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
      clearSelection();
      setConfirmDel(null);
      fetchData();
    } catch (error) {
      toast.error("O'chirishda xatolik");
    }
  };

  const applyTemplates = async (selectedTemplates: SubjectResponse[]) => {
    const requests: SubjectRequest[] = selectedTemplates.map((t: any) => ({
      name: t.name,
      nameUz: t.nameUz,
      nameRu: t.nameRu,
      nameEn: t.nameEn,
      shortName: t.shortName,
      color: t.color || '#4F46E5',
      weight: t.weight || 6,
      availabilities: convertToApiFormat(getFullAvail(periods, activeDays)),
      emoji: t.emoji || '📖'
    }));
    await handleSave(requests);
  };

  const filtered = sorted;
  const allSelected = selected.size === filtered.length && filtered.length > 0;
  const someSelected = selected.size > 0 && !allSelected;
  const toggleSelectAll = () => {
    if (allSelected) clearSelection();
    else setSelected(new Set(filtered.map(s => s.id)));
  };

  if (isLoading && library.length === 0) {
    return <PageLoading />;
  }

  return (
    <PageContainer fullHeight noGap size="full">
      <div style={{ display: 'flex', flexDirection: 'row', height: '100%', width: '100%', overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', overflow: 'hidden', minWidth: 0, paddingRight: 64 }}>
          <CrudPageHeader
            searchValue={query}
            onSearchChange={setQuery}
            searchPlaceholder={t('subjects.search_placeholder', 'Fanni qidiring...')}
            leftExtras={
              <SelectField
                label={t('subjects.sort_by', 'Saralash')}
                value={sortBy}
                onChange={(v: any) => { setSortBy(v); setPage(0); }}
                options={[
                  { v: 'name', label: t('subjects.sort_name', 'Nomi (A–Z)') },
                  { v: 'weight', label: t('subjects.sort_weight', 'Vazni (yuqoridan)') },
                ]}
              />
            }
            count={totalElements}
            countLabel="ta fan"
            actions={[
              { id: 'templates', label: "To'plamlar", icon: LayoutGrid, onClick: () => setShowTmpl(true), variant: 'secondary' },
              { id: 'add', label: 'Yangi fan', icon: Plus, onClick: () => setEditing({ new: true }), variant: 'primary' },
            ]}
          />

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
                  <SubjectRow key={s.id} sub={s} periods={periods} days={activeDays}
                    selected={selected.has(s.id)}
                    onSelect={toggleSelect}
                    onEdit={setEditing}
                    onDelete={(id: number, name: string) => setConfirmDel({ id, name })} />
                ))
              )}
            </div>

            {/* Footer actions & Pagination */}
            <Pagination
              page={page}
              size={size}
              totalPages={totalPages}
              totalElements={totalElements}
              onPageChange={setPage}
              onSizeChange={(s) => { setSize(s); setPage(0); }}
            />
          </div>

          <BulkActionBar
            count={selected.size}
            actions={[
              { id: 'bulk-weight', label: "Vaznni o'zgartirish", icon: Edit, onClick: () => setEditing({ bulkWeight: true }) },
              { id: 'bulk-timeoff', label: "Vaqtlarni o'zgartirish", icon: LayoutGrid, onClick: () => setEditing({ bulkTimeoff: true }) },
            ]}
            onDelete={() => setConfirmDel({ bulk: true, n: selected.size })}
            onClear={clearSelection}
          />

          {/* Modals */}
          {editing && (
            <SubjectEditor
              initial={(editing as any).new ? null : editing}
              periods={periods}
              days={activeDays}
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
        <TipsSidebar pageKey="subjects" tips={SUBJECT_TIPS} />
      </div>
    </PageContainer>
  );
}

// ─── Row Component ─────────────────────────────────────────────────────

function SubjectRow({ sub, periods, days, selected, onSelect, onEdit, onDelete }: any) {
  const { locale } = useTranslation();
  const p = palOf(sub.color || '#4F46E5');
  const avail = useMemo(() => convertFromApiFormat(sub.availabilities, periods, days), [sub.availabilities, periods, days]);
  
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
        }}>{getLocalizedName(sub, locale)}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 3 }}>
          <span style={{
            font: '700 10px JetBrains Mono', color: p.ink, background: p.tint,
            padding: '2px 6px', borderRadius: 4, letterSpacing: '.05em',
          }}>{sub.shortName}</span>
        </div>
      </div>

      <WeightBadge value={sub.weight || 1} />

      <div><AvailMini avail={avail} periods={periods} days={days} /></div>

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

