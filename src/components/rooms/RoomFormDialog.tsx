/**
 * RoomFormDialog Component
 * 
 * Dialog for creating/editing rooms
 * 
 * @module components/rooms/RoomFormDialog
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
import { Loader2, Check, X, Calendar } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { RoomFormDialogProps, RoomFormData } from './types';
import { AvailabilityGrid } from '@/components/classes/AvailabilityGrid';

// ============================================================================
// COMPONENT
// ============================================================================

export function RoomFormDialog({
    open,
    onOpenChange,
    formData,
    onFormChange,
    onSave,
    onCancel,
    isEditing,
    periods,
    loading = false,
}: RoomFormDialogProps) {
    const { t } = useTranslation();
    const [showAvailability, setShowAvailability] = useState(true);

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

    const handleAvailabilityChange = useCallback(
        (availability: typeof formData.availability) => {
            onFormChange('availability', availability);
        },
        [onFormChange]
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
                        {isEditing ? t('rooms.update_room') : t('rooms.add_room')}
                    </DialogTitle>
                    <DialogDescription />
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Name Fields */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">{t('rooms.name')}</Label>
                            <Input
                                id="name"
                                placeholder="e.g., Room 101"
                                value={formData.name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="shortName">{t('rooms.short_name')}</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="shortName"
                                    placeholder="Auto-generated"
                                    value={formData.shortName}
                                    onChange={(e) => onFormChange('shortName', e.target.value)}
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    type="button"
                                    onClick={() => setShowAvailability(!showAvailability)}
                                    className={cn(
                                        'flex-shrink-0',
                                        showAvailability
                                            ? 'bg-green-100 border-green-500 text-green-700'
                                            : 'border-green-300 text-green-600'
                                    )}
                                    title="Toggle availability"
                                >
                                    <Calendar className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="capacity">{t('rooms.capacity')}</Label>
                            <Input
                                id="capacity"
                                type="number"
                                min={1}
                                max={500}
                                placeholder="30"
                                value={formData.capacity}
                                onChange={(e) => onFormChange('capacity', parseInt(e.target.value) || 30)}
                            />
                        </div>
                    </div>

                    {/* Availability Grid */}
                    {showAvailability && (
                        <div className="border rounded-lg p-4 space-y-3 border-blue-300 bg-white dark:bg-gray-950">
                            <p className="text-sm font-medium">{t('rooms.room_availability')}</p>
                            <AvailabilityGrid
                                availability={formData.availability}
                                onChange={handleAvailabilityChange}
                                periods={periods}
                            />
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t">
                        <Button
                            onClick={handleSubmit}
                            disabled={loading || !formData.name.trim()}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? t('rooms.update_room') : t('rooms.save_room')}
                        </Button>
                        <Button variant="outline" onClick={onCancel} disabled={loading}>
                            <X className="mr-2 h-4 w-4" />
                            {t('rooms.cancel')}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default RoomFormDialog;
