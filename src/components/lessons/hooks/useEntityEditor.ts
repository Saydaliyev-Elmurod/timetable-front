/**
 * useEntityEditor Hook
 * 
 * Handles entity (class/teacher/subject) editing state and logic
 * 
 * @module components/lessons/hooks/useEntityEditor
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { TeacherService } from '@/lib/teachers';
import { SubjectService } from '@/lib/subjects';
import { apiCall, getApiUrl } from '@/lib/api';
import { convertFromTimeSlots, convertToTimeSlots } from '@/utils/timeSlots';
import { EntityType, EntityEditData, DAYS, DEFAULT_PERIODS } from '../types';

export interface UseEntityEditorReturn {
    // State
    open: boolean;
    type: EntityType | null;
    id: number | null;
    data: EntityEditData | null;
    loading: boolean;
    saving: boolean;

    // Entity lists
    teachers: any[];
    subjects: any[];
    rooms: any[];

    // Actions
    openEditor: (type: EntityType, id: number) => Promise<void>;
    closeEditor: () => void;
    updateField: (field: string, value: any) => void;
    saveEntity: () => Promise<void>;

    // Availability handlers
    toggleAvailability: (day: string, period: number) => void;
    toggleDay: (day: string) => void;
    togglePeriod: (period: number) => void;
    selectAllAvailability: () => void;
    clearAllAvailability: () => void;

    // Teacher specific
    toggleSubject: (subjectId: number) => void;
    removeSubject: (subjectId: number) => void;

    // Class specific
    toggleRoom: (roomId: string) => void;
}

export function useEntityEditor(onSaveSuccess?: () => void): UseEntityEditorReturn {
    const { t } = useTranslation();
    const periods = DEFAULT_PERIODS;

    // State
    const [open, setOpen] = useState(false);
    const [type, setType] = useState<EntityType | null>(null);
    const [id, setId] = useState<number | null>(null);
    const [data, setData] = useState<EntityEditData | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Entity lists
    const [teachers, setTeachers] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);

    // Open editor and fetch entity data
    const openEditor = useCallback(async (entityType: EntityType, entityId: number) => {
        setOpen(true);
        setType(entityType);
        setId(entityId);
        setLoading(true);
        setData(null);

        try {
            if (entityType === 'teacher') {
                const teacherData = await TeacherService.getById(entityId);

                // Fetch subjects for selector
                try {
                    const subs = await SubjectService.getAll();
                    setSubjects(Array.isArray(subs) ? subs : []);
                } catch {
                    setSubjects([]);
                }

                setData({
                    fullName: teacherData.fullName,
                    shortName: teacherData.shortName,
                    selectedSubjectIds: Array.isArray(teacherData.subjects)
                        ? teacherData.subjects.map((s: any) => s.id)
                        : [],
                    availability: convertFromTimeSlots(teacherData.availabilities),
                    isActive: (teacherData as any).isActive ?? true,
                    raw: teacherData,
                });

            } else if (entityType === 'subject') {
                const subjectData = await SubjectService.getById(entityId);
                setData({
                    name: subjectData.name,
                    shortName: subjectData.shortName,
                    raw: subjectData,
                });

            } else if (entityType === 'class') {
                const url = `${getApiUrl('CLASSES')}/${entityId}`;
                const res = await apiCall<any>(url);
                if (res.error) throw res.error;
                const cls = res.data;

                // Fetch teachers and rooms
                try {
                    const tRes = await TeacherService.getAll();
                    setTeachers(Array.isArray(tRes) ? tRes : []);
                } catch {
                    setTeachers([]);
                }

                try {
                    const roomsRes = await apiCall<any>(`${getApiUrl('ROOMS')}/all`);
                    setRooms(Array.isArray(roomsRes?.data) ? roomsRes.data : []);
                } catch {
                    setRooms([]);
                }

                setData({
                    name: cls.name,
                    shortName: cls.shortName,
                    classTeacher: cls.teacher?.id ? String(cls.teacher.id) : '',
                    roomIds: Array.isArray(cls.rooms) ? cls.rooms.map((r: any) => String(r.id)) : [],
                    availability: convertFromTimeSlots(cls?.availabilities),
                    isActive: cls.isActive ?? true,
                    raw: cls,
                });
            }
        } catch (err) {
            console.error('Failed to load entity for edit', err);
            toast.error(t('lessons.failed_to_load_entity'));
            closeEditor();
        } finally {
            setLoading(false);
        }
    }, [t]);

    const closeEditor = useCallback(() => {
        setOpen(false);
        setType(null);
        setId(null);
        setData(null);
    }, []);

    const updateField = useCallback((field: string, value: any) => {
        setData((prev) => prev ? { ...prev, [field]: value } : null);
    }, []);

    // Save entity
    const saveEntity = useCallback(async () => {
        if (!type || !id || !data) return;

        setSaving(true);
        try {
            if (type === 'teacher') {
                await TeacherService.update(id, {
                    fullName: data.fullName || '',
                    shortName: data.shortName || '',
                    subjects: Array.isArray(data.selectedSubjectIds)
                        ? data.selectedSubjectIds
                        : (data.raw?.subjects || []).map((s: any) => s.id) || [],
                    deletedSubjects: [],
                    availabilities: convertToTimeSlots(data.availability || {}),
                });
                toast.success(t('lessons.teacher_updated'));

            } else if (type === 'subject') {
                await SubjectService.update(id, {
                    name: data.name || '',
                    shortName: data.shortName || '',
                    availabilities: data.raw?.availabilities || [],
                });
                toast.success(t('lessons.subject_updated'));

            } else if (type === 'class') {
                const url = `${getApiUrl('CLASSES')}/${id}`;
                const body: any = {
                    name: data.name || '',
                    shortName: data.shortName || '',
                    isActive: data.isActive ?? true,
                    teacherId: data.classTeacher ? parseInt(data.classTeacher, 10) : null,
                    rooms: Array.isArray(data.roomIds)
                        ? data.roomIds.map((r: any) => ({ id: parseInt(r, 10) }))
                        : [],
                    availabilities: convertToTimeSlots(data.availability || {}),
                };

                await apiCall(url, {
                    method: 'PUT',
                    body: JSON.stringify(body),
                });
                toast.success(t('lessons.class_updated'));
            }

            closeEditor();
            onSaveSuccess?.();
        } catch (err) {
            console.error('Failed to save entity', err);
            toast.error(t('lessons.failed_to_save'));
        } finally {
            setSaving(false);
        }
    }, [type, id, data, closeEditor, onSaveSuccess, t]);

    // Availability handlers
    const toggleAvailability = useCallback((day: string, period: number) => {
        setData((prev) => {
            if (!prev) return null;
            const availability = { ...(prev.availability || {}) };
            availability[day] = availability[day] || [];
            availability[day] = availability[day].includes(period)
                ? availability[day].filter((p: number) => p !== period)
                : [...availability[day], period].sort((a: number, b: number) => a - b);
            return { ...prev, availability };
        });
    }, []);

    const toggleDay = useCallback((day: string) => {
        setData((prev) => {
            if (!prev) return null;
            const availability = { ...(prev.availability || {}) };
            const dayPeriods = availability[day] || [];
            const allSelected = periods.every(p => dayPeriods.includes(p));
            availability[day] = allSelected ? [] : [...periods];
            return { ...prev, availability };
        });
    }, [periods]);

    const togglePeriod = useCallback((period: number) => {
        setData((prev) => {
            if (!prev) return null;
            const availability = { ...(prev.availability || {}) };
            const isSelected = DAYS.some(day => (availability[day] || []).includes(period));
            DAYS.forEach(day => {
                availability[day] = availability[day] || [];
                if (isSelected) {
                    availability[day] = availability[day].filter((p: number) => p !== period);
                } else {
                    if (!availability[day].includes(period)) {
                        availability[day] = [...availability[day], period].sort((a: number, b: number) => a - b);
                    }
                }
            });
            return { ...prev, availability };
        });
    }, []);

    const selectAllAvailability = useCallback(() => {
        setData((prev) => {
            if (!prev) return null;
            const availability: Record<string, number[]> = {};
            DAYS.forEach(day => availability[day] = [...periods]);
            return { ...prev, availability };
        });
    }, [periods]);

    const clearAllAvailability = useCallback(() => {
        setData((prev) => {
            if (!prev) return null;
            const availability: Record<string, number[]> = {};
            DAYS.forEach(day => availability[day] = []);
            return { ...prev, availability };
        });
    }, []);

    // Teacher subject handlers
    const toggleSubject = useCallback((subjectId: number) => {
        setData((prev) => {
            if (!prev) return null;
            const current = Array.isArray(prev.selectedSubjectIds) ? [...prev.selectedSubjectIds] : [];
            const idx = current.indexOf(subjectId);
            if (idx === -1) current.push(subjectId);
            else current.splice(idx, 1);
            return { ...prev, selectedSubjectIds: current };
        });
    }, []);

    const removeSubject = useCallback((subjectId: number) => {
        setData((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                selectedSubjectIds: (prev.selectedSubjectIds || []).filter(s => s !== subjectId),
            };
        });
    }, []);

    // Class room handlers
    const toggleRoom = useCallback((roomId: string) => {
        setData((prev) => {
            if (!prev) return null;
            const current = Array.isArray(prev.roomIds) ? [...prev.roomIds] : [];
            const idx = current.indexOf(roomId);
            if (idx === -1) current.push(roomId);
            else current.splice(idx, 1);
            return { ...prev, roomIds: current };
        });
    }, []);

    return {
        open,
        type,
        id,
        data,
        loading,
        saving,
        teachers,
        subjects,
        rooms,
        openEditor,
        closeEditor,
        updateField,
        saveEntity,
        toggleAvailability,
        toggleDay,
        togglePeriod,
        selectAllAvailability,
        clearAllAvailability,
        toggleSubject,
        removeSubject,
        toggleRoom,
    };
}
