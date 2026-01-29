/**
 * useLessons Hook
 * 
 * Darslarni fetch qilish uchun custom hook.
 * AbortController bilan proper cleanup.
 * Optimallashtirilgan metadata response ni qo'llab-quvvatlaydi.
 * 
 * @module hooks/useLessons
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { apiCall, getApiUrl } from '@/lib/api';
import {
    LessonCompact,
    LessonFull,
    Class,
    Teacher,
    Room,
    Subject,
    LessonsWithMetadataResponse
} from '@/types/entities';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

interface UseLessonsOptions {
    autoFetch?: boolean;
    withMetadata?: boolean;
}

interface UseLessonsReturn {
    lessons: LessonCompact[];
    lessonsExpanded: LessonFull[];
    metadata: {
        classes: Class[];
        teachers: Teacher[];
        rooms: Room[];
        subjects: Subject[];
    };
    loading: boolean;
    error: Error | null;
    fetchLessons: () => Promise<void>;
    getLessonById: (id: number) => LessonCompact | undefined;
    getLessonsByClass: (classId: number) => LessonCompact[];
    getLessonsByTeacher: (teacherId: number) => LessonCompact[];
    expandLesson: (lesson: LessonCompact) => LessonFull | null;
    refetch: () => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createLookupMaps(metadata: UseLessonsReturn['metadata']) {
    return {
        classesMap: new Map(metadata.classes.map(c => [c.id, c])),
        teachersMap: new Map(metadata.teachers.map(t => [t.id, t])),
        roomsMap: new Map(metadata.rooms.map(r => [r.id, r])),
        subjectsMap: new Map(metadata.subjects.map(s => [s.id, s])),
    };
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Custom hook for managing lessons data with proper lifecycle handling
 * 
 * @example
 * const { lessons, metadata, expandLesson } = useLessons({ withMetadata: true });
 */
export function useLessons(options: UseLessonsOptions = {}): UseLessonsReturn {
    const { autoFetch = true, withMetadata = true } = options;

    const [lessons, setLessons] = useState<LessonCompact[]>([]);
    const [metadata, setMetadata] = useState<UseLessonsReturn['metadata']>({
        classes: [],
        teachers: [],
        rooms: [],
        subjects: [],
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // AbortController for cleanup
    const abortControllerRef = useRef<AbortController | null>(null);
    const isMountedRef = useRef(true);

    // -------------------------------------------------------------------------
    // LOOKUP MAPS (memoized)
    // -------------------------------------------------------------------------
    const lookupMaps = useMemo(() => createLookupMaps(metadata), [metadata]);

    // -------------------------------------------------------------------------
    // EXPAND LESSON (convert compact to full)
    // -------------------------------------------------------------------------
    const expandLesson = useCallback((lesson: LessonCompact): LessonFull | null => {
        const cls = lookupMaps.classesMap.get(lesson.classId);
        const teacher = lookupMaps.teachersMap.get(lesson.teacherId);
        const subject = lookupMaps.subjectsMap.get(lesson.subjectId);
        const rooms = lesson.roomIds
            .map(id => lookupMaps.roomsMap.get(id))
            .filter((r): r is Room => r !== undefined);

        if (!cls || !teacher || !subject) {
            console.warn('Missing metadata for lesson expansion', {
                lessonId: lesson.id,
                hasClass: !!cls,
                hasTeacher: !!teacher,
                hasSubject: !!subject
            });
            return null;
        }

        return {
            id: lesson.id,
            class: cls,
            teacher,
            subject,
            rooms,
            lessonCount: lesson.lessonCount,
            dayOfWeek: lesson.dayOfWeek,
            hour: lesson.hour,
            period: lesson.period,
            frequency: lesson.frequency,
            createdDate: lesson.createdDate,
            updatedDate: lesson.updatedDate,
        };
    }, [lookupMaps]);

    // -------------------------------------------------------------------------
    // LESSONS EXPANDED (memoized)
    // -------------------------------------------------------------------------
    const lessonsExpanded = useMemo(() => {
        return lessons
            .map(lesson => expandLesson(lesson))
            .filter((l): l is LessonFull => l !== null);
    }, [lessons, expandLesson]);

    // -------------------------------------------------------------------------
    // FETCH LESSONS
    // -------------------------------------------------------------------------
    const fetchLessons = useCallback(async () => {
        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setLoading(true);
        setError(null);

        try {
            const endpoint = withMetadata
                ? `${getApiUrl('LESSONS')}/all-with-metadata`
                : `${getApiUrl('LESSONS')}/all`;

            const response = await apiCall<LessonsWithMetadataResponse | LessonCompact[]>(
                endpoint,
                { signal: abortControllerRef.current.signal }
            );

            // Check if component is still mounted
            if (!isMountedRef.current) return;

            if (response.error) {
                throw response.error;
            }

            if (withMetadata && response.data && 'lessons' in response.data) {
                const data = response.data as LessonsWithMetadataResponse;
                setLessons(data.lessons || []);
                setMetadata({
                    classes: data.classes || [],
                    teachers: data.teachers || [],
                    rooms: data.rooms || [],
                    subjects: data.subjects || [],
                });
            } else if (Array.isArray(response.data)) {
                setLessons(response.data);
            }

        } catch (err) {
            // Ignore abort errors
            if (err instanceof Error && err.name === 'AbortError') {
                return;
            }

            if (!isMountedRef.current) return;

            console.error('Error fetching lessons:', err);
            setError(err instanceof Error ? err : new Error('Failed to fetch lessons'));
            toast.error('Failed to load lessons');
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    }, [withMetadata]);

    // -------------------------------------------------------------------------
    // HELPER FUNCTIONS
    // -------------------------------------------------------------------------
    const getLessonById = useCallback((id: number) => {
        return lessons.find((l) => l.id === id);
    }, [lessons]);

    const getLessonsByClass = useCallback((classId: number) => {
        return lessons.filter((l) => l.classId === classId);
    }, [lessons]);

    const getLessonsByTeacher = useCallback((teacherId: number) => {
        return lessons.filter((l) => l.teacherId === teacherId);
    }, [lessons]);

    // -------------------------------------------------------------------------
    // LIFECYCLE
    // -------------------------------------------------------------------------
    // Cleanup on unmount
    useEffect(() => {
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // Auto-fetch on mount
    useEffect(() => {
        if (autoFetch) {
            fetchLessons();
        }
    }, [autoFetch, fetchLessons]);

    // -------------------------------------------------------------------------
    // RETURN
    // -------------------------------------------------------------------------
    return {
        lessons,
        lessonsExpanded,
        metadata,
        loading,
        error,
        fetchLessons,
        getLessonById,
        getLessonsByClass,
        getLessonsByTeacher,
        expandLesson,
        refetch: fetchLessons,
    };
}
