/**
 * useTimetableData Hook
 * 
 * Manages timetable data fetching and processing
 * 
 * @module components/timetable/hooks/useTimetableData
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { apiCall } from '@/lib/api';
import { organizationApi } from '@/api/organizationApi';
import { initializeMockLessons } from '@/components/api/timetableActionApi';
import {
    TimetableDataEntity,
    Lesson,
    UnplacedLesson,
} from '../types';
import { DEFAULT_TIME_SLOTS } from '../constants';

export interface UseTimetableDataReturn {
    // Data
    scheduledLessons: Lesson[];
    unplacedLessons: UnplacedLesson[];
    timetableData: TimetableDataEntity[];

    // Derived data
    allClasses: string[];
    allTeachers: string[];
    allRooms: string[];
    timeSlots: number[];

    // State
    isLoading: boolean;
    error: string | null;
    timetableVersion: number;

    // Stats
    scheduleIntegrity: number;
    conflicts: number;

    // Actions
    setScheduledLessons: React.Dispatch<React.SetStateAction<Lesson[]>>;
    setUnplacedLessons: React.Dispatch<React.SetStateAction<UnplacedLesson[]>>;
    setTimetableVersion: React.Dispatch<React.SetStateAction<number>>;
    fetchTimetableData: (id: string) => Promise<void>;
}

export function useTimetableData(timetableId?: string): UseTimetableDataReturn {
    // API Data State
    const [timetableData, setTimetableData] = useState<TimetableDataEntity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timetableVersion, setTimetableVersion] = useState(1);

    // Processed data
    const [scheduledLessons, setScheduledLessons] = useState<Lesson[]>([]);
    const [unplacedLessons, setUnplacedLessons] = useState<UnplacedLesson[]>([]);
    const [companyPeriods, setCompanyPeriods] = useState<number[]>([]);

    // Process API data into internal format
    const processAPIData = useCallback((data: TimetableDataEntity[]) => {
        const scheduled: Lesson[] = [];
        const unplaced: UnplacedLesson[] = [];

        data.forEach((entry) => {
            // Handle Scheduled Slots
            if (entry.slotDetails && entry.slotDetails.length > 0) {
                entry.slotDetails.forEach((detail, index) => {
                    const classInfo = detail.originalLessonData?.class;

                    if (!classInfo && !entry.classId) {
                        console.warn('Missing class info for scheduled lesson', entry);
                        return;
                    }

                    const className = classInfo?.shortName || `Class ${entry.classId}`;
                    const classId = classInfo?.id || entry.classId;
                    const lessonId = detail.lessonId ? `${detail.lessonId}` : `${entry.id}-${index}`;

                    scheduled.push({
                        id: lessonId,
                        subject: detail.subject.name,
                        subjectId: detail.subject.id,
                        teacher: detail.teacher?.fullName || 'No Teacher',
                        teacherId: detail.teacher?.id || 0,
                        teacherShort: detail.teacher?.fullName || '',
                        room: detail.room ? detail.room.name : 'No Room',
                        roomId: detail.room ? detail.room.id : 0,
                        class: className,
                        classId: classId,
                        day: entry.dayOfWeek,
                        timeSlot: entry.hour,
                        isLocked: false,
                        groupName: detail.group?.name,
                        groupId: detail.group?.id,
                        weekIndex: entry.weekIndex,
                        isBiWeekly: entry.weekIndex !== null,
                        rawDetails: detail,
                    });
                });
            }

            // Handle Unscheduled Data
            if (entry.unscheduledData) {
                const ud = entry.unscheduledData;
                const roomName =
                    ud.room && ud.room.length > 0
                        ? ud.room.map((r) => r.name).join(', ')
                        : 'TBD';

                unplaced.push({
                    id: entry.id,
                    subject: ud.subject.name,
                    subjectId: ud.subject.id,
                    teacher: ud.teacher?.fullName || 'No Teacher',
                    teacherId: ud.teacher?.id || 0,
                    teacherShort: ud.teacher?.fullName || '',
                    room: roomName,
                    roomId: 0,
                    class: ud.classInfo.shortName,
                    classId: ud.classInfo.id,
                    isLocked: false,
                    reason: `Missing ${ud.missingCount} out of ${ud.requiredCount} required lessons`,
                    requiredCount: ud.requiredCount,
                    scheduledCount: ud.scheduledCount,
                    missingCount: ud.missingCount,
                });
            }
        });

        setScheduledLessons(scheduled);
        setUnplacedLessons(unplaced);
    }, []);

    // Fetch timetable data
    const fetchTimetableData = useCallback(async (id: string) => {
        try {
            setIsLoading(true);
            setError(null);

            const res = await apiCall<TimetableDataEntity[]>(
                `http://localhost:8080/api/timetable/v1/timetable/${id}`
            );

            if (res.error) {
                throw res.error;
            }

            const data: TimetableDataEntity[] = res.data || [];
            setTimetableData(data);
            processAPIData(data);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to fetch timetable data';
            setError(errorMessage);
            toast.error(errorMessage);
            setScheduledLessons([]);
            setUnplacedLessons([]);
        } finally {
            setIsLoading(false);
        }
    }, [processAPIData]);

    // Fetch organization settings
    useEffect(() => {
        const fetchOrganizationSettings = async () => {
            try {
                const org = await organizationApi.get();
                if (org && org.periods) {
                    const nonBreakPeriodsCount = org.periods.filter((p: any) => !p.isBreak).length;
                    const newPeriods = Array.from({ length: nonBreakPeriodsCount }, (_, i) => i + 1);
                    if (newPeriods.length > 0) {
                        setCompanyPeriods(newPeriods);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch organization settings:', error);
            }
        };
        fetchOrganizationSettings();
    }, []);

    // Fetch timetable on mount
    useEffect(() => {
        if (timetableId) {
            fetchTimetableData(timetableId);
        }
    }, [timetableId, fetchTimetableData]);

    // Initialize mock lessons
    useEffect(() => {
        if (scheduledLessons.length > 0) {
            initializeMockLessons(scheduledLessons);
        }
    }, [scheduledLessons.length]);

    // Derived data
    const allClasses = useMemo(
        () => Array.from(new Set(scheduledLessons.map((l) => l.class))).sort(),
        [scheduledLessons]
    );

    const allTeachers = useMemo(
        () => Array.from(new Set(scheduledLessons.map((l) => l.teacher))).sort(),
        [scheduledLessons]
    );

    const allRooms = useMemo(
        () => Array.from(new Set(scheduledLessons.map((l) => l.room))).sort(),
        [scheduledLessons]
    );

    const timeSlots = useMemo(() => {
        const scheduledSlots = new Set(
            scheduledLessons.map((l) => l.timeSlot).filter(Boolean) as number[]
        );
        companyPeriods.forEach((p) => scheduledSlots.add(p));

        if (scheduledSlots.size === 0) {
            return DEFAULT_TIME_SLOTS;
        }

        return Array.from(scheduledSlots).sort((a, b) => a - b);
    }, [scheduledLessons, companyPeriods]);

    // Stats
    const totalLessons = scheduledLessons.length + unplacedLessons.length;
    const scheduleIntegrity =
        totalLessons > 0 ? Math.round((scheduledLessons.length / totalLessons) * 100) : 100;
    const conflicts = 0; // TODO: Implement conflict detection

    return {
        scheduledLessons,
        unplacedLessons,
        timetableData,
        allClasses,
        allTeachers,
        allRooms,
        timeSlots,
        isLoading,
        error,
        timetableVersion,
        scheduleIntegrity,
        conflicts,
        setScheduledLessons,
        setUnplacedLessons,
        setTimetableVersion,
        fetchTimetableData,
    };
}

export default useTimetableData;
