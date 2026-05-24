import React from 'react';
import { btnSecondary } from './crudStyles';

export interface PaginationBarProps {
  /** 0-indexed current page. */
  page: number;
  /** Items per page. */
  size: number;
  /** Total page count (server-provided or computed). */
  totalPages: number;
  /** Total element count, shown in the "Jami" label. */
  totalElements: number;
  /** Called with the new 0-indexed page. */
  onPageChange: (page: number) => void;
  /** Called with the new page size. Omit to hide the size selector. */
  onSizeChange?: (size: number) => void;
  /** Size options for the selector. Default [10, 20, 40]. */
  sizeOptions?: number[];
}

/**
 * Unified table pagination footer: size selector + total count + prev / numbered / next.
 *
 * 0-indexed page model — matches `useCrudResource`. Client-side callers convert at the
 * call site (`page={currentPage - 1}`, `onPageChange={(p) => setCurrentPage(p + 1)}`).
 */
export function Pagination({
  page,
  size,
  totalPages,
  totalElements,
  onPageChange,
  onSizeChange,
  sizeOptions = [10, 20, 40],
}: PaginationBarProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {onSizeChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ font: '600 12px Manrope', color: '#64748B' }}>Sahifada:</span>
            <select
              value={size}
              onChange={(e) => onSizeChange(Number(e.target.value))}
              style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #E2E8F0', font: '600 12px Manrope', cursor: 'pointer' }}
            >
              {sizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
        <span style={{ font: '500 12px Manrope', color: '#94A3B8' }}>Jami: {totalElements}</span>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            disabled={page === 0}
            onClick={() => onPageChange(page - 1)}
            style={{ ...btnSecondary, padding: '6px 12px', opacity: page === 0 ? 0.5 : 1 }}
          >
            Oldingi
          </button>
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => onPageChange(i)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: '1px solid #E2E8F0',
                  background: page === i ? '#4F46E5' : '#fff',
                  color: page === i ? '#fff' : '#64748B',
                  font: '700 12px Manrope',
                  cursor: 'pointer',
                  transition: 'all 120ms',
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            disabled={page === totalPages - 1}
            onClick={() => onPageChange(page + 1)}
            style={{ ...btnSecondary, padding: '6px 12px', opacity: page === totalPages - 1 ? 0.5 : 1 }}
          >
            Keyingi
          </button>
        </div>
      )}
    </div>
  );
}

export default Pagination;
