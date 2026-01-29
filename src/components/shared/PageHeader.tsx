/**
 * PageHeader Component
 * 
 * Reusable page header with title, description, and actions
 * 
 * @module components/shared/PageHeader
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/components/ui/utils';
import { PageHeaderProps, PageHeaderAction } from './types';

// ============================================================================
// COMPONENT
// ============================================================================

export function PageHeader({
    title,
    description,
    actions = [],
    className,
}: PageHeaderProps) {
    return (
        <div className={cn('flex items-start justify-between', className)}>
            <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                )}
            </div>

            {actions.length > 0 && (
                <div className="flex items-center gap-2">
                    {actions.map((action) => {
                        const Icon = action.icon;
                        return (
                            <Button
                                key={action.id}
                                variant={action.primary ? 'default' : (action.variant || 'outline')}
                                onClick={action.onClick}
                                className={cn(
                                    action.primary && 'bg-green-600 hover:bg-green-700'
                                )}
                            >
                                {Icon && <Icon className="mr-2 h-4 w-4" />}
                                {action.label}
                            </Button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default PageHeader;
