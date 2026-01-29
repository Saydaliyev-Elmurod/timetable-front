/**
 * SearchBar Component
 * 
 * Reusable search input component
 * 
 * @module components/shared/SearchBar
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/components/ui/utils';
import { SearchBarProps } from './types';

// ============================================================================
// COMPONENT
// ============================================================================

export function SearchBar({
    value,
    onChange,
    placeholder = 'Search...',
    className,
}: SearchBarProps) {
    const handleClear = () => {
        onChange('');
    };

    return (
        <div className={cn('relative', className)}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="pl-10 pr-10"
            />
            {value && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
                    onClick={handleClear}
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Clear</span>
                </Button>
            )}
        </div>
    );
}

export default SearchBar;
