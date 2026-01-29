/**
 * EntityEditDialog Component
 * 
 * Dialog for editing class, teacher, or subject entities
 * 
 * @module components/lessons/EntityEditDialog
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
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandGroup, CommandInput, CommandItem, CommandEmpty } from '@/components/ui/command';
import { Check } from 'lucide-react';
import { EntityEditDialogProps, DAYS, DAY_LABELS, DEFAULT_PERIODS } from './types';

// ============================================================================
// AVAILABILITY GRID
// ============================================================================

interface AvailabilityEditorProps {
    availability: Record<string, number[]> | undefined;
    periods: number[];
    onToggle: (day: string, period: number) => void;
    onToggleDay: (day: string) => void;
    onTogglePeriod: (period: number) => void;
    onSelectAll: () => void;
    onClearAll: () => void;
    title: string;
}

function AvailabilityEditor({
    availability,
    periods,
    onToggle,
    onToggleDay,
    onTogglePeriod,
    onSelectAll,
    onClearAll,
    title,
}: AvailabilityEditorProps) {
    const { t } = useTranslation();

    return (
        <div className="bg-white rounded-lg border p-3 mt-3">
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">{title}</p>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={onSelectAll}>
                        {t('classes.select_all')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={onClearAll}>
                        {t('classes.clear_all')}
                    </Button>
                </div>
            </div>

            <div className="grid gap-2">
                <div className="grid grid-cols-8 gap-1 mb-1">
                    <div className="p-1"></div>
                    {periods.map((period) => (
                        <button
                            key={period}
                            onClick={() => onTogglePeriod(period)}
                            className="p-1 text-center text-xs font-medium rounded border border-gray-300 hover:bg-gray-100"
                        >
                            P{period}
                        </button>
                    ))}
                </div>

                {DAYS.map((day, dayIndex) => (
                    <div key={day} className="grid grid-cols-8 gap-1">
                        <button
                            onClick={() => onToggleDay(day)}
                            className="p-1 text-xs font-medium capitalize text-left rounded border border-gray-300 hover:bg-gray-100"
                        >
                            {DAY_LABELS[dayIndex]}
                        </button>
                        {periods.map((period) => {
                            const isAvailable = (availability?.[day] || []).includes(period);
                            return (
                                <button
                                    key={period}
                                    onClick={() => onToggle(day, period)}
                                    className={`p-1 text-center rounded border text-xs ${isAvailable
                                            ? 'bg-green-500 border-green-600 text-white'
                                            : 'bg-gray-100 border-gray-300 text-gray-400'
                                        }`}
                                >
                                    {isAvailable ? '✓' : '—'}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ============================================================================
// TEACHER EDITOR
// ============================================================================

interface TeacherEditorProps {
    data: EntityEditDialogProps['data'];
    subjects: any[];
    periods: number[];
    onUpdateField: (field: string, value: any) => void;
    onToggleSubject?: (subjectId: number) => void;
    onRemoveSubject?: (subjectId: number) => void;
    onToggleAvailability: (day: string, period: number) => void;
    onToggleDay: (day: string) => void;
    onTogglePeriod: (period: number) => void;
    onSelectAllAvailability: () => void;
    onClearAllAvailability: () => void;
}

function TeacherEditor({
    data,
    subjects,
    periods,
    onUpdateField,
    onToggleSubject,
    onRemoveSubject,
    onToggleAvailability,
    onToggleDay,
    onTogglePeriod,
    onSelectAllAvailability,
    onClearAllAvailability,
}: TeacherEditorProps) {
    const { t } = useTranslation();

    if (!data) return null;

    return (
        <>
            <Label>{t('teachers.full_name')}</Label>
            <Input
                value={data.fullName || ''}
                onChange={(e) => onUpdateField('fullName', e.target.value)}
            />

            <Label>{t('teachers.short_name_code')}</Label>
            <Input
                value={data.shortName || ''}
                onChange={(e) => onUpdateField('shortName', e.target.value)}
            />

            <div className="space-y-2">
                <Label>{t('teachers.subjects')}</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                            {data.selectedSubjectIds && data.selectedSubjectIds.length > 0 ? (
                                <span>{data.selectedSubjectIds.length} selected</span>
                            ) : (
                                <span className="text-muted-foreground">
                                    {t('teachers.select_subjects_placeholder')}
                                </span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                        <Command>
                            <CommandInput placeholder={t('teachers.search_subjects')} />
                            <CommandEmpty>{t('teachers.no_subject_found')}</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-auto p-2">
                                {subjects.map((subject) => (
                                    <CommandItem
                                        key={subject.id}
                                        value={subject.name}
                                        onSelect={() => onToggleSubject?.(subject.id)}
                                    >
                                        <Check
                                            className={`mr-2 h-4 w-4 ${data.selectedSubjectIds?.includes(subject.id)
                                                    ? 'opacity-100'
                                                    : 'opacity-0'
                                                }`}
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

                {data.selectedSubjectIds && data.selectedSubjectIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {data.selectedSubjectIds.map((subjectId: number) => {
                            const s = subjects.find((x: any) => x.id === subjectId);
                            if (!s) return null;
                            return (
                                <Badge key={subjectId} variant="secondary" className="pl-2 pr-1">
                                    <span className="mr-1">{s.emoji || '📖'}</span>
                                    {s.name}
                                    <button
                                        onClick={() => onRemoveSubject?.(subjectId)}
                                        className="ml-2 text-xs"
                                    >
                                        ✕
                                    </button>
                                </Badge>
                            );
                        })}
                    </div>
                )}
            </div>

            <AvailabilityEditor
                availability={data.availability}
                periods={periods}
                onToggle={onToggleAvailability}
                onToggleDay={onToggleDay}
                onTogglePeriod={onTogglePeriod}
                onSelectAll={onSelectAllAvailability}
                onClearAll={onClearAllAvailability}
                title={t('teachers.teacher_availability')}
            />
        </>
    );
}

// ============================================================================
// CLASS EDITOR
// ============================================================================

interface ClassEditorProps {
    data: EntityEditDialogProps['data'];
    teachers: any[];
    rooms: any[];
    periods: number[];
    onUpdateField: (field: string, value: any) => void;
    onToggleRoom?: (roomId: string) => void;
    onToggleAvailability: (day: string, period: number) => void;
    onToggleDay: (day: string) => void;
    onTogglePeriod: (period: number) => void;
    onSelectAllAvailability: () => void;
    onClearAllAvailability: () => void;
}

function ClassEditor({
    data,
    teachers,
    rooms,
    periods,
    onUpdateField,
    onToggleRoom,
    onToggleAvailability,
    onToggleDay,
    onTogglePeriod,
    onSelectAllAvailability,
    onClearAllAvailability,
}: ClassEditorProps) {
    const { t } = useTranslation();

    if (!data) return null;

    return (
        <>
            <Label>{t('classes.class_name')}</Label>
            <Input
                value={data.name || ''}
                onChange={(e) => onUpdateField('name', e.target.value)}
            />

            <Label>{t('classes.short_name')}</Label>
            <Input
                value={data.shortName || ''}
                onChange={(e) => onUpdateField('shortName', e.target.value)}
            />

            <div className="space-y-2">
                <Label>{t('classes.class_teacher')}</Label>
                <Select
                    value={data.classTeacher || undefined}
                    onValueChange={(value) => onUpdateField('classTeacher', value)}
                    disabled={!teachers || teachers.length === 0}
                >
                    <SelectTrigger>
                        <SelectValue placeholder={t('classes.class_teacher')} />
                    </SelectTrigger>
                    <SelectContent>
                        {teachers.length > 0 ? (
                            teachers.map((teacher: any) =>
                                teacher.id ? (
                                    <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                        {teacher.fullName || teacher.name}
                                    </SelectItem>
                                ) : null
                            )
                        ) : (
                            <div className="p-2 text-sm text-muted-foreground text-center">
                                {t('teachers.no_teachers_found')}
                            </div>
                        )}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>{t('classes.rooms_optional')}</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                            {data.roomIds && data.roomIds.length > 0 ? (
                                <span>{data.roomIds.length} selected</span>
                            ) : (
                                <span className="text-muted-foreground">
                                    {t('classes.select_rooms_placeholder') || 'Select rooms'}
                                </span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                        <Command>
                            <CommandInput placeholder={t('classes.search_rooms') || 'Search rooms...'} />
                            <CommandEmpty>{t('classes.no_rooms')}</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-auto p-2">
                                {rooms.map((room) => (
                                    <CommandItem
                                        key={room.id}
                                        value={room.name}
                                        onSelect={() => onToggleRoom?.(String(room.id))}
                                    >
                                        <Check
                                            className={`mr-2 h-4 w-4 ${data.roomIds?.includes(String(room.id))
                                                    ? 'opacity-100'
                                                    : 'opacity-0'
                                                }`}
                                        />
                                        <span className="mr-2">{room.name}</span>
                                        <span className="text-muted-foreground ml-auto text-xs">
                                            Cap: {room.capacity || 0}
                                        </span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </Command>
                    </PopoverContent>
                </Popover>

                {data.roomIds && data.roomIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {data.roomIds.map((roomId: string) => {
                            const room = rooms.find((r) => String(r.id) === roomId);
                            if (!room) return null;
                            return (
                                <Badge key={roomId} variant="secondary" className="pl-2 pr-1">
                                    {room.name}
                                    <button
                                        onClick={() => onToggleRoom?.(roomId)}
                                        className="ml-2 text-xs"
                                    >
                                        ✕
                                    </button>
                                </Badge>
                            );
                        })}
                    </div>
                )}
            </div>

            <AvailabilityEditor
                availability={data.availability}
                periods={periods}
                onToggle={onToggleAvailability}
                onToggleDay={onToggleDay}
                onTogglePeriod={onTogglePeriod}
                onSelectAll={onSelectAllAvailability}
                onClearAll={onClearAllAvailability}
                title={t('classes.class_availability')}
            />
        </>
    );
}

// ============================================================================
// SUBJECT EDITOR
// ============================================================================

interface SubjectEditorProps {
    data: EntityEditDialogProps['data'];
    onUpdateField: (field: string, value: any) => void;
}

function SubjectEditor({ data, onUpdateField }: SubjectEditorProps) {
    const { t } = useTranslation();

    if (!data) return null;

    return (
        <>
            <Label>{t('subjects.name')}</Label>
            <Input
                value={data.name || ''}
                onChange={(e) => onUpdateField('name', e.target.value)}
            />

            <Label>{t('subjects.short_name')}</Label>
            <Input
                value={data.shortName || ''}
                onChange={(e) => onUpdateField('shortName', e.target.value)}
            />
        </>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function EntityEditDialog({
    open,
    onOpenChange,
    type,
    data,
    loading,
    saving,
    onUpdateField,
    onSave,
    teachers = [],
    subjects = [],
    rooms = [],
    onToggleAvailability,
    onToggleDay,
    onTogglePeriod,
    onSelectAllAvailability,
    onClearAllAvailability,
    onToggleSubject,
    onRemoveSubject,
    onToggleRoom,
    periods = DEFAULT_PERIODS,
}: EntityEditDialogProps) {
    const { t } = useTranslation();

    const handleOpenChange = (isOpen: boolean) => {
        onOpenChange(isOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {type === 'class' && t('lessons.edit_class')}
                        {type === 'teacher' && t('lessons.edit_teacher')}
                        {type === 'subject' && t('lessons.edit_subject')}
                    </DialogTitle>
                    <DialogDescription />
                </DialogHeader>

                <div className="py-4">
                    {loading ? (
                        <div className="p-6 text-center">{t('actions.loading')}</div>
                    ) : (
                        data && (
                            <div className="space-y-4">
                                {type === 'teacher' && (
                                    <TeacherEditor
                                        data={data}
                                        subjects={subjects}
                                        periods={periods}
                                        onUpdateField={onUpdateField}
                                        onToggleSubject={onToggleSubject}
                                        onRemoveSubject={onRemoveSubject}
                                        onToggleAvailability={onToggleAvailability}
                                        onToggleDay={onToggleDay}
                                        onTogglePeriod={onTogglePeriod}
                                        onSelectAllAvailability={onSelectAllAvailability}
                                        onClearAllAvailability={onClearAllAvailability}
                                    />
                                )}

                                {type === 'subject' && (
                                    <SubjectEditor data={data} onUpdateField={onUpdateField} />
                                )}

                                {type === 'class' && (
                                    <ClassEditor
                                        data={data}
                                        teachers={teachers}
                                        rooms={rooms}
                                        periods={periods}
                                        onUpdateField={onUpdateField}
                                        onToggleRoom={onToggleRoom}
                                        onToggleAvailability={onToggleAvailability}
                                        onToggleDay={onToggleDay}
                                        onTogglePeriod={onTogglePeriod}
                                        onSelectAllAvailability={onSelectAllAvailability}
                                        onClearAllAvailability={onClearAllAvailability}
                                    />
                                )}
                            </div>
                        )
                    )}
                </div>

                <DialogFooter>
                    <div className="flex gap-2 w-full justify-end">
                        <Button variant="ghost" onClick={() => onOpenChange(false)}>
                            {t('actions.cancel')}
                        </Button>
                        <Button onClick={onSave} disabled={saving}>
                            {saving ? t('actions.saving') : t('actions.save')}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default EntityEditDialog;
