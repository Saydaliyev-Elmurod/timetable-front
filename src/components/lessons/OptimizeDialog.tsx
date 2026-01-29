/**
 * OptimizeDialog Component
 * 
 * Dialog for configuring timetable optimization settings
 * 
 * @module components/lessons/OptimizeDialog
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { OptimizeDialogProps, OptimizeConfig } from './types';

// ============================================================================
// COMPONENT
// ============================================================================

export function OptimizeDialog({
    open,
    onOpenChange,
    config,
    onConfigChange,
    onSubmit,
    isOptimizing,
}: OptimizeDialogProps) {
    const { t } = useTranslation();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('lessons.optimize_title')}</DialogTitle>
                    <DialogDescription>{t('lessons.optimize_description')}</DialogDescription>
                </DialogHeader>

                <div className="space-y-3 mt-4">
                    {/* Timetable ID */}
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-sm">{t('lessons.timetable_id')}</Label>
                            <Input
                                value={config.timetableId}
                                onChange={(e) => onConfigChange('timetableId', e.target.value)}
                                placeholder={t('lessons.timetable_id_placeholder')}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Soft Constraint */}
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-sm">{t('lessons.apply_soft_constraint')}</Label>
                            </div>
                            <Switch
                                checked={config.applySoftConstraint}
                                onCheckedChange={(v: boolean) => onConfigChange('applySoftConstraint', v)}
                            />
                        </div>

                        {/* Unscheduled Lessons */}
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-sm">{t('lessons.apply_unscheduled')}</Label>
                            </div>
                            <Switch
                                checked={config.applyUnScheduledLessons}
                                onCheckedChange={(v: boolean) => onConfigChange('applyUnScheduledLessons', v)}
                            />
                        </div>

                        {/* Unscheduled Penalty */}
                        <div>
                            <Label className="text-sm">{t('lessons.apply_unscheduled_penalty')}</Label>
                            <Input
                                type="number"
                                value={String(config.applyUnScheduledLessonsPenalty)}
                                onChange={(e) =>
                                    onConfigChange('applyUnScheduledLessonsPenalty', Number(e.target.value || 0))
                                }
                            />
                        </div>

                        {/* Teacher Continuity */}
                        <div>
                            <Label className="text-sm">{t('lessons.apply_continuity_teacher')}</Label>
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={config.applyContinuityPenaltyTeacher}
                                    onCheckedChange={(v: boolean) => onConfigChange('applyContinuityPenaltyTeacher', v)}
                                />
                                <Input
                                    type="number"
                                    value={String(config.applyContinuityPenaltyTeacherPenalty)}
                                    onChange={(e) =>
                                        onConfigChange('applyContinuityPenaltyTeacherPenalty', Number(e.target.value || 0))
                                    }
                                />
                            </div>
                        </div>

                        {/* Class Continuity */}
                        <div>
                            <Label className="text-sm">{t('lessons.apply_continuity_class')}</Label>
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={config.applyContinuityPenaltyClass}
                                    onCheckedChange={(v: boolean) => onConfigChange('applyContinuityPenaltyClass', v)}
                                />
                                <Input
                                    type="number"
                                    value={String(config.applyContinuityPenaltyClassPenalty)}
                                    onChange={(e) =>
                                        onConfigChange('applyContinuityPenaltyClassPenalty', Number(e.target.value || 0))
                                    }
                                />
                            </div>
                        </div>

                        {/* Balanced Load */}
                        <div>
                            <Label className="text-sm">{t('lessons.apply_balanced_load')}</Label>
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={config.applyBalancedLoad}
                                    onCheckedChange={(v: boolean) => onConfigChange('applyBalancedLoad', v)}
                                />
                                <Input
                                    type="number"
                                    value={String(config.applyBalancedLoadPenalty)}
                                    onChange={(e) =>
                                        onConfigChange('applyBalancedLoadPenalty', Number(e.target.value || 0))
                                    }
                                />
                            </div>
                        </div>

                        {/* Daily Subject Distribution */}
                        <div>
                            <Label className="text-sm">{t('lessons.apply_daily_subject_distribution')}</Label>
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={config.applyDailySubjectDistribution}
                                    onCheckedChange={(v: boolean) => onConfigChange('applyDailySubjectDistribution', v)}
                                />
                                <Input
                                    type="number"
                                    value={String(config.applyDailySubjectDistributionPenalty)}
                                    onChange={(e) =>
                                        onConfigChange('applyDailySubjectDistributionPenalty', Number(e.target.value || 0))
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <div className="flex gap-2 w-full justify-end">
                        <Button variant="ghost" onClick={() => onOpenChange(false)}>
                            {t('actions.cancel')}
                        </Button>
                        <Button onClick={onSubmit} disabled={isOptimizing}>
                            {isOptimizing ? t('lessons.optimizing') : t('lessons.optimize')}
                        </Button>
                    </div>
                </DialogFooter>
                <DialogClose />
            </DialogContent>
        </Dialog>
    );
}

export default OptimizeDialog;
