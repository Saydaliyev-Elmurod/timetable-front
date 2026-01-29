/**
 * ClassBatchCreateDialog Component
 * 
 * Bir nechta sinflarni bir vaqtda yaratish uchun dialog.
 * 
 * @module components/classes/ClassBatchCreateDialog
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wand2 } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import {
    BatchCreateDialogProps,
    GeneratedClassPreview,
    LATIN_LETTERS,
    CYRILLIC_LETTERS,
} from './types';

// ============================================================================
// COMPONENT
// ============================================================================

export function ClassBatchCreateDialog({
    open,
    onOpenChange,
    gradeList,
    gradeQuantities,
    onGradeQuantityChange,
    characterSet,
    onCharacterSetChange,
    mode,
    onModeChange,
    generatedClasses,
    onGenerate,
    onSave,
    onCancel,
    loading = false,
}: BatchCreateDialogProps) {
    const { t } = useTranslation();

    // -------------------------------------------------------------------------
    // COMPUTED
    // -------------------------------------------------------------------------
    const totalClasses = useMemo(() => {
        return Object.values(gradeQuantities).reduce((sum, qty) => sum + qty, 0);
    }, [gradeQuantities]);

    const hasClasses = useMemo(() => {
        return generatedClasses.length > 0;
    }, [generatedClasses]);

    // -------------------------------------------------------------------------
    // HANDLERS
    // -------------------------------------------------------------------------
    const handleQuantityChange = useCallback(
        (grade: number, value: string) => {
            const qty = parseInt(value, 10) || 0;
            onGradeQuantityChange(grade, Math.max(0, Math.min(10, qty)));
        },
        [onGradeQuantityChange]
    );

    const handleIncrement = useCallback(
        (grade: number) => {
            const current = gradeQuantities[grade] || 0;
            onGradeQuantityChange(grade, Math.min(10, current + 1));
        },
        [gradeQuantities, onGradeQuantityChange]
    );

    const handleDecrement = useCallback(
        (grade: number) => {
            const current = gradeQuantities[grade] || 0;
            onGradeQuantityChange(grade, Math.max(0, current - 1));
        },
        [gradeQuantities, onGradeQuantityChange]
    );

    // -------------------------------------------------------------------------
    // RENDER
    // -------------------------------------------------------------------------
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t('classes.batchCreate')}</DialogTitle>
                    <DialogDescription>
                        {t('classes.batchCreateDescription')}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Mode Selection */}
                    <div className="space-y-3">
                        <Label>{t('classes.batchMode')}</Label>
                        <RadioGroup
                            value={mode}
                            onValueChange={(value) => onModeChange(value as typeof mode)}
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="simple" id="mode-simple" />
                                <Label htmlFor="mode-simple" className="cursor-pointer">
                                    {t('classes.simpleMode')}
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="quick" id="mode-quick" />
                                <Label htmlFor="mode-quick" className="cursor-pointer">
                                    {t('classes.quickMode')}
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Character Set */}
                    <div className="space-y-3">
                        <Label>{t('classes.characterSet')}</Label>
                        <RadioGroup
                            value={characterSet}
                            onValueChange={(value) => onCharacterSetChange(value as typeof characterSet)}
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="latin" id="charset-latin" />
                                <Label htmlFor="charset-latin" className="cursor-pointer">
                                    Latin (A, B, C...)
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="cyrillic" id="charset-cyrillic" />
                                <Label htmlFor="charset-cyrillic" className="cursor-pointer">
                                    Cyrillic (А, Б, В...)
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Grade Quantities */}
                    <div className="space-y-3">
                        <Label>
                            {t('classes.selectGrades')} ({totalClasses} {t('classes.classesTotal')})
                        </Label>
                        <div className="grid grid-cols-6 gap-3">
                            {gradeList.map((grade) => (
                                <div
                                    key={grade}
                                    className="flex flex-col items-center p-2 border rounded-lg"
                                >
                                    <span className="text-sm font-medium mb-1">
                                        {t('classes.grade')} {grade}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => handleDecrement(grade)}
                                            className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
                                            disabled={gradeQuantities[grade] === 0}
                                        >
                                            -
                                        </button>
                                        <Input
                                            type="number"
                                            min={0}
                                            max={10}
                                            value={gradeQuantities[grade] || 0}
                                            onChange={(e) => handleQuantityChange(grade, e.target.value)}
                                            className="w-12 h-6 text-center text-sm px-1"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleIncrement(grade)}
                                            className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
                                            disabled={gradeQuantities[grade] >= 10}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Generate Button */}
                    <div className="flex justify-center">
                        <Button
                            onClick={onGenerate}
                            disabled={totalClasses === 0}
                            className="min-w-[200px]"
                        >
                            <Wand2 className="h-4 w-4 mr-2" />
                            {t('classes.generateClasses')} ({totalClasses})
                        </Button>
                    </div>

                    {/* Preview */}
                    {hasClasses && (
                        <div className="space-y-3">
                            <Label>{t('classes.preview')}</Label>
                            <div className="max-h-[200px] overflow-y-auto border rounded-lg p-3">
                                <div className="flex flex-wrap gap-2">
                                    {generatedClasses.map((cls, index) => (
                                        <Badge key={index} variant="outline" className="text-sm">
                                            {cls.name} ({cls.shortName})
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                            <p className="text-sm text-gray-500">
                                {generatedClasses.length} {t('classes.classesWillBeCreated')}
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onCancel} disabled={loading}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={onSave}
                        disabled={!hasClasses || loading}
                    >
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {t('classes.createAll')} ({generatedClasses.length})
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ClassBatchCreateDialog;
