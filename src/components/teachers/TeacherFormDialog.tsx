/**
 * TeacherFormDialog Component
 * 
 * Dialog for creating/editing teachers
 * 
 * @module components/teachers/TeacherFormDialog
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
import { Badge } from '@/components/ui/badge';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Loader2, Check, X, Calendar, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { TeacherFormDialogProps, TeacherFormData } from './types';
import { AvailabilityGrid } from '@/components/classes/AvailabilityGrid';

// ============================================================================
// COMPONENT
// ============================================================================

export function TeacherFormDialog({
    open,
    onOpenChange,
    formData,
    onFormChange,
    onSave,
    onCancel,
    isEditing,
    subjects,
    periods,
    loading = false,
    loadingSubjects = false,
}: TeacherFormDialogProps) {
    const { t } = useTranslation();
    const [subjectComboOpen, setSubjectComboOpen] = useState(false);
    const [showAvailability, setShowAvailability] = useState(true);

    // -------------------------------------------------------------------------
    // HANDLERS
    // -------------------------------------------------------------------------
    const handleNameChange = useCallback(
        (value: string) => {
            onFormChange('fullName', value);
            // Auto-generate short name
            if (value) {
                const parts = value.trim().split(' ');
                const shortName = parts.length >= 2
                    ? `${parts[0][0]}.${parts[parts.length - 1]}`
                    : value.substring(0, 8);
                onFormChange('shortName', shortName);
            }
        },
        [onFormChange]
    );

    const toggleSubject = useCallback(
        (subjectId: number) => {
            const current = formData.selectedSubjectIds;
            const updated = current.includes(subjectId)
                ? current.filter((id) => id !== subjectId)
                : [...current, subjectId];
            onFormChange('selectedSubjectIds', updated);
        },
        [formData.selectedSubjectIds, onFormChange]
    );

    const removeSubject = useCallback(
        (subjectId: number) => {
            onFormChange(
                'selectedSubjectIds',
                formData.selectedSubjectIds.filter((id) => id !== subjectId)
            );
        },
        [formData.selectedSubjectIds, onFormChange]
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
                        {isEditing ? t('teachers.update_teacher') : t('teachers.add_teacher')}
                    </DialogTitle>
                    <DialogDescription />
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Name Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">{t('teachers.full_name')}</Label>
                            <Input
                                id="fullName"
                                placeholder="e.g., John Smith"
                                value={formData.fullName}
                                onChange={(e) => handleNameChange(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="shortName">{t('teachers.short_name_code')}</Label>
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
                    </div>

                    {/* Subject Selection */}
                    <div className="space-y-2">
                        <Label>{t('teachers.subjects')}</Label>
                        <Popover open={subjectComboOpen} onOpenChange={setSubjectComboOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={subjectComboOpen}
                                    className="w-full justify-between"
                                    disabled={loadingSubjects}
                                >
                                    {loadingSubjects ? (
                                        <span className="text-muted-foreground">
                                            {t('teachers.loading_subjects')}
                                        </span>
                                    ) : formData.selectedSubjectIds.length > 0 ? (
                                        <span>
                                            {formData.selectedSubjectIds.length} {t('teachers.subject_selected')}
                                            {formData.selectedSubjectIds.length > 1 ? 's' : ''}
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground">
                                            {t('teachers.select_subjects_placeholder')}
                                        </span>
                                    )}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="start">
                                <Command>
                                    <CommandInput placeholder={t('teachers.search_subjects')} />
                                    <CommandEmpty>{t('teachers.no_subject_found')}</CommandEmpty>
                                    <CommandGroup className="max-h-64 overflow-auto">
                                        {subjects.map((subject) => (
                                            <CommandItem
                                                key={subject.id}
                                                value={subject.name}
                                                onSelect={() => toggleSubject(subject.id)}
                                            >
                                                <Check
                                                    className={cn(
                                                        'mr-2 h-4 w-4',
                                                        formData.selectedSubjectIds.includes(subject.id)
                                                            ? 'opacity-100'
                                                            : 'opacity-0'
                                                    )}
                                                />
                                                <span className="mr-2">{subject.emoji || '📖'}</span>
                                                {subject.name}
                                                <Badge variant="outline" className="ml-auto">
                                                    {subject.shortName}
                                                </Badge>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </Command>
                            </PopoverContent>
                        </Popover>

                        {/* Selected Subjects */}
                        {formData.selectedSubjectIds.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {formData.selectedSubjectIds.map((subjectId) => {
                                    const subject = subjects.find((s) => s.id === subjectId);
                                    if (!subject) return null;
                                    return (
                                        <Badge
                                            key={subjectId}
                                            variant="secondary"
                                            className="pl-2 pr-1"
                                            style={{
                                                backgroundColor: subject.color ? `${subject.color}15` : undefined,
                                                color: subject.color,
                                                borderColor: subject.color ? `${subject.color}40` : undefined,
                                            }}
                                        >
                                            <span className="mr-1">{subject.emoji || '📖'}</span>
                                            {subject.name}
                                            <button
                                                type="button"
                                                onClick={() => removeSubject(subjectId)}
                                                className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Availability Grid */}
                    {showAvailability && (
                        <div className="border rounded-lg p-4 space-y-3 border-green-300 bg-white dark:bg-gray-950">
                            <p className="text-sm font-medium">{t('teachers.teacher_availability')}</p>
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
                            disabled={loading || !formData.fullName.trim()}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? t('teachers.update_teacher') : t('teachers.save_teacher')}
                        </Button>
                        <Button variant="outline" onClick={onCancel} disabled={loading}>
                            <X className="mr-2 h-4 w-4" />
                            {t('teachers.cancel')}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default TeacherFormDialog;
