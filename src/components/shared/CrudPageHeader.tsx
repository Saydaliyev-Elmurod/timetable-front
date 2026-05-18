import React from 'react';
import { Search } from 'lucide-react';
import { btnPrimary, btnSecondary, btnDanger, inpSearch, countText } from './crudStyles';

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
  style?: React.CSSProperties;
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

const variantStyle: Record<CrudActionVariant, React.CSSProperties> = {
  primary: btnPrimary,
  secondary: btnSecondary,
  danger: btnDanger,
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
      className={className}
      style={{
        padding: '12px 0',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ position: 'relative', width: searchWidth }}>
        <Search
          size={14}
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#94A3B8',
          }}
        />
        <input
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          style={inpSearch}
        />
      </div>

      {leftExtras}

      <span style={{ flex: 1 }} />

      {typeof count === 'number' && (
        <span style={countText}>
          {count}
          {countLabel ? ` ${countLabel}` : ''}
        </span>
      )}

      {actions.map((action) => {
        const Icon = action.icon;
        const baseStyle = action.style ?? variantStyle[action.variant ?? 'secondary'];
        return (
          <button
            key={action.id}
            onClick={action.onClick}
            disabled={action.disabled}
            style={{ ...baseStyle, opacity: action.disabled ? 0.5 : 1 }}
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
