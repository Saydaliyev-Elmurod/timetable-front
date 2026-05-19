import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import {
  btnDangerCls,
  btnPrimaryCls,
  btnSecondaryCls,
  countTextCls,
  inpSearchCls,
} from './crudStyles';

export type CrudActionVariant = 'primary' | 'secondary' | 'danger';

export interface CrudAction {
  id: string;
  label: string;
  icon?: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  onClick: () => void;
  variant?: CrudActionVariant;
  iconSize?: number;
  iconStrokeWidth?: number;
  disabled?: boolean;
  className?: string;
}

export interface CrudPageHeaderProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  searchWidth?: number;
  leftExtras?: React.ReactNode;
  count?: number;
  countLabel?: string;
  actions?: CrudAction[];
  className?: string;
}

const variantClass: Record<CrudActionVariant, string> = {
  primary: btnPrimaryCls,
  secondary: btnSecondaryCls,
  danger: btnDangerCls,
};

export function CrudPageHeader({
  searchValue,
  onSearchChange,
  searchPlaceholder = '',
  searchWidth = 240,
  leftExtras,
  count,
  countLabel,
  actions = [],
  className,
}: CrudPageHeaderProps) {
  return (
    <div
      className={cn('flex flex-wrap items-center gap-2.5 py-3 shrink-0', className)}
    >
      <div className="relative" style={{ width: searchWidth }}>
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className={inpSearchCls}
        />
      </div>

      {leftExtras}

      <span className="flex-1" />

      {typeof count === 'number' && (
        <span className={countTextCls}>
          {count}
          {countLabel ? ` ${countLabel}` : ''}
        </span>
      )}

      {actions.map((action) => {
        const Icon = action.icon;
        const cls = action.className ?? variantClass[action.variant ?? 'secondary'];
        return (
          <button
            key={action.id}
            onClick={action.onClick}
            disabled={action.disabled}
            className={cls}
          >
            {Icon && (
              <Icon
                size={action.iconSize ?? 14}
                strokeWidth={action.iconStrokeWidth ?? (action.variant === 'primary' ? 2.5 : undefined)}
              />
            )}
            {action.label}
          </button>
        );
      })}
    </div>
  );
}

export default CrudPageHeader;
