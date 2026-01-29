/**
 * TimetableViewPage (Demo/Mock Version) - Refactored
 * 
 * This is a simplified demo version using mock data.
 * For production use, use TimetableViewPageRefactored.tsx with API integration.
 * 
 * Original: 1583 lines → Refactored: ~280 lines
 * 
 * @module components/pages/TimetableViewPageDemoRefactored
 */

import React, { useState, useMemo, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { toast } from 'sonner';
import { apiCall } from '@/lib/api';

// Timetable module - using shared components
import {
    TimetableToolbar,
    UnplacedSidebar,
    ClassViewGrid,
    TeacherViewGrid,
    RoomViewGrid,
    CompactViewGrid,
    ViewMode,
    FilterBy,
    DisplayOptions,
    Lesson,
    UnplacedLesson,
    DAYS,
} from '@/components/timetable';

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_CLASSES = ['5-A', '5-B', '6-A', '6-B', '7-A', '7-B', '8-A', '8-B'];
const MOCK_TEACHERS = ['John Smith', 'Sarah Johnson', 'Michael Brown', 'Emma Davis', 'David Wilson'];
const MOCK_ROOMS = ['Room 101', 'Room 102', 'Room 103', 'Lab A', 'Lab B', 'Gym'];
const MOCK_TIME_SLOTS = [1, 2, 3, 4, 5, 6, 7, 8];

const MOCK_SCHEDULED_LESSONS: Lesson[] = [
    { id: '1', subject: 'Mathematics', subjectId: 1, teacher: 'John Smith', teacherId: 1, teacherShort: 'JS', room: 'Room 101', roomId: 1, class: '5-A', classId: 1, day: 'MONDAY', timeSlot: 1, isLocked: false },
    { id: '2', subject: 'Physics', subjectId: 2, teacher: 'Sarah Johnson', teacherId: 2, teacherShort: 'SJ', room: 'Lab A', roomId: 4, class: '5-A', classId: 1, day: 'MONDAY', timeSlot: 2, isLocked: false },
    { id: '3', subject: 'English', subjectId: 3, teacher: 'Michael Brown', teacherId: 3, teacherShort: 'MB', room: 'Room 102', roomId: 2, class: '5-A', classId: 1, day: 'TUESDAY', timeSlot: 1, isLocked: true },
    { id: '4', subject: 'Chemistry', subjectId: 4, teacher: 'Emma Davis', teacherId: 4, teacherShort: 'ED', room: 'Lab B', roomId: 5, class: '5-A', classId: 1, day: 'WEDNESDAY', timeSlot: 3, isLocked: false },
    { id: '5', subject: 'Mathematics', subjectId: 1, teacher: 'John Smith', teacherId: 1, teacherShort: 'JS', room: 'Room 101', roomId: 1, class: '5-B', classId: 2, day: 'MONDAY', timeSlot: 3, isLocked: false },
    { id: '6', subject: 'English', subjectId: 3, teacher: 'Michael Brown', teacherId: 3, teacherShort: 'MB', room: 'Room 102', roomId: 2, class: '5-B', classId: 2, day: 'MONDAY', timeSlot: 4, isLocked: false },
    { id: '7', subject: 'History', subjectId: 5, teacher: 'David Wilson', teacherId: 5, teacherShort: 'DW', room: 'Room 103', roomId: 3, class: '5-B', classId: 2, day: 'TUESDAY', timeSlot: 2, isLocked: false },
    { id: '8', subject: 'Biology', subjectId: 6, teacher: 'Sarah Johnson', teacherId: 2, teacherShort: 'SJ', room: 'Lab A', roomId: 4, class: '6-A', classId: 3, day: 'MONDAY', timeSlot: 1, isLocked: false },
    { id: '9', subject: 'P.E.', subjectId: 7, teacher: 'Emma Davis', teacherId: 4, teacherShort: 'ED', room: 'Gym', roomId: 6, class: '6-A', classId: 3, day: 'TUESDAY', timeSlot: 5, isLocked: false },
    { id: '10', subject: 'Art', subjectId: 8, teacher: 'David Wilson', teacherId: 5, teacherShort: 'DW', room: 'Room 103', roomId: 3, class: '6-A', classId: 3, day: 'WEDNESDAY', timeSlot: 2, isLocked: false },
    { id: '11', subject: 'Physics', subjectId: 2, teacher: 'Sarah Johnson', teacherId: 2, teacherShort: 'SJ', room: 'Lab A', roomId: 4, class: '6-B', classId: 4, day: 'THURSDAY', timeSlot: 1, isLocked: false },
    { id: '12', subject: 'Mathematics', subjectId: 1, teacher: 'John Smith', teacherId: 1, teacherShort: 'JS', room: 'Room 101', roomId: 1, class: '7-A', classId: 5, day: 'FRIDAY', timeSlot: 2, isLocked: false },
    { id: '13', subject: 'Chemistry', subjectId: 4, teacher: 'Emma Davis', teacherId: 4, teacherShort: 'ED', room: 'Lab B', roomId: 5, class: '7-B', classId: 6, day: 'WEDNESDAY', timeSlot: 4, isLocked: false },
];

const MOCK_UNPLACED_LESSONS: UnplacedLesson[] = [
    { id: '101', subject: 'P.E.', subjectId: 7, teacher: 'John Smith', teacherId: 1, teacherShort: 'JS', room: 'Gym', roomId: 6, class: '5-A', classId: 1, isLocked: false, reason: 'No available time slots for this teacher' },
    { id: '102', subject: 'Biology', subjectId: 6, teacher: 'Sarah Johnson', teacherId: 2, teacherShort: 'SJ', room: 'Lab A', roomId: 4, class: '5-B', classId: 2, isLocked: false, reason: 'Room conflict - Lab A fully booked' },
    { id: '103', subject: 'Art', subjectId: 8, teacher: 'Emma Davis', teacherId: 4, teacherShort: 'ED', room: 'Room 103', roomId: 3, class: '7-A', classId: 5, isLocked: false, reason: 'Teacher has back-to-back classes' },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function TimetableContent({
    timetableId,
    onNavigate,
}: {
    timetableId?: number;
    onNavigate?: (page: string) => void;
}) {
    // View & Filter State
    const [viewMode, setViewMode] = useState<ViewMode>('classes');
    const [filterBy, setFilterBy] = useState<FilterBy>('all');
    const [selectedEntity, setSelectedEntity] = useState<string>('');
    const [displayOptions, setDisplayOptions] = useState<DisplayOptions>({
        showTeacher: true,
        showRoom: true,
        showSubject: true,
    });

    // Lessons State
    const [scheduledLessons, setScheduledLessons] = useState<Lesson[]>(MOCK_SCHEDULED_LESSONS);
    const [unplacedLessons, setUnplacedLessons] = useState<UnplacedLesson[]>(MOCK_UNPLACED_LESSONS);
    const [selectedLesson, setSelectedLesson] = useState<Lesson | UnplacedLesson | null>(null);
    const [isOptimizing, setIsOptimizing] = useState(false);

    // Stats
    const totalLessons = scheduledLessons.length + unplacedLessons.length;
    const scheduleIntegrity = Math.round((scheduledLessons.length / totalLessons) * 100);
    const conflicts = 2;

    // Handlers
    const handleDrop = useCallback((lesson: Lesson, day: string, timeSlot: number) => {
        setUnplacedLessons((prev) => prev.filter((l) => l.id !== lesson.id));
        setScheduledLessons((prev) => {
            const filtered = prev.filter(
                (l) => !(l.class === lesson.class && l.day === day && l.timeSlot === timeSlot)
            );
            return [...filtered, { ...lesson, day, timeSlot }];
        });
        toast.success(`Moved ${lesson.subject} to ${day}, Period ${timeSlot}`);
    }, []);

    const handleEdit = useCallback((lesson: Lesson | UnplacedLesson) => {
        console.log('Edit lesson:', lesson);
        toast.info('Edit functionality coming soon');
    }, []);

    const handleDelete = useCallback((lesson: Lesson | UnplacedLesson) => {
        setScheduledLessons((prev) => prev.filter((l) => l.id !== lesson.id));
        toast.success('Lesson deleted');
    }, []);

    const handleToggleLock = useCallback((lesson: Lesson | UnplacedLesson) => {
        setScheduledLessons((prev) =>
            prev.map((l) => (l.id === lesson.id ? { ...l, isLocked: !l.isLocked } : l))
        );
        toast.info(lesson.isLocked ? 'Lesson unlocked' : 'Lesson locked');
    }, []);

    const handleOptimize = useCallback(async () => {
        if (!timetableId) {
            toast.info('Demo mode - optimization simulated');
            return;
        }

        setIsOptimizing(true);
        toast.info('Optimizing timetable...');

        try {
            const res = await apiCall<any>(
                `http://localhost:8080/api/timetable/v1/timetable/optimize/${timetableId}`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        applySoftConstraint: true,
                        applyUnScheduledLessons: true,
                        applyContinuityPenaltyTeacher: true,
                        applyContinuityPenaltyClass: true,
                        applyBalancedLoad: true,
                        applyDailySubjectDistribution: true,
                    }),
                }
            );

            if (res.error) {
                toast.error('Optimization failed');
            } else {
                toast.success('Optimization request sent');
            }
        } catch (err) {
            toast.error('Optimization failed');
        } finally {
            setIsOptimizing(false);
        }
    }, [timetableId]);

    const handleExport = useCallback(() => {
        toast.info('Exporting to PDF...');
    }, []);

    const handleSelectLesson = useCallback((lesson: Lesson | UnplacedLesson) => {
        setSelectedLesson((prev) => (prev?.id === lesson.id ? null : lesson));
    }, []);

    const handleManualPlace = useCallback(
        (day: string, timeSlot: number) => {
            if (selectedLesson) {
                handleDrop(selectedLesson as Lesson, day, timeSlot);
                setSelectedLesson(null);
            }
        },
        [selectedLesson, handleDrop]
    );

    // Filter Logic
    const getFilteredLessons = useCallback(() => {
        if (filterBy === 'all') return scheduledLessons;
        return scheduledLessons.filter((lesson) => {
            switch (filterBy) {
                case 'class': return lesson.class === selectedEntity;
                case 'teacher': return lesson.teacher === selectedEntity;
                case 'room': return lesson.room === selectedEntity;
                default: return true;
            }
        });
    }, [filterBy, selectedEntity, scheduledLessons]);

    const getClassesToDisplay = useCallback(() => {
        if (filterBy === 'all') return MOCK_CLASSES;
        if (filterBy === 'class') return [selectedEntity];
        return Array.from(new Set(scheduledLessons.filter((l) => {
            if (filterBy === 'teacher') return l.teacher === selectedEntity;
            if (filterBy === 'room') return l.room === selectedEntity;
            return false;
        }).map((l) => l.class)));
    }, [filterBy, selectedEntity, scheduledLessons]);

    const getTeachersToDisplay = useCallback(() => {
        if (filterBy === 'all') return MOCK_TEACHERS;
        if (filterBy === 'teacher') return [selectedEntity];
        return Array.from(new Set(scheduledLessons.filter((l) => {
            if (filterBy === 'class') return l.class === selectedEntity;
            if (filterBy === 'room') return l.room === selectedEntity;
            return false;
        }).map((l) => l.teacher)));
    }, [filterBy, selectedEntity, scheduledLessons]);

    const getRoomsToDisplay = useCallback(() => {
        if (filterBy === 'all') return MOCK_ROOMS;
        if (filterBy === 'room') return [selectedEntity];
        return Array.from(new Set(scheduledLessons.filter((l) => {
            if (filterBy === 'class') return l.class === selectedEntity;
            if (filterBy === 'teacher') return l.teacher === selectedEntity;
            return false;
        }).map((l) => l.room)));
    }, [filterBy, selectedEntity, scheduledLessons]);

    const filteredLessons = useMemo(() => getFilteredLessons(), [getFilteredLessons]);
    const classesToDisplay = useMemo(() => getClassesToDisplay(), [getClassesToDisplay]);
    const teachersToDisplay = useMemo(() => getTeachersToDisplay(), [getTeachersToDisplay]);
    const roomsToDisplay = useMemo(() => getRoomsToDisplay(), [getRoomsToDisplay]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            <div className="container mx-auto p-6 max-w-[1800px]">
                {/* Toolbar */}
                <TimetableToolbar
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    displayOptions={displayOptions}
                    onDisplayOptionsChange={setDisplayOptions}
                    filterBy={filterBy}
                    onFilterByChange={setFilterBy}
                    selectedEntity={selectedEntity}
                    onSelectedEntityChange={setSelectedEntity}
                    allClasses={MOCK_CLASSES}
                    allTeachers={MOCK_TEACHERS}
                    allRooms={MOCK_ROOMS}
                    onOptimize={handleOptimize}
                    onExport={handleExport}
                    onNavigate={onNavigate}
                    timetableVersion={1}
                    scheduleIntegrity={scheduleIntegrity}
                    conflicts={conflicts}
                    unplacedCount={unplacedLessons.length}
                />

                {/* Main Content */}
                <div className="flex gap-6">
                    <div className="flex-1">
                        {viewMode === 'classes' && classesToDisplay.map((className) => (
                            <ClassViewGrid
                                key={className}
                                className={className}
                                lessons={filteredLessons}
                                onDrop={handleDrop}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onToggleLock={handleToggleLock}
                                displayOptions={displayOptions}
                                timeSlots={MOCK_TIME_SLOTS}
                                allLessons={scheduledLessons}
                                selectedLesson={selectedLesson}
                                onManualPlace={handleManualPlace}
                            />
                        ))}

                        {viewMode === 'teachers' && teachersToDisplay.map((teacherName) => (
                            <TeacherViewGrid
                                key={teacherName}
                                teacherName={teacherName}
                                lessons={filteredLessons}
                                onDrop={handleDrop}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onToggleLock={handleToggleLock}
                                displayOptions={displayOptions}
                                timeSlots={MOCK_TIME_SLOTS}
                                allLessons={scheduledLessons}
                                selectedLesson={selectedLesson}
                                onManualPlace={handleManualPlace}
                            />
                        ))}

                        {viewMode === 'rooms' && roomsToDisplay.map((roomName) => (
                            <RoomViewGrid
                                key={roomName}
                                roomName={roomName}
                                lessons={filteredLessons}
                                onDrop={handleDrop}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onToggleLock={handleToggleLock}
                                displayOptions={displayOptions}
                                timeSlots={MOCK_TIME_SLOTS}
                                allLessons={scheduledLessons}
                                selectedLesson={selectedLesson}
                                onManualPlace={handleManualPlace}
                            />
                        ))}

                        {viewMode === 'compact' && (
                            <CompactViewGrid
                                lessons={filteredLessons}
                                classes={MOCK_CLASSES}
                                onDrop={handleDrop}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onToggleLock={handleToggleLock}
                                displayOptions={displayOptions}
                                timeSlots={MOCK_TIME_SLOTS}
                                allLessons={scheduledLessons}
                                selectedLesson={selectedLesson}
                                onManualPlace={handleManualPlace}
                            />
                        )}
                    </div>

                    {/* Unplaced Sidebar */}
                    <UnplacedSidebar
                        lessons={unplacedLessons}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onToggleLock={handleToggleLock}
                        displayOptions={displayOptions}
                        selectedLesson={selectedLesson}
                        onSelectLesson={handleSelectLesson}
                    />
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

export default function TimetableViewPageDemoRefactored(props: {
    timetableId?: number;
    onNavigate?: (page: string) => void;
}) {
    return (
        <DndProvider backend={HTML5Backend}>
            <TimetableContent {...props} />
        </DndProvider>
    );
}
