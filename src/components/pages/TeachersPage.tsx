import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { useCrudResource } from '@/hooks';
import { Upload, BookOpen, Clock, LayoutGrid, Plus, Edit, Trash2, X } from 'lucide-react';
import { useTranslation } from '@/i18n/index';
import { toast } from 'sonner';
import { TeacherService, TeacherResponse, TeacherRequest, TeacherUpdateRequest, TeacherBulkUpdateRequest } from '@/lib/teachers';
import { SubjectService, SubjectResponse } from '@/lib/subjects';
import { organizationApi } from '@/api/organizationApi';
import { getFullAvail, convertToApiFormat, convertFromApiFormat } from '@/lib/availability';
import { CrudPageHeader, BulkActionBar, Pagination, AvailMini, PageLoading, btnPrimary, btnSecondary, API_DAYS_OF_WEEK, getActiveApiDays, TipsSidebar, TipItem, TeacherEditor } from '@/components/shared';
import { PageContainer } from '@/components/shared/PageContainer';

const ImportModal = lazy(() => import('@/components/shared/ImportModal'));

const TEACHER_TIPS: TipItem[] = [
  {
    id: 'balance_load',
    title: 'Ish yuklamasini muvozanatlang',
    description: 'O\'qituvchilarning haftalik dars soatlarini real imkoniyatlariga qarab taqsimlang.',
    icon: BookOpen,
  },
  {
    id: 'teacher_avail',
    title: 'Mavjud vaqtni to\'g\'ri belgilang',
    description: 'Metodika kuni yoki boshqa sabablar bilan ishlay olmaydigan soatlarini oldindan o\'chirib qo\'ying.',
    icon: Clock,
  },
  {
    id: 'link_subjects',
    title: 'Fanlarni biriktiring',
    description: 'O\'qituvchiga faqat u dars bera oladigan fanlarni biriktirish avtomatik jadval tuzishni osonlashtiradi.',
    icon: LayoutGrid,
  },
  {
    id: 'short_names',
    title: 'Qisqartma ismlar',
    description: 'Jadvalda joyni tejash uchun o\'qituvchi ism-familiyasini qisqartma shaklda (masalan, A.A.) kiriting.',
    icon: Edit,
  },
];

// ─── Constants ─────────────────────────────────────────────────────────

const SX_PALETTE = [
  { id: 'indigo', base: '#4F46E5', tint: '#EEF2FF', ink: '#3730A3' },
  { id: 'emerald', base: '#10B981', tint: '#ECFDF5', ink: '#065F46' },
  { id: 'rose', base: '#F43F5E', tint: '#FFF1F2', ink: '#9F1239' },
  { id: 'amber', base: '#F59E0B', tint: '#FFFBEB', ink: '#92400E' },
  { id: 'sky', base: '#0EA5E9', tint: '#F0F9FF', ink: '#075985' },
  { id: 'violet', base: '#8B5CF6', tint: '#F5F3FF', ink: '#5B21B6' },
];

const palOf = (color?: string) => SX_PALETTE.find(p => p.base === color) || SX_PALETTE[0];

// ─── Components ────────────────────────────────────────────────────────

function TeacherRow({ t: _t, teacher, periods, days, selected, onSelect, onEdit, onDelete }: any) {
  const avail = useMemo(() => convertFromApiFormat(teacher.availabilities, periods, days), [teacher, periods, days]);
  const totalHours = teacher.availabilities?.reduce((acc: number, s: any) => acc + s.lessons.length, 0) || 0;

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '30px 1.4fr 1.1fr 130px 90px',
      alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #F1F5F9',
      background: selected ? '#F8FAFF' : 'transparent',
      transition: 'background 150ms'
    }}>
      <input type="checkbox" checked={selected} onChange={() => onSelect(teacher.id)} style={{ cursor: 'pointer' }} />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', font: '700 14px Manrope' }}>
          {teacher.fullName.charAt(0)}
        </div>
        <div>
          <div style={{ font: '700 14px Manrope', color: '#0F172A' }}>{teacher.fullName}</div>
          <div style={{ font: '500 12px Manrope', color: '#94A3B8', fontFamily: 'JetBrains Mono' }}>{teacher.shortName}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {teacher.subjects?.slice(0, 3).map((s: any) => (
          <div key={s.id} style={{ 
            font: '600 10px Manrope', padding: '2px 8px', borderRadius: 6,
            background: (s.color || '#4F46E5') + '15', color: s.color || '#4F46E5',
            border: `1px solid ${(s.color || '#4F46E5')}30`
          }}>
            {s.shortName}
          </div>
        ))}
        {teacher.subjects?.length > 3 && (
          <div style={{ font: '600 10px Manrope', color: '#94A3B8', padding: '2px 4px' }}>+{teacher.subjects.length - 3}</div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <AvailMini avail={avail} periods={periods} days={days} />
        <div style={{ font: '700 11px JetBrains Mono', color: '#64748B' }}>{totalHours} s.</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
        <button onClick={() => onEdit(teacher)} style={{ width: 32, height: 32, borderRadius: 8, border: 0, background: '#F1F5F9', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Edit size={14} />
        </button>
        <button onClick={() => onDelete(teacher.id, teacher.fullName)} style={{ width: 32, height: 32, borderRadius: 8, border: 0, background: '#FFF1F2', color: '#F43F5E', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Main Page Component ───────────────────────────────────────────────

export default function TeachersPage() {
  const { t, locale } = useTranslation();
  const [periods, setPeriods] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  const [activeDays, setActiveDays] = useState<string[]>([...API_DAYS_OF_WEEK]);
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);

  const [editing, setEditing] = useState<TeacherResponse | { new: true } | { bulkTimeoff: true } | null>(null);
  const [confirmDel, setConfirmDel] = useState<{ id?: number, name?: string, bulk?: boolean, n?: number } | null>(null);
  const [showImport, setShowImport] = useState(false);

  const fetchTeachers = useCallback(
    (page: number, size: number, query: string) => TeacherService.getPaginated(page, size, query),
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
  } = useCrudResource<TeacherResponse>(fetchTeachers, {
    searchDebounceMs: 400,
    errorMessage: t('teachers.failed_to_load_teachers'),
  });

  // One-time subjects & periods fetch (independent of teachers pagination)
  useEffect(() => {
    SubjectService.getAll().then(setSubjects).catch(() => {});
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
      if (editing && 'bulkTimeoff' in editing) {
        await TeacherService.bulkUpdate({
          ids: Array.from(selected),
          availabilities: data.availabilities
        });
        clearSelection();
      } else if (editing && !('new' in editing)) {
        await TeacherService.update((editing as any).id, data);
      } else if (Array.isArray(data)) {
        await TeacherService.bulkAdd(data);
      } else {
        await TeacherService.create(data);
      }
      toast.success(t('actions.save_success', 'Muvaffaqiyatli saqlandi'));
      setEditing(null);
      fetchData();
    } catch (error) {
      toast.error(t('actions.save_error', 'Saqlashda xatolik'));
    }
  };

  const handleBulkDelete = async () => {
    try {
      await TeacherService.bulkDelete(Array.from(selected));
      toast.success(t('actions.delete_success', "Muvaffaqiyatli o'chirildi"));
      clearSelection();
      setConfirmDel(null);
      fetchData();
    } catch (error) {
      toast.error(t('actions.delete_error', "O'chirishda xatolik"));
    }
  };

  const toggleSelectAll = () => {
    if (selected.size === library.length) clearSelection();
    else setSelected(new Set(library.map(s => s.id)));
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
            searchPlaceholder={t('teachers.search_placeholder', "O'qituvchini qidiring...")}
            count={totalElements}
            countLabel={t('teachers.teachers_count', "ta o'qituvchi")}
            actions={[
              { id: 'import', label: t('teachers.import', 'Import'), icon: Upload, onClick: () => setShowImport(true) },
              { id: 'add', label: t('teachers.add_new', "Yangi o'qituvchi"), icon: Plus, onClick: () => setEditing({ new: true }), variant: 'primary' },
            ]}
          />

          {/* List */}
          <div style={{ flex: 1, overflow: 'auto', paddingBottom: 100 }} className="et-premium-scrollbar">
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '30px 1.4fr 1.1fr 130px 90px',
                padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0',
                font: '700 11px Plus Jakarta Sans', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>
                <input type="checkbox" checked={selected.size === library.length && library.length > 0} onChange={toggleSelectAll} style={{ cursor: 'pointer' }} />
                <span>O'qituvchi</span>
                <span>Fanlar</span>
                <span>Mavjudlik</span>
                <span style={{ textAlign: 'right' }}>Amallar</span>
              </div>

              {library.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '70px 20px', color: '#94A3B8' }}>
                  <div style={{ font: '800 16px Plus Jakarta Sans', color: '#0F172A' }}>Hech narsa topilmadi</div>
                </div>
              ) : (
                library.map(teacher => (
                  <TeacherRow key={teacher.id} teacher={teacher} periods={periods} days={activeDays} t={t}
                    selected={selected.has(teacher.id)}
                    onSelect={toggleSelect}
                    onEdit={setEditing}
                    onDelete={(id: number, name: string) => setConfirmDel({ id, name })} />
                ))
              )}
            </div>

            {/* Footer & Pagination */}
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
              {
                id: 'bulk-timeoff',
                label: "Vaqtlarni o'zgartirish",
                icon: Clock,
                onClick: () => setEditing({ bulkTimeoff: true }),
              },
            ]}
            onDelete={() => setConfirmDel({ bulk: true, n: selected.size })}
            onClear={clearSelection}
          />

          {/* Modals */}
          {editing && (
            <TeacherEditor 
              initial={editing} periods={periods} days={activeDays} subjects={subjects}
              onClose={() => setEditing(null)} 
              onSave={handleSave} 
            />
          )}

          {confirmDel && (
            <ConfirmDialog
              title={confirmDel.bulk ? "O'qituvchilarni o'chirish" : "O'qituvchini o'chirish"}
              desc={confirmDel.bulk ? `Siz haqiqatan ham ${confirmDel.n} ta o'qituvchini o'chirmoqchimisiz?` : `"${confirmDel.name}" o'qituvchisini o'chirishni tasdiqlaysizmi?`}
              onConfirm={confirmDel.bulk ? handleBulkDelete : () => {
                TeacherService.delete(confirmDel.id!).then(() => {
                  toast.success("O'qituvchi o'chirildi");
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
                title={t('teachers.import_teachers', "O'qituvchilarni import qilish")}
                description={t('teachers.import_description', "Excel yoki CSV fayli orqali o'qituvchilarni ommaviy qo'shing")}
                templateColumns={['Ism', 'Qisqa nom']}
                mapping={(row: any) => ({
                  fullName: row['Ism'],
                  shortName: row['Qisqa nom'],
                  subjects: [],
                  availabilities: convertToApiFormat(getFullAvail(periods, activeDays))
                })}
                onImport={async (data) => {
                  await TeacherService.bulkAdd(data);
                  toast.success(t('teachers.import_success', "Ma'lumotlar muvaffaqiyatli import qilindi"));
                  fetchData();
                }}
                onClose={() => setShowImport(false)}
              />
            </Suspense>
          )}
        </div>
        <TipsSidebar pageKey="teachers" tips={TEACHER_TIPS} />
      </div>
    </PageContainer>
  );
}
function Select({ label, value, onChange, options }: any) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ font: '700 12px Manrope', color: '#94A3B8' }}>{label}:</span>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        padding: '8px 12px', borderRadius: 9, border: '1.5px solid #E2E8F0',
        font: '600 13px Manrope', color: '#0F172A', outline: 0, background: '#fff', cursor: 'pointer'
      }}>
        {options.map((o: any) => <option key={o.v} value={o.v}>{o.label}</option>)}
      </select>
    </div>
  );
}

function ConfirmDialog({ title, desc, onConfirm, onClose }: any) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <div style={{ background: '#fff', width: 400, borderRadius: 20, padding: 24, textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: 18, background: '#FFF1F2', color: '#F43F5E', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Trash2 size={24} />
        </div>
        <h3 style={{ font: '800 20px Plus Jakarta Sans', color: '#0F172A', margin: '0 0 8px' }}>{title}</h3>
        <p style={{ font: '500 14px Manrope', color: '#64748B', margin: '0 0 24px' }}>{desc}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ ...btnSecondary, flex: 1, justifyContent: 'center' }}>Bekor</button>
          <button onClick={onConfirm} style={{ ...btnPrimary, flex: 1, justifyContent: 'center', background: '#F43F5E', boxShadow: '0 4px 12px -4px rgba(244,63,94,0.4)' }}>O'chirish</button>
        </div>
      </div>
    </div>
  );
}
