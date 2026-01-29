/**
 * SubjectFormDialog Component
 * 
 * Dialog for creating/editing subjects
 * 
 * @module components/subjects/SubjectFormDialog
 */

import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, X, Calendar } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { SubjectFormDialogProps, SubjectFormData, DEFAULT_COLORS, DEFAULT_EMOJIS } from './types';
import { AvailabilityGrid } from '@/components/classes/AvailabilityGrid';
import { Availability } from '@/utils/timeSlots';

// ============================================================================
// COMPONENT
// ============================================================================

interface ExtendedSubjectFormDialogProps extends SubjectFormDialogProps {
    periods?: number[];
    showAvailability?: boolean;
    availability?: Availability;
    onAvailabilityChange?: (availability: Availability) => void;
}

export function SubjectFormDialog({
    open,
    onOpenChange,
    formData,
    onFormChange,
    onSave,
    onCancel,
    isEditing,
    loading = false,
    periods = [1, 2, 3, 4, 5, 6, 7],
    showAvailability: initialShowAvailability = false,
    availability,
    onAvailabilityChange,
}: ExtendedSubjectFormDialogProps) {
    const { t } = useTranslation();
    const [showAvailability, setShowAvailability] = useState(initialShowAvailability);

    // -------------------------------------------------------------------------
    // HANDLERS
    // -------------------------------------------------------------------------
    const handleNameChange = useCallback(
        (value: string) => {
            onFormChange('name', value);
            // Auto-generate short name
            if (value && !formData.shortName) {
                const shortName = value.substring(0, 8).toUpperCase().replace(/\s+/g, '');
                onFormChange('shortName', shortName);
            }
        },
        [onFormChange, formData.shortName]
    );

    const handleSubmit = async () => {
        await onSave();
    };

    // -------------------------------------------------------------------------
    // RENDER
    // -------------------------------------------------------------------------
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? t('subjects.update_subject') : t('subjects.add_subject')}
                    </DialogTitle>
                    <DialogDescription />
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Name Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">{t('subjects.name')}</Label>
                            <Input
                                id="name"
                                placeholder="e.g., Mathematics"
                                value={formData.name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="shortName">{t('subjects.short_name')}</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="shortName"
                                    placeholder="Auto-generated"
                                    value={formData.shortName}
                                    onChange={(e) => onFormChange('shortName', e.target.value)}
                                />
                                {onAvailabilityChange && (
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        type="button"
                                        onClick={() => setShowAvailability(!showAvailability)}
                                        className={cn(
                                            'flex-shrink-0',
                                            showAvailability
                                                ? 'bg-purple-100 border-purple-500 text-purple-700'
                                                : 'border-purple-300 text-purple-600'
                                        )}
                                        title="Toggle availability"
                                    >
                                        <Calendar className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Color and Emoji */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Color Picker */}
                        <div className="space-y-2">
                            <Label>{t('subjects.color')}</Label>
                            <div className="flex flex-wrap gap-2">
                                {DEFAULT_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => onFormChange('color', color)}
                                        className={cn(
                                            'w-8 h-8 rounded-full border-2 transition-transform hover:scale-110',
                                            formData.color === color
                                                ? 'border-gray-900 dark:border-gray-100 scale-110'
                                                : 'border-transparent'
                                        )}
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                            <Input
                                type="text"
                                placeholder="#3B82F6"
                                value={formData.color}
                                onChange={(e) => onFormChange('color', e.target.value)}
                                className="mt-2"
                            />
                        </div>

                        {/* Emoji Picker */}
                        <div className="space-y-2">
                            <Label>{t('subjects.emoji')}</Label>
                            <div className="flex flex-wrap gap-2">
                                {DEFAULT_EMOJIS.map((emoji) => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => onFormChange('emoji', emoji)}
                                        className={cn(
                                            'w-8 h-8 rounded border-2 flex items-center justify-center text-lg transition-transform hover:scale-110',
                                            formData.emoji === emoji
                                                ? 'border-gray-900 dark:border-gray-100 bg-gray-100 dark:bg-gray-800 scale-110'
                                                : 'border-transparent'
                                        )}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                            <Input
                                type="text"
                                placeholder="📖"
                                value={formData.emoji}
                                onChange={(e) => onFormChange('emoji', e.target.value)}
                                className="mt-2"
                            />
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="p-4 border rounded-lg bg-muted/30">
                        <Label className="text-xs text-muted-foreground mb-2 block">{t('subjects.preview')}</Label>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">{formData.emoji}</span>
                            <span className="font-medium">{formData.name || 'Subject Name'}</span>
                            <span
                                className="px-2 py-0.5 rounded text-sm"
                                style={{
                                    backgroundColor: `${formData.color}15`,
                                    color: formData.color,
                                    borderColor: `${formData.color}40`,
                                }}
                            >
                                {formData.shortName || 'CODE'}
                            </span>
                        </div>
                    </div>

                    {/* Availability Grid */}
                    {showAvailability && availability && onAvailabilityChange && (
                        <div className="border rounded-lg p-4 space-y-3 border-purple-300 bg-white dark:bg-gray-950">
                            <p className="text-sm font-medium">{t('subjects.subject_availability')}</p>
                            <AvailabilityGrid
                                availability={availability}
                                onChange={onAvailabilityChange}
                                periods={periods}
                            />
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t">
                        <Button
                            onClick={handleSubmit}
                            disabled={loading || !formData.name.trim()}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? t('subjects.update_subject') : t('subjects.save_subject')}
                        </Button>
                        <Button variant="outline" onClick={onCancel} disabled={loading}>
                            <X className="mr-2 h-4 w-4" />
                            {t('subjects.cancel')}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default SubjectFormDialog;
