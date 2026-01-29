/**
 * useSubjects Hook
 * 
 * Fanlarni fetch qilish uchun custom hook.
 * AbortController bilan proper cleanup.
 * 
 * @module hooks/useSubjects
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { apiCall, getApiUrl } from '@/lib/api';
import { Subject } from '@/types/entities';
import { convertFromTimeSlots, Availability } from '@/utils/timeSlots';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export interface SubjectWithAvailability extends Omit<Subject, 'availabilities'> {
    availability: Availability;
}

interface SubjectSimple {
    id: number;
    name: string;
    shortName?: string;
    emoji?: string;
    color?: string;
}

interface UseSubjectsOptions {
    autoFetch?: boolean;
    simplified?: boolean;
}

interface UseSubjectsReturn {
    subjects: (Subject | SubjectSimple)[];
    subjectsWithAvailability: SubjectWithAvailability[];
    loading: boolean;
    error: Error | null;
    fetchSubjects: () => Promise<void>;
    getSubjectById: (id: number) => Subject | SubjectSimple | undefined;
    getSubjectsByIds: (ids: number[]) => (Subject | SubjectSimple)[];
    refetch: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Custom hook for managing subjects data with proper lifecycle handling
 * 
 * @example
 * const { subjects, loading, getSubjectById } = useSubjects();
 */
export function useSubjects(options: UseSubjectsOptions = {}): UseSubjectsReturn {
    const { autoFetch = true, simplified = false } = options;

    const [subjects, setSubjects] = useState<(Subject | SubjectSimple)[]>([]);
    const [subjectsWithAvailability, setSubjectsWithAvailability] = useState<SubjectWithAvailability[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // AbortController for cleanup
    const abortControllerRef = useRef<AbortController | null>(null);
    const isMountedRef = useRef(true);

    // -------------------------------------------------------------------------
    // FETCH SUBJECTS
    // -------------------------------------------------------------------------
    const fetchSubjects = useCallback(async () => {
        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setLoading(true);
        setError(null);

        try {
            const response = await apiCall<Subject[]>(
                `${getApiUrl('SUBJECTS')}/all`,
                { signal: abortControllerRef.current.signal }
            );

            // Check if component is still mounted
            if (!isMountedRef.current) return;

            if (response.error) {
                throw response.error;
            }

            const subjectList = Array.isArray(response.data) ? response.data : [];

            if (simplified) {
                // Return simplified format for dropdowns
                const simplifiedSubjects: SubjectSimple[] = subjectList.map((s) => ({
                    id: s.id,
                    name: s.name || 'Unknown',
                    shortName: s.shortName,
                    emoji: s.emoji,
                    color: s.color,
                }));
                setSubjects(simplifiedSubjects);
            } else {
                setSubjects(subjectList);
            }

            // Also create subjectsWithAvailability for components that need it
            const subjectsConverted: SubjectWithAvailability[] = subjectList.map((s) => ({
                ...s,
                availability: convertFromTimeSlots(s.availabilities),
            }));
            setSubjectsWithAvailability(subjectsConverted);

        } catch (err) {
            // Ignore abort errors
            if (err instanceof Error && err.name === 'AbortError') {
                return;
            }

            if (!isMountedRef.current) return;

            console.error('Error fetching subjects:', err);
            setError(err instanceof Error ? err : new Error('Failed to fetch subjects'));
            toast.error('Failed to load subjects');
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    }, [simplified]);

    // -------------------------------------------------------------------------
    // HELPER FUNCTIONS
    // -------------------------------------------------------------------------
    const getSubjectById = useCallback((id: number) => {
        return subjects.find((s) => s.id === id);
    }, [subjects]);

    const getSubjectsByIds = useCallback((ids: number[]) => {
        return subjects.filter((s) => ids.includes(s.id));
    }, [subjects]);

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
            fetchSubjects();
        }
    }, [autoFetch, fetchSubjects]);

    // -------------------------------------------------------------------------
    // RETURN
    // -------------------------------------------------------------------------
    return {
        subjects,
        subjectsWithAvailability,
        loading,
        error,
        fetchSubjects,
        getSubjectById,
        getSubjectsByIds,
        refetch: fetchSubjects,
    };
}
