import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { useCrudResource } from '@/hooks';
import {
  Upload, Building2, School, Clock, LayoutGrid,
  Plus, Edit, Trash2, X, Loader2, ChevronRight,
  ArrowRight, Check, Calendar, Filter,
} from 'lucide-react';
import { useTranslation } from '@/i18n/index';
import { toast } from 'sonner';
import { RoomService, RoomResponse, RoomRequest, RoomType, ROOM_TYPE_DEFINITIONS } from '@/lib/rooms';
import { organizationApi } from '@/api/organizationApi';
import { TimeSlot } from '@/lib/teachers';
import { CrudPageHeader, BulkActionBar, Pagination, btnPrimary, btnSecondary, inp, API_DAYS_OF_WEEK, API_DAY_SHORT, getActiveApiDays } from '@/components/shared';
import { PageContainer } from '@/components/shared/PageContainer';
import { cn } from '@/components/ui/utils';

const ImportModal = lazy(() => import('@/components/shared/ImportModal'));

// ─── Constants ─────────────────────────────────────────────────────────

const CL_DAYS = API_DAYS_OF_WEEK;

// ─── Helpers ───────────────────────────────────────────────────────────

type AvailState = Record<string, Record<number, boolean>>;

const getFullAvail = (periods: number[], days: readonly string[] = CL_DAYS): AvailState => {
  const res: AvailState = {};
  days.forEach(d => {
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

const convertFromApiFormat = (slots: TimeSlot[] | undefined, periods: number[], days: readonly string[] = CL_DAYS): AvailState => {
  const res = getFullAvail(periods, days);
  days.forEach(d => periods.forEach(p => res[d][p] = false));
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

function Badge({ children, color: _color, tint, ink }: any) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] font-inter"
      style={{ background: tint || '#F1F5F9', color: ink || '#475569' }}
    >
      {children}
    </span>
  );
}

// ─── Main Page Component ───────────────────────────────────────────────

export default function RoomsPage() {
  const { t, locale } = useTranslation();
  const [periods, setPeriods] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  const [activeDays, setActiveDays] = useState<string[]>([...API_DAYS_OF_WEEK]);

  const [editing, setEditing] = useState<RoomResponse | { new: true } | { bulkTimeoff: true } | null>(null);
  const [confirmDel, setConfirmDel] = useState<{ id?: number, name?: string, bulk?: boolean, n?: number } | null>(null);
  const [showImport, setShowImport] = useState(false);

  const fetchRooms = useCallback(
    (page: number, size: number, query: string) => RoomService.getPaginated(page, size, query),
    [],
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
  } = useCrudResource<RoomResponse>(fetchRooms, {
    searchDebounceMs: 400,
    errorMessage: t('rooms.fetch_error', "Ma'lumotlarni yuklashda xatolik"),
  });

  // One-time periods fetch (independent of rooms pagination)
  useEffect(() => {
    organizationApi.get().then((org) => {
      if (org?.periods) {
        const nonBreak = org.periods.filter(p => !p.isBreak).length;
        setPeriods(Array.from({ length: nonBreak }, (_, i) => i + 1));
      }
      setActiveDays(getActiveApiDays(org?.daysOfWeek));
    }).catch(() => {});
  }, []);

  const handleSave = async (data: any) => {
    try {
      if (Array.isArray(data)) {
        await RoomService.bulkCreate(data);
        toast.success(t('rooms.bulk_add_success', `${data.length} ta xona qo'shildi`));
      } else if (editing && 'bulkTimeoff' in editing) {
        await RoomService.bulkUpdate({ ids: Array.from(selected), ...data });
        toast.success(t('rooms.bulk_update_success', "Mavjudlik vaqtlari yangilandi"));
      } else if (editing && 'id' in editing) {
        await RoomService.update(editing.id, data);
        toast.success(t('rooms.update_success', "Xona yangilandi"));
      } else {
        await RoomService.create(data);
        toast.success(t('rooms.add_success', "Xona qo'shildi"));
      }
      setEditing(null);
      clearSelection();
      fetchData();
    } catch (error) {
      toast.error(t('common.save_error', "Saqlashda xatolik"));
    }
  };

  const handleBulkDelete = async () => {
    try {
      await RoomService.deleteBulk(Array.from(selected));
      toast.success(t('rooms.bulk_delete_success', `${selected.size} ta xona o'chirildi`));
      clearSelection();
      setConfirmDel(null);
      fetchData();
    } catch (error) {
      toast.error(t('common.delete_error', "O'chirishda xatolik"));
    }
  };

  const thCls = 'px-5 py-3.5 text-left font-bold text-[12px] uppercase text-slate-500 font-manrope';
  const tdCls = 'px-5 py-3';

  return (
    <PageContainer fullHeight noGap>
      <div className="flex flex-col h-full gap-5">
      <CrudPageHeader
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder={t('rooms.search_placeholder', 'Xonani qidiring...')}
        searchWidth={300}
        actions={[
          { id: 'import', label: t('common.import', 'Import'), icon: Upload, iconSize: 16, onClick: () => setShowImport(true) },
          { id: 'add', label: t('rooms.add_room', "Xona qo'shish"), icon: Plus, iconSize: 16, onClick: () => setEditing({ new: true }), variant: 'primary' },
        ]}
      />

      {/* Table Card */}
      <div className="flex-1 flex flex-col bg-white rounded-[20px] border border-slate-200 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-3.5 w-10">
                  <input type="checkbox" checked={selected.size === library.length && library.length > 0} onChange={() => {
                    if (selected.size === library.length) setSelected(new Set());
                    else setSelected(new Set(library.map(r => r.id)));
                  }} />
                </th>
                <th className={thCls}>{t('rooms.table_name', 'Xona nomi')}</th>
                <th className={thCls}>{t('rooms.table_short', 'Qisqa nomi')}</th>
                <th className={thCls}>{t('rooms.table_type', 'Turi')}</th>
                <th className={thCls}>{t('rooms.table_timeoff', 'Mavjudlik')}</th>
                <th className={cn(thCls, 'text-right')}>{t('common.actions', 'Amallar')}</th>
              </tr>
            </thead>
            <tbody>
              {library.map(room => (
                <tr key={room.id} className="border-b border-slate-100">
                  <td className={tdCls}>
                    <input type="checkbox" checked={selected.has(room.id)} onChange={() => toggleSelect(room.id)} />
                  </td>
                  <td className={tdCls}>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-9 h-9 rounded-[10px] bg-indigo-50 text-indigo-600">
                        <Building2 size={18} />
                      </div>
                      <span className="font-bold text-[14px] text-slate-900 font-manrope">{room.name}</span>
                    </div>
                  </td>
                  <td className={tdCls}>
                    <Badge>{room.shortName}</Badge>
                  </td>
                  <td className={tdCls}>
                    <Badge tint={room.type === RoomType.SPECIAL ? '#F5F3FF' : '#F0F9FF'} ink={room.type === RoomType.SPECIAL ? '#7C3AED' : '#0369A1'}>
                      {t((ROOM_TYPE_DEFINITIONS[room.type] || ROOM_TYPE_DEFINITIONS[RoomType.SHARED]).labelKey)}
                    </Badge>
                  </td>
                  <td className={tdCls}>
                    <button
                      onClick={() => setEditing(room)}
                      className="flex items-center gap-1.5 bg-transparent border-0 p-0 cursor-pointer font-semibold text-[13px] text-slate-500 font-inter hover:text-slate-700"
                    >
                      <Clock size={14} className="text-indigo-600" />
                      {room.availabilities.reduce((acc, s) => acc + s.lessons.length, 0)} {t('rooms.slots', 'soat')}
                    </button>
                  </td>
                  <td className={cn(tdCls, 'text-right')}>
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setEditing(room)}
                        className="flex items-center justify-center w-8 h-8 rounded-lg border-0 bg-transparent text-slate-500 cursor-pointer hover:bg-slate-100 transition-colors"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => setConfirmDel({ id: room.id, name: room.name })}
                        className="flex items-center justify-center w-8 h-8 rounded-lg border-0 bg-transparent text-rose-500 cursor-pointer hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {library.length === 0 && !isLoading && (
            <div className="p-[60px] text-center">
              <School size={48} className="mx-auto mb-4 opacity-20" />
              <div className="font-bold text-[16px] text-slate-600 font-manrope">{t('rooms.no_data', 'Xonalar topilmadi')}</div>
            </div>
          )}
        </div>

      </div>

      {/* Pagination */}
      <Pagination
        page={page}
        size={size}
        totalPages={totalPages}
        totalElements={totalElements}
        onPageChange={setPage}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
      />

      <BulkActionBar
        count={selected.size}
        actions={[
          { id: 'bulk-timeoff', label: "Vaqtlarni o'zgartirish", icon: Clock, onClick: () => setEditing({ bulkTimeoff: true }) },
        ]}
        onDelete={() => setConfirmDel({ bulk: true, n: selected.size })}
        onClear={clearSelection}
      />

      {/* Modals */}
      {editing && (
        <RoomEditor
          initial={editing} periods={periods} days={activeDays} t={t}
          onClose={() => setEditing(null)} 
          onSave={handleSave} 
        />
      )}

      {confirmDel && (
        <ConfirmDialog 
          title={confirmDel.bulk ? t('rooms.bulk_delete_title', "Xonalarni o'chirish") : t('rooms.delete_title', "Xonani o'chirish")}
          desc={confirmDel.bulk ? t('rooms.bulk_delete_desc', `Siz haqiqatan ham ${confirmDel.n} ta xonani o'chirmoqchimisiz?`) : t('rooms.delete_desc', `"${confirmDel.name}" xonasini o'chirishni tasdiqlaysizmi?`)}
          onConfirm={confirmDel.bulk ? handleBulkDelete : () => {
            RoomService.delete(confirmDel.id!).then(() => {
              toast.success(t('rooms.delete_success', "Xona o'chirildi"));
              setConfirmDel(null);
              fetchData();
            });
          }}
          onClose={() => setConfirmDel(null)}
        />
      )}

      {showImport && (
        <Suspense fallback={null}>
          <ImportModal
            title={t('rooms.import_rooms', 'Xonalarni import qilish')}
            description={t('rooms.import_description', "Excel yoki CSV fayli orqali xonalarni ommaviy qo'shing")}
            templateColumns={['Xona nomi', 'Qisqa nomi', 'Turi (SHARED/SPECIAL)']}
            onImport={async (data) => {
              const requests = data.map((row: any) => ({
                name: row['Xona nomi'] || row['name'],
                shortName: row['Qisqa nomi'] || row['shortName'] || (row['Xona nomi'] || row['name']).substring(0, 5),
                type: row['Turi'] === 'SPECIAL' || row['type'] === 'SPECIAL' ? RoomType.SPECIAL : RoomType.SHARED,
                availabilities: convertToApiFormat(getFullAvail(periods, activeDays))
              }));
              await RoomService.bulkCreate(requests);
              toast.success(t('rooms.import_success', 'Xonalar muvaffaqiyatli import qilindi'));
              setShowImport(false);
              fetchData();
            }}
            onClose={() => setShowImport(false)}
          />
        </Suspense>
      )}
      </div>
    </PageContainer>
  );
}

// ─── Room Editor Modal ───────────────────────────────────────────────

function RoomEditor({ initial, periods, days, t, onClose, onSave }: any) {
  const isEdit = !!initial && !('bulkTimeoff' in initial) && !('new' in initial);
  const isBulk = !!initial && 'bulkTimeoff' in initial;
  const isNew = !!initial && 'new' in initial;

  const [entries, setEntries] = useState(() => 
    isEdit ? [{ name: initial.name, shortName: initial.shortName, type: initial.type || RoomType.SHARED }] 
           : [{ name: '', shortName: '', type: RoomType.SHARED }]
  );
  const [avail, setAvail] = useState<AvailState>(() =>
    isEdit ? convertFromApiFormat(initial.availabilities, periods, days) : getFullAvail(periods, days)
  );

  const handleSave = () => {
    if (isBulk) {
      onSave({ availabilities: convertToApiFormat(avail) });
      return;
    }

    const filled = entries.filter(e => e.name.trim());
    if (filled.length === 0) {
      toast.error(t('rooms.name_required', "Xona nomini kiritish majburiy"));
      return;
    }

    if (isEdit) {
      const e = filled[0];
      const data: any = {
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
  const updateEntry = (i: number, patch: any) => setEntries(prev => prev.map((e, idx) => idx === i ? { ...e, ...patch } : e));
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
                    <select value={e.type} onChange={ev => updateEntry(i, { type: ev.target.value })} style={inp}>
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
              <AvailGrid avail={avail} periods={periods} days={days} onChange={setAvail} />
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

function AvailGrid({ avail, periods, days = CL_DAYS, onChange }: any) {
  const toggle = (d: string, p: number) => {
    const next = { ...avail, [d]: { ...avail[d], [p]: !avail[d]?.[p] } };
    onChange(next);
  };

  // Kun (ustun) toggle — shu kunning barcha periodlari.
  const toggleDay = (d: string) => {
    const allOn = periods.every((p: number) => avail[d]?.[p]);
    const next = { ...avail, [d]: {} as any };
    periods.forEach((p: number) => next[d][p] = !allOn);
    onChange(next);
  };

  // Period (qator) toggle — barcha faol kunlar bo'ylab.
  const togglePeriod = (p: number) => {
    const allOn = days.every((d: string) => avail[d]?.[p]);
    const next = { ...avail };
    days.forEach((d: string) => { next[d] = { ...next[d], [p]: !allOn }; });
    onChange(next);
  };

  // Kunlar = ustun (gorizontal), periodlar = qator (vertikal, pastga o'sadi).
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '40px repeat(' + days.length + ', 1fr)', gap: 4 }}>
      <div />
      {days.map((d: string) => (
        <button key={d} onClick={() => toggleDay(d)} style={{ border: 0, background: 'transparent', font: '700 11px Inter', color: '#64748B', cursor: 'pointer' }}>{API_DAY_SHORT[d] || d.slice(0, 3)}</button>
      ))}
      {periods.map((p: number) => (
        <React.Fragment key={p}>
          <button onClick={() => togglePeriod(p)} style={{ border: 0, background: 'transparent', font: '700 10px Inter', color: '#94A3B8', cursor: 'pointer' }}>{p}</button>
          {days.map((d: string) => (
            <button key={d} onClick={() => toggle(d, p)} style={{
              height: 24, borderRadius: 6, border: 0, cursor: 'pointer',
              background: avail[d]?.[p] ? '#4F46E5' : '#E2E8F0',
              transition: 'all 100ms'
            }} />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}

function ConfirmDialog({ title, desc, onConfirm, onClose }: any) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <div style={{ background: '#fff', width: '100%', maxWidth: 400, borderRadius: 20, padding: 24, textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: '#FFF1F2', color: '#F43F5E', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><Trash2 size={24} /></div>
        <div style={{ font: '800 18px Manrope', color: '#0F172A' }}>{title}</div>
        <p style={{ font: '500 14px Inter', color: '#64748B', marginTop: 8 }}>{desc}</p>
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button onClick={onConfirm} style={{ ...btnPrimary, background: '#F43F5E', flex: 1, justifyContent: 'center', boxShadow: 'none' }}>O'chirish</button>
          <button onClick={onClose} style={{ ...btnSecondary, flex: 1, justifyContent: 'center' }}>Bekor qilish</button>
        </div>
      </div>
    </div>
  );
}
