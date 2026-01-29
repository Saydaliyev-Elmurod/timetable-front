/**
 * useTimetableActions Hook
 * 
 * Handles timetable actions: drag/drop, optimize, export
 * 
 * @module components/timetable/hooks/useTimetableActions
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { apiCall } from '@/lib/api';
import {
    timetableActionApi,
    TimetableActionRequest,
    ActionResponse,
    ValidationResponse,
} from '@/components/api/timetableActionApi';
import { Lesson, UnplacedLesson } from '../types';
import { DAY_LABELS } from '../constants';

export interface UseTimetableActionsProps {
    timetableId?: string;
    timetableVersion: number;
    scheduledLessons: Lesson[];
    unplacedLessons: UnplacedLesson[];
    setScheduledLessons: React.Dispatch<React.SetStateAction<Lesson[]>>;
    setUnplacedLessons: React.Dispatch<React.SetStateAction<UnplacedLesson[]>>;
    setTimetableVersion: React.Dispatch<React.SetStateAction<number>>;
    fetchTimetableData: (id: string) => Promise<void>;
}

export interface UseTimetableActionsReturn {
    isProcessingAction: boolean;
    selectedLesson: Lesson | UnplacedLesson | null;
    handleDrop: (lesson: Lesson, targetDay: string, targetTimeSlot: number) => Promise<void>;
    handleEdit: (lesson: Lesson | UnplacedLesson) => void;
    handleDelete: (lesson: Lesson | UnplacedLesson) => void;
    handleToggleLock: (lesson: Lesson | UnplacedLesson) => void;
    handleOptimize: () => Promise<void>;
    handleExport: () => void;
    handleSelectLesson: (lesson: Lesson | UnplacedLesson) => void;
    handleManualPlace: (day: string, timeSlot: number) => void;
}

export function useTimetableActions({
    timetableId,
    timetableVersion,
    scheduledLessons,
    unplacedLessons,
    setScheduledLessons,
    setUnplacedLessons,
    setTimetableVersion,
    fetchTimetableData,
}: UseTimetableActionsProps): UseTimetableActionsReturn {
    const [isProcessingAction, setIsProcessingAction] = useState(false);
    const [selectedLesson, setSelectedLesson] = useState<Lesson | UnplacedLesson | null>(null);

    // Select lesson for manual placement
    const handleSelectLesson = useCallback((lesson: Lesson | UnplacedLesson) => {
        if (selectedLesson?.id === lesson.id) {
            setSelectedLesson(null);
        } else {
            setSelectedLesson(lesson);
        }
    }, [selectedLesson]);

    // Manual placement
    const handleManualPlace = useCallback(
        (day: string, timeSlot: number) => {
            if (!selectedLesson) return;
            handleDropInternal(selectedLesson, day, timeSlot);
            setSelectedLesson(null);
        },
        [selectedLesson]
    );

    // Drag and drop handler
    const handleDropInternal = async (
        draggedLesson: Lesson,
        targetDay: string,
        targetTimeSlot: number
    ) => {
        if (isProcessingAction) return;

        const targetLesson = scheduledLessons.find(
            (l) =>
                l.day === targetDay &&
                l.timeSlot === targetTimeSlot &&
                l.class === draggedLesson.class
        );

        const isUnplacedLesson = unplacedLessons.some((l) => l.id === draggedLesson.id);

        let actionRequest: TimetableActionRequest;
        let actionDescription = '';

        if (targetLesson && targetLesson.id !== draggedLesson.id) {
            // SWAP
            actionRequest = {
                action_type: 'SWAP_LESSONS',
                timetable_version: timetableVersion,
                payload: {
                    lesson_a: {
                        id: draggedLesson.id,
                        source_position: {
                            day: draggedLesson.day || '',
                            hour: draggedLesson.timeSlot || 0,
                            room_id: draggedLesson.roomId,
                        },
                    },
                    lesson_b: {
                        id: targetLesson.id,
                        source_position: {
                            day: targetLesson.day || '',
                            hour: targetLesson.timeSlot || 0,
                            room_id: targetLesson.roomId,
                        },
                    },
                },
            };
            actionDescription = `Swap ${draggedLesson.subject} with ${targetLesson.subject}`;
        } else if (isUnplacedLesson) {
            // PLACE_UNPLACED
            actionRequest = {
                action_type: 'PLACE_UNPLACED_LESSON',
                timetable_version: timetableVersion,
                payload: {
                    lesson_id: draggedLesson.id,
                    target_position: {
                        day: targetDay,
                        hour: targetTimeSlot,
                        room_id: draggedLesson.roomId || 0,
                    },
                },
            };
            actionDescription = `Place ${draggedLesson.subject} to ${DAY_LABELS[targetDay]}, Period ${targetTimeSlot}`;
        } else {
            // MOVE
            actionRequest = {
                action_type: 'MOVE_LESSON',
                timetable_version: timetableVersion,
                payload: {
                    lesson_id: draggedLesson.id,
                    source_position: {
                        day: draggedLesson.day || '',
                        hour: draggedLesson.timeSlot || 0,
                        room_id: draggedLesson.roomId,
                    },
                    target_position: {
                        day: targetDay,
                        hour: targetTimeSlot,
                        room_id: draggedLesson.roomId || 0,
                    },
                },
            };
            actionDescription = `Move ${draggedLesson.subject} to ${DAY_LABELS[targetDay]}, Period ${targetTimeSlot}`;
        }

        try {
            setIsProcessingAction(true);

            // Validate
            const validation: ValidationResponse = await timetableActionApi.validateMove(
                timetableId || '1',
                actionRequest
            );

            if (!validation.valid) {
                const errorMessage = validation.errors?.join(', ') || 'Invalid action';
                toast.error('Cannot perform action', { description: errorMessage });
                return;
            }

            if (validation.warnings && validation.warnings.length > 0) {
                toast.warning('Action has warnings', {
                    description: validation.warnings.join(', '),
                });
            }

            // Apply
            const result: ActionResponse = await timetableActionApi.applyAction(
                timetableId || '1',
                actionRequest
            );

            if (!result.success) {
                const errorMessage = result.errors?.join(', ') || 'Failed to apply action';
                toast.error('Action failed', { description: errorMessage });
                return;
            }

            // Update state
            setTimetableVersion(result.new_version);

            if (actionRequest.action_type === 'SWAP_LESSONS') {
                setScheduledLessons((prev) =>
                    prev.map((l) => {
                        if (l.id === draggedLesson.id) {
                            return { ...l, day: targetDay, timeSlot: targetTimeSlot, roomId: targetLesson!.roomId };
                        } else if (l.id === targetLesson!.id) {
                            return { ...l, day: draggedLesson.day!, timeSlot: draggedLesson.timeSlot!, roomId: draggedLesson.roomId };
                        }
                        return l;
                    })
                );
            } else if (actionRequest.action_type === 'PLACE_UNPLACED_LESSON') {
                setUnplacedLessons((prev) => prev.filter((l) => l.id !== draggedLesson.id));
                setScheduledLessons((prev) => [
                    ...prev,
                    { ...draggedLesson, day: targetDay, timeSlot: targetTimeSlot },
                ]);
            } else {
                setScheduledLessons((prev) =>
                    prev.map((l) =>
                        l.id === draggedLesson.id ? { ...l, day: targetDay, timeSlot: targetTimeSlot } : l
                    )
                );
            }

            const qualityInfo = result.soft_constraint_impact?.new_quality_score
                ? ` (Quality: ${result.soft_constraint_impact.new_quality_score}%)`
                : '';

            toast.success(result.message || 'Action completed successfully', {
                description: actionDescription + qualityInfo,
            });

            if (result.soft_constraint_impact?.warnings && result.soft_constraint_impact.warnings.length > 0) {
                setTimeout(() => {
                    toast.info('Scheduling Impact', {
                        description: result.soft_constraint_impact!.warnings!.join(', '),
                    });
                }, 500);
            }
        } catch (error) {
            console.error('Action error:', error);
            toast.error('Failed to process action', {
                description: error instanceof Error ? error.message : 'Unknown error occurred',
            });
        } finally {
            setIsProcessingAction(false);
        }
    };

    const handleDrop = useCallback(
        (lesson: Lesson, targetDay: string, targetTimeSlot: number) => {
            return handleDropInternal(lesson, targetDay, targetTimeSlot);
        },
        [isProcessingAction, timetableVersion, scheduledLessons, unplacedLessons, timetableId]
    );

    const handleEdit = useCallback((lesson: Lesson | UnplacedLesson) => {
        console.log('Edit lesson:', lesson);
    }, []);

    const handleDelete = useCallback(
        (lesson: Lesson | UnplacedLesson) => {
            setScheduledLessons((prev) => prev.filter((l) => l.id !== lesson.id));
        },
        [setScheduledLessons]
    );

    const handleToggleLock = useCallback(
        (lesson: Lesson | UnplacedLesson) => {
            setScheduledLessons((prev) =>
                prev.map((l) => (l.id === lesson.id ? { ...l, isLocked: !l.isLocked } : l))
            );
        },
        [setScheduledLessons]
    );

    const handleOptimize = useCallback(async () => {
        if (!timetableId) {
            toast.error('No timetable selected for optimization');
            return;
        }

        setIsProcessingAction(true);
        toast.info('Optimizing timetable...');

        const body = {
            applySoftConstraint: true,
            applyUnScheduledLessons: true,
            applyContinuityPenaltyTeacher: true,
            applyContinuityPenaltyClass: true,
            applyBalancedLoad: true,
            applyDailySubjectDistribution: true,
        };

        try {
            const res = await apiCall<any>(
                `http://localhost:8080/api/timetable/v1/timetable/optimize/${timetableId}`,
                {
                    method: 'POST',
                    body: JSON.stringify(body),
                }
            );

            if (res.error) {
                toast.error('Optimization failed', { description: res.error.message });
            } else {
                toast.success('Optimization request sent');
                await fetchTimetableData(timetableId);
            }
        } catch (err) {
            console.error('Optimize error:', err);
            toast.error('Optimization request failed');
        } finally {
            setIsProcessingAction(false);
        }
    }, [timetableId, fetchTimetableData]);

    const handleExport = useCallback(() => {
        console.log('Export to PDF');
        toast.info('Exporting to PDF...');
    }, []);

    return {
        isProcessingAction,
        selectedLesson,
        handleDrop,
        handleEdit,
        handleDelete,
        handleToggleLock,
        handleOptimize,
        handleExport,
        handleSelectLesson,
        handleManualPlace,
    };
}

export default useTimetableActions;
