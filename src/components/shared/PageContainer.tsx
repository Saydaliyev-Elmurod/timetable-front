import React from 'react';
import { cn } from '@/components/ui/utils';

export type PageContainerSize = 'default' | 'narrow' | 'wide' | 'full';

interface PageContainerProps {
  /** Max width preset. `default` = 80rem, `narrow` = 56rem (forms), `wide` = 1800px (timetable), `full` = no cap. */
  size?: PageContainerSize;
  /** Make the container fill the available vertical space (for table-heavy pages). */
  fullHeight?: boolean;
  /** Disable the default `gap-6` vertical rhythm — use when the page manages its own internal spacing. */
  noGap?: boolean;
  className?: string;
  children: React.ReactNode;
}

const SIZE_MAP: Record<PageContainerSize, string> = {
  default: 'max-w-7xl',
  narrow: 'max-w-4xl',
  wide: 'max-w-[1800px]',
  full: 'max-w-none',
};

/**
 * Standard page wrapper used by every Dashboard child page.
 *
 * Provides consistent outer padding, max-width, and vertical rhythm so every page
 * has the same distance from the sidebar/header regardless of internal layout.
 */
export function PageContainer({
  size = 'default',
  fullHeight = false,
  noGap = false,
  className,
  children,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full py-6 flex flex-col',
        size === 'full' ? 'px-16' : 'px-6',
        !noGap && 'gap-6',
        fullHeight && 'h-full',
        SIZE_MAP[size],
        className,
      )}
    >
      {children}
    </div>
  );
}

export default PageContainer;
