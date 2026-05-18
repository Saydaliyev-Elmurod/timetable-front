import React, { useState, useEffect } from 'react';
import { X, Search, Check, Loader2, BookOpen, UserCheck, Plus } from 'lucide-react';
import { useTranslation } from '@/i18n/index';

interface TemplatesModalProps<T> {
  title: string;
  description: string;
  fetchTemplates: () => Promise<T[]>;
  onSelect: (selected: T[]) => Promise<void>;
  onClose: () => void;
  renderItem: (item: T) => React.ReactNode;
  filterFn?: (item: T, query: string) => boolean;
  categories?: { id: string, label: string }[];
  categoryFn?: (item: T) => string;
}

export default function TemplatesModal<T extends { id: number | string }>({
  title, description, fetchTemplates, onSelect, onClose, 
  renderItem, filterFn, categories, categoryFn
}: TemplatesModalProps<T>) {
  const { t } = useTranslation();
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<number | string>>(new Set());
  const [activeCat, setActiveCat] = useState('ALL');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchTemplates()
      .then(setItems)
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = items.filter(item => {
    const matchesQuery = filterFn ? filterFn(item, query) : true;
    const matchesCat = activeCat === 'ALL' || (categoryFn ? categoryFn(item) === activeCat : true);
    return matchesQuery && matchesCat;
  });

  const toggle = (id: number | string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const handleConfirm = async () => {
    if (selected.size === 0) return;
    try {
      setIsSaving(true);
      const selectedItems = items.filter(i => selected.has(i.id));
      await onSelect(selectedItems);
      onClose();
    } catch (err) {
      // toast should be handled by parent or here if imported
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 20 }}>
      <div style={{ background: '#fff', width: '100%', maxWidth: 700, borderRadius: 24, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        <header style={{ padding: '24px 28px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h3 style={{ font: '800 20px Plus Jakarta Sans', color: '#0F172A', margin: 0 }}>{title}</h3>
            <p style={{ font: '500 13px Manrope', color: '#64748B', margin: '4px 0 0' }}>{description}</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, border: 0, background: '#F1F5F9', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </header>

        <div style={{ padding: '16px 28px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input 
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Qidirish..." 
              style={{ width: '100%', border: '1.5px solid #E2E8F0', borderRadius: 12, padding: '10px 12px 10px 34px', font: '500 14px Manrope', color: '#0F172A', outline: 0 }} 
            />
          </div>
          {categories && (
            <select 
              value={activeCat} 
              onChange={e => setActiveCat(e.target.value)}
              style={{ padding: '10px 12px', borderRadius: 12, border: '1.5px solid #E2E8F0', font: '600 13px Manrope', color: '#0F172A', outline: 0, background: '#fff' }}
            >
              <option value="ALL">Barcha kategoriyalar</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          )}
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 20 }} className="et-premium-scrollbar">
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
              <Loader2 className="animate-spin" size={32} color="#4F46E5" />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {filtered.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => toggle(item.id)}
                  style={{
                    padding: 16, borderRadius: 16, border: '1.5px solid',
                    borderColor: selected.has(item.id) ? '#4F46E5' : '#E2E8F0',
                    background: selected.has(item.id) ? '#F8FAFF' : '#fff',
                    cursor: 'pointer', transition: 'all 150ms', position: 'relative'
                  }}
                >
                  {selected.has(item.id) && (
                    <div style={{ position: 'absolute', top: 12, right: 12, width: 20, height: 20, borderRadius: 999, background: '#4F46E5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                  {renderItem(item)}
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 0', color: '#94A3B8', font: '500 14px Manrope' }}>
                  Hech narsa topilmadi
                </div>
              )}
            </div>
          )}
        </div>

        <footer style={{ padding: '20px 28px', background: '#F8FAFC', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ font: '700 13px Manrope', color: '#64748B' }}>{selected.size} ta tanlandi</span>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 12, border: '1.5px solid #E2E8F0', background: '#fff', font: '700 14px Manrope', color: '#475569', cursor: 'pointer' }}>Bekor qilish</button>
            <button 
              disabled={selected.size === 0 || isSaving}
              onClick={handleConfirm}
              style={{ 
                padding: '10px 24px', borderRadius: 12, border: 0, 
                background: selected.size === 0 ? '#E2E8F0' : '#4F46E5', color: '#fff', 
                font: '700 14px Manrope', cursor: selected.size === 0 ? 'not-allowed' : 'pointer',
                boxShadow: selected.size === 0 ? 'none' : '0 10px 15px -3px rgba(79,70,229,0.3)',
                display: 'flex', alignItems: 'center', gap: 8
              }}
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              Ro'yxatga qo'shish
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
