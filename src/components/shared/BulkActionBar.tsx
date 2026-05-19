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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[55] flex items-center gap-3 px-[14px] py-[10px] rounded-xl bg-slate-900 text-white shadow-[0_24px_60px_-16px_rgba(15,23,42,0.4)]">
      <span className="inline-flex items-center gap-2 font-extrabold text-[13px] font-mono">
        <span className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-md bg-indigo-600 font-extrabold text-[10px] font-mono">
          {count}
        </span>
        {countLabel}
      </span>

      {actions.length > 0 && (
        <>
          <span className="w-px h-[22px] bg-white/20" />
          <div className="flex gap-1.5">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={action.onClick}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md font-bold text-xs text-white bg-white/10 border border-white/15 hover:bg-white/20 transition-colors"
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
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md font-bold text-xs text-white bg-red-600 border-0 hover:bg-red-700 transition-colors"
        >
          <Trash2 size={13} />
          {deleteLabel}
        </button>
      )}

      <button
        onClick={onClear}
        className="px-2.5 py-1.5 rounded-md font-bold text-xs text-white/70 bg-transparent border-0 hover:text-white transition-colors"
      >
        {clearLabel}
      </button>
    </div>
  );
}

export default BulkActionBar;
