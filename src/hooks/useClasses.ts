// Custom hook for fetching classes with proper cleanup
import { useState, useCallback, useEffect, useRef } from 'react';
import { apiCall, getApiUrl } from '@/lib/api';
import { ClassResponse } from '@/lib/classes';
import { convertFromTimeSlots, Availability } from '@/utils/timeSlots';
import { toast } from 'sonner';

export interface ClassWithAvailability {
    id: number;
    name: string;
    shortName: string;
    classTeacher: string;
    classTeacherId?: string;
    roomIds: string[];
    isGrouped: boolean;
    groups: Array<{ id?: number; name: string; isNew?: boolean }>;
    availability: Availability;
    isActive: boolean;
    createdDate?: string;
    updatedDate?: string;
}

interface UseClassesOptions {
    page?: number;
    size?: number;
    autoFetch?: boolean;
}

interface UseClassesReturn {
    classes: ClassWithAvailability[];
    loading: boolean;
    error: Error | null;
    totalPages: number;
    totalElements: number;
    pagination: {
        totalPages: number;
        totalElements: number;
        currentPage: number;
        pageSize: number;
    };
    fetchClasses: () => Promise<void>;
    fetchAllClasses: () => Promise<ClassWithAvailability[]>;
    refetch: () => void;
}

/**
 * Custom hook for managing classes data with proper lifecycle handling
 */
export function useClasses(options: UseClassesOptions = {}): UseClassesReturn {
    const { page = 0, size = 10, autoFetch = true } = options;

    const [classes, setClasses] = useState<ClassWithAvailability[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    // AbortController for cleanup
    const abortControllerRef = useRef<AbortController | null>(null);
    const isMountedRef = useRef(true);

    // Convert API response to internal format
    const convertClassResponse = useCallback((cls: any): ClassWithAvailability => ({
        id: cls?.id ?? 0,
        name: cls?.name ?? 'Unnamed Class',
        shortName: cls?.shortName ?? '',
        isActive: cls?.isActive ?? true,
        classTeacher: cls?.teacher?.id?.toString() || '',
        roomIds: Array.isArray(cls?.rooms) ? cls.rooms.map((r: any) => String(r?.id ?? '')) : [],
        isGrouped: cls?.isGrouped ?? false,
        groups: Array.isArray(cls?.groups) ? cls.groups.map((g: any) => ({
            id: g?.id,
            name: g?.name ?? '',
            isNew: false
        })) : [],
        availability: convertFromTimeSlots(cls?.availabilities),
        createdDate: cls?.createdDate,
        updatedDate: cls?.updatedDate
    }), []);

    const fetchClasses = useCallback(async () => {
        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setLoading(true);
        setError(null);

        try {
            const response = await apiCall<any>(
                `${getApiUrl('CLASSES')}?page=${page}&size=${size}`,
                { signal: abortControllerRef.current.signal }
            );

            // Check if component is still mounted
            if (!isMountedRef.current) return;

            if (response.error) {
                throw response.error;
            }

            const data = response.data;
            if (!data) {
                setClasses([]);
                return;
            }

            const content = Array.isArray(data.content) ? data.content : [];
            const convertedClasses = content.map(convertClassResponse);

            setClasses(convertedClasses);
            setTotalPages(data.totalPages ?? (Math.ceil(content.length / size) || 1));
            setTotalElements(data.totalElements ?? content.length);

        } catch (err) {
            // Ignore abort errors
            if (err instanceof Error && err.name === 'AbortError') {
                return;
            }

            if (!isMountedRef.current) return;

            console.error('Error fetching classes:', err);
            setError(err instanceof Error ? err : new Error('Failed to fetch classes'));
            toast.error('Failed to load classes');
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    }, [page, size, convertClassResponse]);

    const fetchAllClasses = useCallback(async (): Promise<ClassWithAvailability[]> => {
        try {
            const response = await apiCall<any>(`${getApiUrl('CLASSES')}/all`);

            if (response.error) {
                throw response.error;
            }

            const data = Array.isArray(response.data) ? response.data : [];
            return data.map(convertClassResponse);

        } catch (err) {
            console.error('Error fetching all classes:', err);
            toast.error('Failed to load all classes');
            return [];
        }
    }, [convertClassResponse]);

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

    // Auto-fetch on mount and when page/size changes
    useEffect(() => {
        if (autoFetch) {
            fetchClasses();
        }
    }, [autoFetch, fetchClasses]);

    return {
        classes,
        loading,
        error,
        totalPages,
        totalElements,
        pagination: {
            totalPages,
            totalElements,
            currentPage: page,
            pageSize: size,
        },
        fetchClasses,
        fetchAllClasses,
        refetch: fetchClasses
    };
}
