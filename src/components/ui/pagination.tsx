import React from 'react';
import { Button } from './button';

interface Props {
  currentPage: number; // 1-based
  totalPages: number;
  onPageChange: (page: number) => void;
}

// Simple numeric pagination with ellipsis and last page visible.
export default function Pagination({ currentPage, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  const visibleCount = 5; // show up to 5 slots in the window (including ellipsis markers)
  const pages: (number | 'ellipsis')[] = [];

  if (totalPages <= visibleCount) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    // always include first page
    pages.push(1);

    const left = Math.max(2, currentPage - 1);
    const right = Math.min(totalPages - 1, currentPage + 1);

    if (left > 2) pages.push('ellipsis');

    for (let p = left; p <= right; p++) pages.push(p);

    if (right < totalPages - 1) pages.push('ellipsis');

    // always include last page
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center gap-1" role="navigation" aria-label="Pagination">
      {pages.map((p, idx) => {
        if (p === 'ellipsis') {
          // Clicking ellipsis jumps a few pages toward the current window
          const target = currentPage < totalPages / 2 ? Math.min(totalPages - 1, currentPage + 2) : Math.max(2, currentPage - 2);
          return (
            <Button key={`e-${idx}`} variant="ghost" size="sm" onClick={() => onPageChange(target)}>
              ...
            </Button>
          );
        }

        return (
          <Button
            key={p}
            variant={currentPage === p ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPageChange(p as number)}
            className="w-8 h-8 p-0"
            aria-current={currentPage === p ? 'page' : undefined}
            aria-label={currentPage === p ? `Page ${p}, current` : `Go to page ${p}`}
          >
            {p}
          </Button>
        );
      })}
    </div>
  );
}
