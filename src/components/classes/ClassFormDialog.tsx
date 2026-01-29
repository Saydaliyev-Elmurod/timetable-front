/**
 * ClassFormDialog Component
 * 
 * Sinf yaratish/tahrirlash uchun dialog form.
 * Inline form yoki dialog sifatida ishlatilishi mumkin.
 * 
 * @module components/classes/ClassFormDialog
 */

import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { AvailabilityGrid } from './AvailabilityGrid';
import {
    ClassFormDialogProps,
    ClassFormData,
    ClassGroup,
} from './types';
import { generateClassShortName } from '@/utils/formatters';

// ============================================================================
// COMPONENT
// ============================================================================

export function ClassFormDialog({
    open,
    onOpenChange,
    formData,
    onFormChange,
    onSave,
    onCancel,
    isEditing,
    teachers,
    rooms,
    periods,
    loading = false,
}: ClassFormDialogProps) {
    const { t } = useTranslation();

    // -------------------------------------------------------------------------
    // FORM HANDLERS
    // -------------------------------------------------------------------------
    const handleNameChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const name = e.target.value;
            onFormChange('name', name);

            // Auto-generate short name if not editing
            if (!isEditing && !formData.shortName) {
                onFormChange('shortName', generateClassShortName(name));
            }
        },
        [formData.shortName, isEditing, onFormChange]
    );

    const handleShortNameChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            onFormChange('shortName', e.target.value);
        },
        [onFormChange]
    );

    const handleTeacherChange = useCallback(
        (value: string) => {
            onFormChange('classTeacher', value === 'none' ? '' : value);
        },
        [onFormChange]
    );

    const handleRoomToggle = useCallback(
        (roomId: string) => {
            const currentRooms = formData.roomIds || [];
            const newRooms = currentRooms.includes(roomId)
                ? currentRooms.filter((id) => id !== roomId)
                : [...currentRooms, roomId];
            onFormChange('roomIds', newRooms);
        },
        [formData.roomIds, onFormChange]
    );

    const handleGroupedChange = useCallback(
        (checked: boolean) => {
            onFormChange('isGrouped', checked);
            if (checked && formData.groups.length === 0) {
                // Add default groups
                onFormChange('groups', [
                    { name: 'Group A', isNew: true },
                    { name: 'Group B', isNew: true },
                ]);
            }
        },
        [formData.groups.length, onFormChange]
    );

    const handleAddGroup = useCallback(() => {
        const newGroup: ClassGroup = {
            name: `Group ${String.fromCharCode(65 + formData.groups.length)}`,
            isNew: true,
        };
        onFormChange('groups', [...formData.groups, newGroup]);
    }, [formData.groups, onFormChange]);

    const handleRemoveGroup = useCallback(
        (index: number) => {
            const newGroups = formData.groups.filter((_, i) => i !== index);
            onFormChange('groups', newGroups);
        },
        [formData.groups, onFormChange]
    );

    const handleGroupNameChange = useCallback(
        (index: number, name: string) => {
            const newGroups = [...formData.groups];
            newGroups[index] = { ...newGroups[index], name };
            onFormChange('groups', newGroups);
        },
        [formData.groups, onFormChange]
    );

    const handleAvailabilityChange = useCallback(
        (availability: typeof formData.availability) => {
            onFormChange('availability', availability);
        },
        [onFormChange]
    );

    // -------------------------------------------------------------------------
    // VALIDATION
    // -------------------------------------------------------------------------
    const isValid = useMemo(() => {
        if (!formData.name.trim()) return false;
        if (!formData.shortName.trim()) return false;
        if (formData.isGrouped && formData.groups.length === 0) return false;
        return true;
    }, [formData]);

    // -------------------------------------------------------------------------
    // RENDER
    // -------------------------------------------------------------------------
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? t('classes.editClass') : t('classes.addNewClass')}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? t('classes.editClassDescription')
                            : t('classes.addNewClassDescription')}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Name & Short Name */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="class-name">{t('common.name')} *</Label>
                            <Input
                                id="class-name"
                                value={formData.name}
                                onChange={handleNameChange}
                                placeholder={t('classes.classNamePlaceholder')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="class-short-name">{t('common.shortName')} *</Label>
                            <Input
                                id="class-short-name"
                                value={formData.shortName}
                                onChange={handleShortNameChange}
                                placeholder={t('classes.shortNamePlaceholder')}
                            />
                        </div>
                    </div>

                    {/* Class Teacher */}
                    <div className="space-y-2">
                        <Label>{t('classes.classTeacher')}</Label>
                        <Select
                            value={formData.classTeacher || 'none'}
                            onValueChange={handleTeacherChange}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={t('classes.selectTeacher')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">{t('common.none')}</SelectItem>
                                {teachers.map((teacher) => (
                                    <SelectItem key={teacher.id} value={String(teacher.id)}>
                                        {teacher.name || teacher.fullName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Rooms */}
                    <div className="space-y-2">
                        <Label>{t('common.rooms')}</Label>
                        <div className="flex flex-wrap gap-2">
                            {rooms.map((room) => {
                                const isSelected = formData.roomIds.includes(String(room.id));
                                return (
                                    <button
                                        key={room.id}
                                        type="button"
                                        onClick={() => handleRoomToggle(String(room.id))}
                                        className={cn(
                                            'px-3 py-1 rounded-full text-sm border transition-colors',
                                            isSelected
                                                ? 'bg-blue-500 text-white border-blue-500'
                                                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                                        )}
                                    >
                                        {room.name || room.shortName}
                                    </button>
                                );
                            })}
                            {rooms.length === 0 && (
                                <span className="text-sm text-gray-500">{t('common.noRoomsAvailable')}</span>
                            )}
                        </div>
                    </div>

                    {/* Groups */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>{t('classes.useGroups')}</Label>
                            <Switch
                                checked={formData.isGrouped}
                                onCheckedChange={handleGroupedChange}
                            />
                        </div>

                        {formData.isGrouped && (
                            <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                                {formData.groups.map((group, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <Input
                                            value={group.name}
                                            onChange={(e) => handleGroupNameChange(index, e.target.value)}
                                            placeholder={`Group ${index + 1}`}
                                            className="flex-1"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveGroup(index)}
                                            className="h-8 w-8 p-0 text-red-500"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAddGroup}
                                    className="w-full"
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    {t('classes.addGroup')}
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Availability */}
                    <div className="space-y-2">
                        <Label>{t('classes.availability')}</Label>
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <AvailabilityGrid
                                availability={formData.availability}
                                onChange={handleAvailabilityChange}
                                periods={periods}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onCancel} disabled={loading}>
                        {t('common.cancel')}
                    </Button>
                    <Button onClick={onSave} disabled={!isValid || loading}>
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {isEditing ? t('common.save') : t('common.create')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ClassFormDialog;
