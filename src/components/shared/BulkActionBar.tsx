import React from 'react';
import { Trash2 } from 'lucide-react';

export interface BulkAction {
  id: string;
  label: string;
  icon?: React.ComponentType<{ size?: number }>;
  onClick: () => void;
}

export interface BulkActionBarProps {
  count: number;
  countLabel?: string;
  actions?: BulkAction[];
  onDelete?: () => void;
  deleteLabel?: string;
  onClear: () => void;
  clearLabel?: string;
}

export function BulkActionBar({
  count,
  countLabel = 'ta tanlandi',
  actions = [],
  onDelete,
  deleteLabel = "O'chirish",
  onClear,
  clearLabel = 'Bekor',
}: BulkActionBarProps) {
  if (count <= 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#0F172A',
        color: '#fff',
        borderRadius: 12,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        zIndex: 55,
        boxShadow: '0 24px 60px -16px rgba(15,23,42,0.4)',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          font: '800 13px JetBrains Mono',
        }}
      >
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            background: '#4F46E5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            font: '800 10px JetBrains Mono',
          }}
        >
          {count}
        </span>
        {countLabel}
      </span>

      {actions.length > 0 && (
        <>
          <span style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.18)' }} />
          <div style={{ display: 'flex', gap: 6 }}>
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={action.onClick}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    font: '700 12px Manrope',
                    color: '#fff',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    padding: '8px 12px',
                    borderRadius: 7,
                    cursor: 'pointer',
                  }}
                >
                  {Icon && <Icon size={13} />}
                  {action.label}
                </button>
              );
            })}
          </div>
        </>
      )}

      {onDelete && (
        <button
          onClick={onDelete}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            font: '700 12px Manrope',
            color: '#fff',
            background: '#DC2626',
            border: 0,
            padding: '8px 12px',
            borderRadius: 7,
            cursor: 'pointer',
          }}
        >
          <Trash2 size={13} />
          {deleteLabel}
        </button>
      )}

      <button
        onClick={onClear}
        style={{
          font: '700 12px Manrope',
          color: 'rgba(255,255,255,0.7)',
          background: 'transparent',
          border: 0,
          padding: '7px 10px',
          borderRadius: 7,
          cursor: 'pointer',
        }}
      >
        {clearLabel}
      </button>
    </div>
  );
}

export default BulkActionBar;
