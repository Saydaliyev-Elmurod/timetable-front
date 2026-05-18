import React, { useState } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../ui/command';
import { cn } from '../ui/utils';

export interface MultiSelectItem {
  id: number;
  name: string;
}

interface MultiSelectComboboxProps<T extends MultiSelectItem> {
  items: T[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  onRemove?: (id: number) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  triggerLabel?: (count: number) => string;
  size?: 'default' | 'sm';
  align?: 'start' | 'center' | 'end';
  popoverWidth?: string;
  showChips?: boolean;
}

export function MultiSelectCombobox<T extends MultiSelectItem>({
  items,
  selectedIds,
  onToggle,
  onRemove,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No items found.',
  triggerLabel,
  size = 'default',
  align = 'start',
  popoverWidth = 'w-full',
  showChips = true,
}: MultiSelectComboboxProps<T>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()),
  );

  const defaultTriggerLabel = (count: number) =>
    count > 0 ? `${count} selected` : placeholder;

  const renderChip = (id: number) => {
    const item = items.find((it) => it.id === id);
    if (!item) return null;
    const chipSize = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2 py-1';
    const iconSize = size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3';
    return (
      <Badge key={id} variant="secondary" className={cn('flex items-center gap-1', chipSize)}>
        {item.name}
        {onRemove && (
          <button
            type="button"
            onClick={() => onRemove(id)}
            className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
          >
            <X className={iconSize} />
          </button>
        )}
      </Badge>
    );
  };

  return (
    <div className="space-y-2">
      {showChips && selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30">
          {selectedIds.map(renderChip)}
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            size={size}
            aria-expanded={open}
            className={cn('w-full justify-between', size === 'sm' && 'text-xs')}
          >
            {(triggerLabel ?? defaultTriggerLabel)(selectedIds.length)}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className={cn(popoverWidth, 'p-0')} align={align}>
          <Command>
            <CommandInput
              placeholder={searchPlaceholder}
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {filtered.map((item) => (
                  <CommandItem
                    key={item.id}
                    onSelect={() => onToggle(item.id)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedIds.includes(item.id) ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    {item.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
