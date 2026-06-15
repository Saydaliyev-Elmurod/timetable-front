import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { useCrudResource } from '@/hooks';
import {
  Upload, Building2, School, Clock, LayoutGrid,
  Plus, Edit, Trash2, X, ChevronRight,
  ArrowRight, Check, Calendar, Filter,
} from 'lucide-react';
import { useTranslation } from '@/i18n/index';
import { toast } from 'sonner';
import { RoomService, RoomResponse, RoomRequest, RoomType, ROOM_TYPE_DEFINITIONS } from '@/lib/rooms';
import { organizationApi } from '@/api/organizationApi';
import { getFullAvail, convertToApiFormat } from '@/lib/availability';
import { CrudPageHeader, BulkActionBar, Pagination, btnPrimary, btnSecondary, API_DAYS_OF_WEEK, getActiveApiDays, TipsSidebar, TipItem, RoomEditor } from '@/components/shared';
import { PageContainer } from '@/components/shared/PageContainer';
import { cn } from '@/components/ui/utils';

const ImportModal = lazy(() => import('@/components/shared/ImportModal'));

const ROOM_TIPS: TipItem[] = [
  {
    id: 'room_type',
    title: 'Xona turini tanlang',
    description: 'Umumiy xonalar har qanday dars uchun, maxsus xonalar (Kimyo lab., Informatika) faqat shu fanga mos keladi.',
    icon: Building2,
  },
  {
    id: 'room_cap',
    title: 'Sig\'im va jihozlar',
    description: 'Xona sig\'imini sinfdagi o\'quvchilar soniga mosligini hisobga oling.',
    icon: School,
  },
  {
    id: 'room_avail',
    title: 'Mavjudligini cheklash',
    description: 'Agar xona ma\'lum vaqtda band bo\'lsa (tozalash, ta\'mirlash), bu soatlarni mavjudlik jadvalida o\'chiring.',
    icon: Clock,
  },
  {
    id: 'room_names',
    title: 'Qisqa nomlar bering',
    description: 'Jadval ko\'rinishida chalkashlik bo\'lmasligi uchun xonalarga aniq va qisqa nomlar (masalan: 102, Kimyo-Lab) bering.',
    icon: Edit,
  },
];

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
    <PageContainer fullHeight noGap size="full">
      <div style={{ display: 'flex', flexDirection: 'row', height: '100%', width: '100%', overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', overflow: 'hidden', minWidth: 0, paddingRight: 64 }}>
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
                            {(room.availabilities ?? []).reduce((acc, s) => acc + (s.lessons?.length ?? 0), 0)} {t('rooms.slots', 'soat')}
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
                initial={editing} periods={periods} days={activeDays}
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
          </div>
        </div>
        <TipsSidebar pageKey="rooms" tips={ROOM_TIPS} />
      </div>

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
    </PageContainer>
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

