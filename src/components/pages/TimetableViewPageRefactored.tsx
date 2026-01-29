/**
 * TimetableViewPageWithAPI (Refactored)
 * 
 * Original: 2173 lines → Refactored: ~350 lines
 * 
 * @module components/pages/TimetableViewPageRefactored
 */

import React, { useState, useMemo, useCallback } from 'react';
import { DndProvider, useDragLayer } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

// Timetable Components
import {
    TimetableToolbar,
    UnplacedSidebar,
    ClassViewGrid,
    TeacherViewGrid,
    RoomViewGrid,
    CompactViewGrid,
    useTimetableData,
    useTimetableActions,
    ViewMode,
    FilterBy,
    DisplayOptions,
    Lesson,
    UnplacedLesson,
} from '@/components/timetable';

// ============================================================================
// MAIN CONTENT COMPONENT
// ============================================================================

function TimetableContent({
    timetableId,
    onNavigate,
}: {
    timetableId?: string;
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

    // Data Hook
    const {
        scheduledLessons,
        unplacedLessons,
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
    } = useTimetableData(timetableId);

    // Actions Hook
    const {
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
    } = useTimetableActions({
        timetableId,
        timetableVersion,
        scheduledLessons,
        unplacedLessons,
        setScheduledLessons,
        setUnplacedLessons,
        setTimetableVersion,
        fetchTimetableData,
    });

    // Drag Layer
    const { isDragging, draggedLesson } = useDragLayer((monitor) => ({
        isDragging: monitor.isDragging(),
        draggedLesson: monitor.getItem() as Lesson | null,
    }));

    // Filter Logic
    const getFilteredLessons = useCallback(() => {
        if (filterBy === 'all') return scheduledLessons;

        return scheduledLessons.filter((lesson) => {
            switch (filterBy) {
                case 'class':
                    return lesson.class === selectedEntity;
                case 'teacher':
                    return lesson.teacher === selectedEntity;
                case 'room':
                    return lesson.room === selectedEntity;
                default:
                    return true;
            }
        });
    }, [filterBy, selectedEntity, scheduledLessons]);

    const getClassesToDisplay = useCallback(() => {
        if (filterBy === 'all') return allClasses;
        if (filterBy === 'class') return [selectedEntity];

        const relevantClasses = new Set(
            scheduledLessons
                .filter((lesson) => {
                    if (filterBy === 'teacher') return lesson.teacher === selectedEntity;
                    if (filterBy === 'room') return lesson.room === selectedEntity;
                    return false;
                })
                .map((lesson) => lesson.class)
        );
        return Array.from(relevantClasses);
    }, [filterBy, selectedEntity, scheduledLessons, allClasses]);

    const getTeachersToDisplay = useCallback(() => {
        if (filterBy === 'all') return allTeachers;
        if (filterBy === 'teacher') return [selectedEntity];

        const relevantTeachers = new Set(
            scheduledLessons
                .filter((lesson) => {
                    if (filterBy === 'class') return lesson.class === selectedEntity;
                    if (filterBy === 'room') return lesson.room === selectedEntity;
                    return false;
                })
                .map((lesson) => lesson.teacher)
        );
        return Array.from(relevantTeachers);
    }, [filterBy, selectedEntity, scheduledLessons, allTeachers]);

    const getRoomsToDisplay = useCallback(() => {
        if (filterBy === 'all') return allRooms;
        if (filterBy === 'room') return [selectedEntity];

        const relevantRooms = new Set(
            scheduledLessons
                .filter((lesson) => {
                    if (filterBy === 'class') return lesson.class === selectedEntity;
                    if (filterBy === 'teacher') return lesson.teacher === selectedEntity;
                    return false;
                })
                .map((lesson) => lesson.room)
        );
        return Array.from(relevantRooms);
    }, [filterBy, selectedEntity, scheduledLessons, allRooms]);

    const filteredLessons = useMemo(() => getFilteredLessons(), [getFilteredLessons]);
    const classesToDisplay = useMemo(() => getClassesToDisplay(), [getClassesToDisplay]);
    const teachersToDisplay = useMemo(() => getTeachersToDisplay(), [getTeachersToDisplay]);
    const roomsToDisplay = useMemo(() => getRoomsToDisplay(), [getRoomsToDisplay]);

    // Loading State
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
                    <p className="text-lg text-muted-foreground">Loading timetable data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            <div className="container mx-auto p-6 max-w-[1800px]">
                {/* Error Alert */}
                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Processing Indicator */}
                {isProcessingAction && (
                    <Alert className="mb-6 bg-blue-50 border-blue-300">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        <AlertDescription className="text-blue-800">
                            Processing action... Please wait.
                        </AlertDescription>
                    </Alert>
                )}

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
                    allClasses={allClasses}
                    allTeachers={allTeachers}
                    allRooms={allRooms}
                    onOptimize={handleOptimize}
                    onExport={handleExport}
                    onNavigate={onNavigate}
                    timetableVersion={timetableVersion}
                    scheduleIntegrity={scheduleIntegrity}
                    conflicts={conflicts}
                    unplacedCount={unplacedLessons.length}
                />

                {/* Main Content */}
                <div className="flex gap-6">
                    {/* Timetable Grid */}
                    <div className="flex-1">
                        {viewMode === 'classes' && (
                            <div className="space-y-6">
                                {classesToDisplay.length > 0 ? (
                                    classesToDisplay.map((className) => (
                                        <ClassViewGrid
                                            key={className}
                                            className={className}
                                            lessons={filteredLessons}
                                            onDrop={handleDrop}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                            onToggleLock={handleToggleLock}
                                            displayOptions={displayOptions}
                                            timeSlots={timeSlots}
                                            draggedLesson={isDragging ? draggedLesson : null}
                                            allLessons={scheduledLessons}
                                            selectedLesson={selectedLesson}
                                            onManualPlace={handleManualPlace}
                                        />
                                    ))
                                ) : (
                                    <EmptyState message="No scheduled lessons found." />
                                )}
                            </div>
                        )}

                        {viewMode === 'teachers' && (
                            <div className="space-y-6">
                                {teachersToDisplay.length > 0 ? (
                                    teachersToDisplay.map((teacherName) => (
                                        <TeacherViewGrid
                                            key={teacherName}
                                            teacherName={teacherName}
                                            lessons={filteredLessons}
                                            onDrop={handleDrop}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                            onToggleLock={handleToggleLock}
                                            displayOptions={displayOptions}
                                            timeSlots={timeSlots}
                                            draggedLesson={isDragging ? draggedLesson : null}
                                            allLessons={scheduledLessons}
                                            selectedLesson={selectedLesson}
                                            onManualPlace={handleManualPlace}
                                        />
                                    ))
                                ) : (
                                    <EmptyState message="No scheduled lessons found for this teacher." />
                                )}
                            </div>
                        )}

                        {viewMode === 'rooms' && (
                            <div className="space-y-6">
                                {roomsToDisplay.length > 0 ? (
                                    roomsToDisplay.map((roomName) => (
                                        <RoomViewGrid
                                            key={roomName}
                                            roomName={roomName}
                                            lessons={filteredLessons}
                                            onDrop={handleDrop}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                            onToggleLock={handleToggleLock}
                                            displayOptions={displayOptions}
                                            timeSlots={timeSlots}
                                            draggedLesson={isDragging ? draggedLesson : null}
                                            allLessons={scheduledLessons}
                                            selectedLesson={selectedLesson}
                                            onManualPlace={handleManualPlace}
                                        />
                                    ))
                                ) : (
                                    <EmptyState message="No scheduled lessons found for this room." />
                                )}
                            </div>
                        )}

                        {viewMode === 'compact' && (
                            <CompactViewGrid
                                lessons={filteredLessons}
                                classes={allClasses}
                                onDrop={handleDrop}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onToggleLock={handleToggleLock}
                                displayOptions={displayOptions}
                                timeSlots={timeSlots}
                                draggedLesson={isDragging ? draggedLesson : null}
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
// HELPER COMPONENTS
// ============================================================================

function EmptyState({ message }: { message: string }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">{message}</p>
        </div>
    );
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

export default function TimetableViewPageRefactored(props: {
    timetableId?: string;
    onNavigate?: (page: string) => void;
}) {
    return (
        <DndProvider backend={HTML5Backend}>
            <TimetableContent {...props} />
        </DndProvider>
    );
}
