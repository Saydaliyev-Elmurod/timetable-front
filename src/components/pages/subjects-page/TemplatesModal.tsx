import React, { useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from '@/i18n/index';
import { SubjectResponse } from '@/lib/subjects';
import { palOf, SX_CATEGORIES } from './constants';
import { getLocalizedName } from './helpers';

interface TemplatesModalProps {
  onClose: () => void;
  onApply: (selected: SubjectResponse[]) => void | Promise<void>;
  templates: SubjectResponse[];
  locale: string;
}

export function TemplatesModal({ onClose, onApply, templates, locale }: TemplatesModalProps) {
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [cat, setCat] = useState('ALL');

  const filtered = useMemo(() => {
    if (cat === 'ALL') return templates;
    return templates.filter((tpl) => tpl.category === cat);
  }, [templates, cat]);

  const allInFilteredSelected = filtered.every((tpl) => selectedIds.has(tpl.id));

  const toggle = (id: number) => {
    setSelectedIds((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  };

  const toggleAll = () => {
    const copy = new Set(selectedIds);
    if (allInFilteredSelected) {
      filtered.forEach((tpl) => copy.delete(tpl.id));
    } else {
      filtered.forEach((tpl) => copy.add(tpl.id));
    }
    setSelectedIds(copy);
  };

  const handleApply = () => {
    const selected = templates.filter((tpl) => selectedIds.has(tpl.id));
    onApply(selected);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.5)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
        backdropFilter: 'saturate(140%) blur(4px)',
        animation: 'et-fade 200ms ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 18,
          width: '100%',
          maxWidth: 760,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 60px -16px rgba(15,23,42,0.32)',
          animation: 'et-pop 220ms cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <header
          style={{
            padding: '20px 24px 14px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                font: '700 10px Plus Jakarta Sans',
                color: '#94A3B8',
                letterSpacing: '.12em',
                textTransform: 'uppercase',
              }}
            >
              Tezkor qo'shish
            </div>
            <div
              style={{
                font: '800 20px Plus Jakarta Sans',
                color: '#0F172A',
                marginTop: 3,
              }}
            >
              Tayyor to'plamlar
            </div>
          </div>
          <button
            onClick={toggleAll}
            style={{
              font: '700 12px Manrope',
              color: '#4F46E5',
              background: '#EEF2FF',
              border: 0,
              padding: '8px 12px',
              borderRadius: 9,
              cursor: 'pointer',
            }}
          >
            {allInFilteredSelected ? 'Hammasini bekor qilish' : 'Hammasini tanlash'}
          </button>
        </header>

        <div
          style={{
            display: 'flex',
            gap: 8,
            padding: '0 24px 14px',
            borderBottom: '1px solid #F1F5F9',
            flexWrap: 'wrap',
          }}
        >
          {SX_CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              style={{
                font: '700 11px Manrope',
                color: cat === c.id ? '#fff' : '#64748B',
                background: cat === c.id ? '#4F46E5' : '#F1F5F9',
                border: 0,
                padding: '6px 14px',
                borderRadius: 20,
                cursor: 'pointer',
                transition: 'all 120ms',
              }}
            >
              {t(`subjects.categories.${c.id}`)}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 18 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 12,
            }}
          >
            {filtered.map((tpl) => {
              const isSelected = selectedIds.has(tpl.id);
              const p = palOf(tpl.color || '#4F46E5');
              return (
                <button
                  key={tpl.id}
                  onClick={() => toggle(tpl.id)}
                  style={{
                    textAlign: 'left',
                    padding: '12px 14px',
                    background: isSelected ? p.tint : '#fff',
                    border: isSelected ? `2px solid ${p.base}` : '1.5px solid #E2E8F0',
                    borderRadius: 12,
                    cursor: 'pointer',
                    transition: 'all 140ms ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        font: '700 13px Plus Jakarta Sans',
                        color: '#0F172A',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {getLocalizedName(tpl, locale)}
                    </div>
                    <div
                      style={{
                        font: '700 10px JetBrains Mono',
                        color: p.ink,
                        marginTop: 2,
                      }}
                    >
                      {tpl.shortName}
                    </div>
                  </div>
                  {isSelected && (
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: p.base,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Check size={12} color="#fff" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <footer
          style={{
            padding: 14,
            borderTop: '1px solid #F1F5F9',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
          }}
        >
          <button
            onClick={onClose}
            style={{
              font: '700 12px Manrope',
              color: '#475569',
              background: '#fff',
              border: '1px solid #E2E8F0',
              padding: '10px 14px',
              borderRadius: 9,
              cursor: 'pointer',
            }}
          >
            Bekor
          </button>
          <button
            disabled={selectedIds.size === 0}
            onClick={handleApply}
            style={{
              font: '700 12px Manrope',
              color: '#fff',
              background: selectedIds.size > 0 ? '#4F46E5' : '#CBD5E1',
              border: 0,
              padding: '10px 16px',
              borderRadius: 9,
              cursor: selectedIds.size > 0 ? 'pointer' : 'not-allowed',
            }}
          >
            {selectedIds.size > 0 ? `${selectedIds.size} ta fanni qo'shish` : 'Fanni tanlang'}
          </button>
        </footer>
      </div>
    </div>
  );
}
