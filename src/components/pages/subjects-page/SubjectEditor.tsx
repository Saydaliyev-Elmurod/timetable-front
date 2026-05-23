import React, { useState } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { useTranslation } from '@/i18n/index';
import { SubjectRequest, SubjectResponse } from '@/lib/subjects';
import { palOf, SX_PALETTE, SX_WEIGHT_PRESETS } from './constants';
import {
  AvailState,
  convertFromApiFormat,
  convertToApiFormat,
  getFullAvail,
  getLocalizedName,
  getWeightColor,
  weightLabel,
} from './helpers';
import { AvailGrid, Field } from './ui';
import { inp, stepBtn } from './styles';

type EditorInitial =
  | SubjectResponse
  | { new: true }
  | { bulkWeight: true }
  | { bulkTimeoff: true }
  | null;

interface SubjectEditorProps {
  initial: EditorInitial;
  periods: number[];
  days?: readonly string[];
  onClose: () => void;
  onSave: (data: any) => void;
}

interface SubjectEntry {
  name: string;
  short: string;
}

export function SubjectEditor({ initial, periods, days, onClose, onSave }: SubjectEditorProps) {
  const { locale } = useTranslation();

  const isEdit =
    !!initial && !('bulkWeight' in initial) && !('bulkTimeoff' in initial) && !('new' in initial);
  const isBulkWeight = !!initial && 'bulkWeight' in initial;
  const isBulkTimeoff = !!initial && 'bulkTimeoff' in initial;
  const isBulk = isBulkWeight || isBulkTimeoff;

  const [entries, setEntries] = useState<SubjectEntry[]>(() =>
    isEdit
      ? [{ name: getLocalizedName(initial, locale), short: (initial as SubjectResponse).shortName }]
      : [{ name: '', short: '' }],
  );
  const [color, setColor] = useState<string>(
    isEdit ? (initial as SubjectResponse).color || '#4F46E5' : '#4F46E5',
  );
  const [weight, setWeight] = useState<number>(
    isEdit ? (initial as SubjectResponse).weight ?? 6 : 6,
  );
  const [avail, setAvail] = useState<AvailState>(() =>
    isEdit
      ? convertFromApiFormat((initial as SubjectResponse).availabilities, periods, days)
      : getFullAvail(periods, days),
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
    const filled = entries.filter((e) => e.name.trim().length >= 2);
    if (filled.length === 0) return;

    const requests: SubjectRequest[] = filled.map((e) => ({
      name: e.name.trim(),
      nameUz: e.name.trim(),
      nameRu: e.name.trim(),
      nameEn: e.name.trim(),
      shortName: e.short.trim() || e.name.trim().slice(0, 3).toUpperCase(),
      color,
      weight,
      availabilities: convertToApiFormat(avail),
    }));
    onSave(isEdit ? requests[0] : requests);
  };

  const addEntry = () => setEntries((prev) => [...prev, { name: '', short: '' }]);
  const updateEntry = (i: number, patch: Partial<SubjectEntry>) =>
    setEntries((prev) => prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  const removeEntry = (i: number) =>
    setEntries((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));

  const headerLabel = isBulkWeight
    ? "Vaznni o'zgartirish"
    : isBulkTimeoff
      ? "Vaqtlarni o'zgartirish"
      : isEdit
        ? 'Fanni tahrirlash'
        : "Yangi fan qo'shish";

  const submitLabel = isBulk
    ? "Hammasiga qo'llash"
    : isEdit
      ? 'Saqlash'
      : "Qo'shish";

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.55)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        backdropFilter: 'saturate(140%) blur(4px)',
        animation: 'et-fade 200ms ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 16,
          width: '100%',
          maxWidth: 640,
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 32px 80px -20px rgba(15,23,42,0.4)',
          animation: 'et-pop 220ms cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <header
          style={{
            padding: '18px 22px 16px',
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
              {headerLabel}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              border: 0,
              background: '#F1F5F9',
              borderRadius: 8,
              cursor: 'pointer',
              color: '#475569',
            }}
          >
            <X size={13} strokeWidth={2.5} />
          </button>
        </header>

        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
          className="et-premium-scrollbar"
        >
          {!isBulk && (
            <Field label={isEdit ? 'Fan nomi' : "Fanlar ro'yxati"} required>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {entries.map((e, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={e.name}
                      onChange={(ev) => updateEntry(i, { name: ev.target.value })}
                      placeholder="Nomi"
                      style={inp}
                      autoFocus={i === 0}
                    />
                    <input
                      value={e.short}
                      onChange={(ev) =>
                        updateEntry(i, { short: ev.target.value.toUpperCase().slice(0, 5) })
                      }
                      placeholder="Qisqa"
                      style={{ ...inp, width: 80, fontFamily: 'JetBrains Mono' }}
                    />
                    {!isEdit && entries.length > 1 && (
                      <button
                        onClick={() => removeEntry(i)}
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 9,
                          border: '1.5px solid #E2E8F0',
                          color: '#94A3B8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
                {!isEdit && (
                  <button
                    onClick={addEntry}
                    style={{
                      alignSelf: 'flex-start',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      font: '700 12px Manrope',
                      color: '#4F46E5',
                      background: '#EEF2FF',
                      border: '1.5px dashed #C7D2FE',
                      padding: '8px 12px',
                      borderRadius: 9,
                      marginTop: 4,
                    }}
                  >
                    <Plus size={14} /> Yana bir fan
                  </button>
                )}
              </div>
            </Field>
          )}

          {!isBulk && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
              <Field label="Rang">
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 6,
                    padding: 6,
                    border: '1.5px solid #E2E8F0',
                    borderRadius: 9,
                    background: '#fff',
                  }}
                >
                  {SX_PALETTE.map((P) => (
                    <button
                      key={P.id}
                      onClick={() => setColor(P.base)}
                      style={{
                        width: 30,
                        height: 30,
                        background: P.base,
                        border: P.base === color ? '2px solid #0F172A' : '2px solid transparent',
                        borderRadius: 7,
                        cursor: 'pointer',
                        position: 'relative',
                        boxShadow: P.base === color ? `0 0 0 2px ${P.tint}` : 'none',
                      }}
                    >
                      {P.base === color && (
                        <Check
                          size={12}
                          stroke="#fff"
                          strokeWidth={3}
                          style={{ position: 'absolute', inset: 0, margin: 'auto' }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {(isBulkWeight || !isBulk) && (
            <Field label="Vazn (1–10)">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    display: 'inline-flex',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: 9,
                    overflow: 'hidden',
                  }}
                >
                  <button onClick={() => setWeight(Math.max(1, weight - 1))} style={stepBtn}>
                    −
                  </button>
                  <input
                    readOnly
                    value={weight}
                    style={{
                      width: 50,
                      border: 0,
                      textAlign: 'center',
                      font: '800 16px JetBrains Mono',
                    }}
                  />
                  <button onClick={() => setWeight(Math.min(10, weight + 1))} style={stepBtn}>
                    +
                  </button>
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      height: 8,
                      borderRadius: 9,
                      background: getWeightColor(weight).tint,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${weight * 10}%`,
                        height: '100%',
                        background: getWeightColor(weight).base,
                        transition: 'width 200ms',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      font: '700 11px Plus Jakarta Sans',
                      color: getWeightColor(weight).ink,
                      marginTop: 4,
                    }}
                  >
                    {weightLabel(weight)}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                {SX_WEIGHT_PRESETS.map((W) => {
                  const on = weight === W.v;
                  const wc = getWeightColor(W.v);
                  return (
                    <button
                      key={W.v}
                      onClick={() => setWeight(W.v)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 7,
                        font: '600 12px Manrope',
                        color: on ? wc.ink : '#475569',
                        background: on ? wc.tint : '#fff',
                        border: `1px solid ${on ? wc.base : '#E2E8F0'}`,
                        padding: '6px 11px',
                        borderRadius: 7,
                        cursor: 'pointer',
                        transition: 'all 120ms',
                      }}
                    >
                      <span
                        style={{
                          font: '800 10px JetBrains Mono',
                          color: on ? '#fff' : '#94A3B8',
                          background: on ? wc.base : '#F1F5F9',
                          padding: '1px 5px',
                          borderRadius: 3,
                          minWidth: 18,
                          textAlign: 'center',
                        }}
                      >
                        {W.v}
                      </span>
                      {W.label}
                    </button>
                  );
                })}
              </div>
            </Field>
          )}

          {(isBulkTimeoff || !isBulk) && (
            <Field label="Mavjud dars soatlari">
              <div
                style={{
                  background: '#FAFBFD',
                  border: '1px solid #F1F5F9',
                  borderRadius: 10,
                  padding: 12,
                }}
              >
                <AvailGrid avail={avail} periods={periods} days={days} onChange={setAvail} />
              </div>
            </Field>
          )}
        </div>

        <footer
          style={{
            padding: 14,
            borderTop: '1px solid #F1F5F9',
            display: 'flex',
            gap: 8,
            justifyContent: 'flex-end',
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
            onClick={handleInternalSave}
            style={{
              font: '700 12px Manrope',
              color: '#fff',
              background: p.base,
              border: 0,
              padding: '10px 16px',
              borderRadius: 9,
              cursor: 'pointer',
              boxShadow: `0 4px 12px -4px ${p.base}`,
            }}
          >
            {submitLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}
