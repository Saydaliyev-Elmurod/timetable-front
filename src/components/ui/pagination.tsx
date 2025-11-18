import React from 'react';
import { Button } from './button';

interface Props {
  currentPage: number; // 1-based
  totalPages: number;
  onPageChange: (page: number) => void;
}

// Renders pagination: 1 2 ... n-1 n (with a sliding window)
export default function Pagination({ currentPage, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  // Build visible page numbers (max 5 slots: either full or windowed)
  const visibleCount = 5;
  const pages: number[] = [];

  if (totalPages <= visibleCount) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, -1); // -1 = ellipsis -> will render last separately
    } else if (currentPage >= totalPages - 2) {
      pages.push(-1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(-1, currentPage - 1, currentPage, currentPage + 1, -1);
    }
  }

  const renderPage = (p: number, idx: number) => {
    if (p === -1) {
      // ellipsis; render clickable shortcut to middle pages where useful
      // if near start, show '...' that goes to page 5; if near end, show page totalPages-4
      const target = currentPage <= 3 ? 5 : currentPage >= totalPages - 2 ? Math.max(1, totalPages - 4) : currentPage;
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
        onClick={() => onPageChange(p)}
        className="w-8 h-8 p-0"
      >
        {p}
      </Button>
    );
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        Previous
      </Button>

      <div className="flex gap-1">
        {pages.map((p, i) => renderPage(p, i))}
        {totalPages > 5 && (
          // Always show last page when totalPages > visibleCount and not already present
          <Button
            key={`last`}
            variant={currentPage === totalPages ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPageChange(totalPages)}
            className="w-8 h-8 p-0"
          >
            {totalPages}
          </Button>
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        Next
      </Button>
    </div>
  );
}
import * as React from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from "lucide-react@0.487.0";

import { cn } from "./utils";
import { Button, buttonVariants } from "./button";

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  );
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ComponentProps<"a">;

function PaginationLink({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) {
  return (
    <a
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(
        buttonVariants({
          variant: isActive ? "outline" : "ghost",
          size,
        }),
        className,
      )}
      {...props}
    />
  );
}

function PaginationPrevious({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn("gap-1 px-2.5 sm:pl-2.5", className)}
      {...props}
    >
      <ChevronLeftIcon />
      <span className="hidden sm:block">Previous</span>
    </PaginationLink>
  );
}

function PaginationNext({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn("gap-1 px-2.5 sm:pr-2.5", className)}
      {...props}
    >
      <span className="hidden sm:block">Next</span>
      <ChevronRightIcon />
    </PaginationLink>
  );
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};
