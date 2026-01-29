/**
 * DeleteConfirmDialog Component
 * 
 * Reusable delete confirmation dialog
 * 
 * @module components/shared/DeleteConfirmDialog
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { DeleteDialogProps } from './types';

// ============================================================================
// COMPONENT
// ============================================================================

export function DeleteConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    itemName,
    onConfirm,
    loading = false,
}: DeleteDialogProps) {
    const { t } = useTranslation();

    const handleConfirm = async () => {
        await onConfirm();
        onOpenChange(false);
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {title || t('common.confirmDelete')}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {description || t('common.deleteWarning', { name: itemName })}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>
                        {t('common.cancel')}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('common.delete')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default DeleteConfirmDialog;
