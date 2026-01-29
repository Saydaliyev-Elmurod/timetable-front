/**
 * useRooms Hook
 * 
 * Xonalarni fetch qilish uchun custom hook.
 * AbortController bilan proper cleanup.
 * 
 * @module hooks/useRooms
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { apiCall, getApiUrl } from '@/lib/api';
import { Room, RoomSimple, RoomType } from '@/types/entities';
import { convertFromTimeSlots, Availability } from '@/utils/timeSlots';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export interface RoomWithAvailability extends Omit<Room, 'availabilities'> {
    availability: Availability;
}

interface UseRoomsOptions {
    autoFetch?: boolean;
    simplified?: boolean;
}

interface UseRoomsReturn {
    rooms: (Room | RoomSimple)[];
    roomsWithAvailability: RoomWithAvailability[];
    loading: boolean;
    error: Error | null;
    fetchRooms: () => Promise<void>;
    getRoomById: (id: number) => Room | RoomSimple | undefined;
    getRoomsByType: (type: RoomType) => (Room | RoomSimple)[];
    refetch: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Custom hook for managing rooms data with proper lifecycle handling
 * 
 * @example
 * const { rooms, loading, getRoomById } = useRooms();
 */
export function useRooms(options: UseRoomsOptions = {}): UseRoomsReturn {
    const { autoFetch = true, simplified = false } = options;

    const [rooms, setRooms] = useState<(Room | RoomSimple)[]>([]);
    const [roomsWithAvailability, setRoomsWithAvailability] = useState<RoomWithAvailability[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // AbortController for cleanup
    const abortControllerRef = useRef<AbortController | null>(null);
    const isMountedRef = useRef(true);

    // -------------------------------------------------------------------------
    // FETCH ROOMS
    // -------------------------------------------------------------------------
    const fetchRooms = useCallback(async () => {
        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setLoading(true);
        setError(null);

        try {
            const response = await apiCall<Room[]>(
                `${getApiUrl('ROOMS')}/all`,
                { signal: abortControllerRef.current.signal }
            );

            // Check if component is still mounted
            if (!isMountedRef.current) return;

            if (response.error) {
                throw response.error;
            }

            const roomList = Array.isArray(response.data) ? response.data : [];

            if (simplified) {
                // Return simplified format for dropdowns
                const simplifiedRooms: RoomSimple[] = roomList.map((r) => ({
                    id: r.id,
                    name: r.name || 'Unknown',
                    shortName: r.shortName,
                    type: r.type,
                }));
                setRooms(simplifiedRooms);
            } else {
                setRooms(roomList);
            }

            // Also create roomsWithAvailability for components that need it
            const roomsConverted: RoomWithAvailability[] = roomList.map((r) => ({
                ...r,
                availability: convertFromTimeSlots(r.availabilities),
            }));
            setRoomsWithAvailability(roomsConverted);

        } catch (err) {
            // Ignore abort errors
            if (err instanceof Error && err.name === 'AbortError') {
                return;
            }

            if (!isMountedRef.current) return;

            console.error('Error fetching rooms:', err);
            setError(err instanceof Error ? err : new Error('Failed to fetch rooms'));
            toast.error('Failed to load rooms');
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    }, [simplified]);

    // -------------------------------------------------------------------------
    // HELPER FUNCTIONS
    // -------------------------------------------------------------------------
    const getRoomById = useCallback((id: number) => {
        return rooms.find((r) => r.id === id);
    }, [rooms]);

    const getRoomsByType = useCallback((type: RoomType) => {
        return rooms.filter((r) => 'type' in r && r.type === type);
    }, [rooms]);

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
            fetchRooms();
        }
    }, [autoFetch, fetchRooms]);

    // -------------------------------------------------------------------------
    // RETURN
    // -------------------------------------------------------------------------
    return {
        rooms,
        roomsWithAvailability,
        loading,
        error,
        fetchRooms,
        getRoomById,
        getRoomsByType,
        refetch: fetchRooms,
    };
}
