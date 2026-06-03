import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { useCrudResource } from '@/hooks';
import { Upload, BookOpen, Clock, LayoutGrid, Plus, Edit, Trash2, X } from 'lucide-react';
import { useTranslation } from '@/i18n/index';
import { toast } from 'sonner';
import { TeacherService, TeacherResponse, TeacherRequest, TeacherUpdateRequest, TeacherBulkUpdateRequest } from '@/lib/teachers';
import { SubjectService, SubjectResponse } from '@/lib/subjects';
import { organizationApi } from '@/api/organizationApi';
import { AvailState, getFullAvail, convertToApiFormat, convertFromApiFormat } from '@/lib/availability';
import { CrudPageHeader, BulkActionBar, Pagination, AvailGrid, AvailMini, PageLoading, btnPrimary, btnSecondary, inp, API_DAYS_OF_WEEK, API_DAY_SHORT, getActiveApiDays } from '@/components/shared';
import { PageContainer } from '@/components/shared/PageContainer';

const ImportModal = lazy(() => import('@/components/shared/ImportModal'));

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
    <PageContainer fullHeight noGap>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
          initial={editing} periods={periods} days={activeDays} subjects={subjects} t={t}
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
    </PageContainer>
  );
}

// ─── Teacher Editor Modal ───────────────────────────────────────────────

function TeacherEditor({ initial, periods, days, subjects, t: _t, onClose, onSave }: any) {
  const isEdit = !!initial && !('bulkTimeoff' in initial) && !('new' in initial);
  const isBulk = !!initial && 'bulkTimeoff' in initial;
  const isNew = !!initial && 'new' in initial;

  const [entries, setEntries] = useState(() => 
    isEdit ? [{ fullName: initial.fullName, shortName: initial.shortName }] : [{ fullName: '', shortName: '' }]
  );
  const [selectedSubs, setSelectedSubs] = useState<number[]>(isEdit ? (initial.subjects || []).map((s: any) => s.id) : []);
  const [avail, setAvail] = useState<AvailState>(() =>
    isEdit ? convertFromApiFormat(initial.availabilities, periods, days) : getFullAvail(periods, days)
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
      const data: any = {
        fullName: e.fullName.trim(),
        shortName: e.shortName.trim() || e.fullName.trim().split(' ').map((s: string) => s[0]).join('').toUpperCase(),
        subjects: selectedSubs,
        availabilities: convertToApiFormat(avail),
        deletedSubjects: (initial.subjects || []).map((s: any) => s.id).filter((id: number) => !selectedSubs.includes(id))
      };
      onSave(data);
    } else {
      const requests = filled.map((e: any) => ({
        fullName: e.fullName.trim(),
        shortName: e.shortName.trim() || e.fullName.trim().split(' ').map((s: string) => s[0]).join('').toUpperCase(),
        subjects: selectedSubs,
        availabilities: convertToApiFormat(avail)
      }));
      onSave(requests);
    }
  };

  const addEntry = () => setEntries(prev => [...prev, { fullName: '', shortName: '' }]);
  const updateEntry = (i: number, patch: any) => setEntries(prev => prev.map((e, idx) => idx === i ? { ...e, ...patch } : e));
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
                  {subjects.map((s: any) => {
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
