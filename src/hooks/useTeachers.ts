// Custom hook for fetching teachers with proper cleanup
import { useState, useCallback, useEffect, useRef } from 'react';
import { apiCall, getApiUrl } from '@/lib/api';
import { TeacherResponse } from '@/lib/teachers';
import { toast } from 'sonner';

interface SimpleTeacher {
    id: number;
    name: string;
    fullName: string;
    shortName?: string;
}

interface UseTeachersOptions {
    autoFetch?: boolean;
    simplified?: boolean;
}

interface UseTeachersReturn {
    teachers: TeacherResponse[] | SimpleTeacher[];
    loading: boolean;
    error: Error | null;
    fetchTeachers: () => Promise<void>;
    getTeacherById: (id: number) => TeacherResponse | SimpleTeacher | undefined;
}

/**
 * Custom hook for managing teachers data with proper lifecycle handling
 */
export function useTeachers(options: UseTeachersOptions = {}): UseTeachersReturn {
    const { autoFetch = true, simplified = false } = options;

    const [teachers, setTeachers] = useState<TeacherResponse[] | SimpleTeacher[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // AbortController for cleanup
    const abortControllerRef = useRef<AbortController | null>(null);
    const isMountedRef = useRef(true);

    const fetchTeachers = useCallback(async () => {
        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setLoading(true);
        setError(null);

        try {
            const response = await apiCall<TeacherResponse[]>(
                `${getApiUrl('TEACHERS')}/all`,
                { signal: abortControllerRef.current.signal }
            );

            // Check if component is still mounted
            if (!isMountedRef.current) return;

            if (response.error) {
                throw response.error;
            }

            const teacherList = Array.isArray(response.data) ? response.data : [];

            if (simplified) {
                // Return simplified format for dropdowns
                setTeachers(teacherList.map((t: any) => ({
                    id: t?.id,
                    name: t?.fullName || t?.name || 'Unknown',
                    fullName: t?.fullName || t?.name || 'Unknown',
                    shortName: t?.shortName
                })));
            } else {
                setTeachers(teacherList);
            }

        } catch (err) {
            // Ignore abort errors
            if (err instanceof Error && err.name === 'AbortError') {
                return;
            }

            if (!isMountedRef.current) return;

            console.error('Error fetching teachers:', err);
            setError(err instanceof Error ? err : new Error('Failed to fetch teachers'));
            toast.error('Failed to load teachers');
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    }, [simplified]);

    const getTeacherById = useCallback((id: number) => {
        return teachers.find(t => t.id === id);
    }, [teachers]);

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
            fetchTeachers();
        }
    }, [autoFetch, fetchTeachers]);

    return {
        teachers,
        loading,
        error,
        fetchTeachers,
        getTeacherById
    };
}
