import React, { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle } from 'lucide-react';
import { DndProvider, useDragLayer } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useEffect } from 'react';
import { initializeMockLessons } from '../api/timetableActionApi';
import { DragContextProvider } from '../timetable/context/DragContext';
import { DragStatusLegend } from '../timetable/DragStatusLegend';
import { PageContainer } from '../shared/PageContainer';
import { DisplayOptions, Lesson, UnplacedLesson } from './timetable-view/types';

import { useTimetableData } from './timetable-view-api/useTimetableData';
import { useTimetableActions } from './timetable-view-api/useTimetableActions';
import { useTimetableEditor } from './timetable-view-api/useTimetableEditor';
import { TimetableHeader, ViewMode } from './timetable-view-api/TimetableHeader';
import { FilterBy } from './timetable-view-api/FiltersPopover';
import { MainGrid } from './timetable-view-api/MainGrid';
import { UnplacedSidebar } from './timetable-view-api/UnplacedSidebar';

const TimetableContent = ({
  timetableId,
  onNavigate,
}: {
  timetableId?: string;
  onNavigate?: (page: string) => void;
}) => {
  // View / filter state — local to the orchestrator.
  const [viewMode, setViewMode] = useState<ViewMode>('classes');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const [displayOptions, setDisplayOptions] = useState<DisplayOptions>({
    showTeacher: true,
    showRoom: true,
    showSubject: true,
  });
  const [selectedLesson, setSelectedLesson] = useState<Lesson | UnplacedLesson | null>(null);
  // Unplaced panel yopiq/ochiq holati (sidebar kabi pin, > tugma bilan toggle).
  const [unplacedCollapsed, setUnplacedCollapsed] = useState(false);

  const {
    isLoading,
    error,
    version,
    timetableMeta,
    apiTeachers,
    apiClasses,
    apiSubjects,
    scheduledLessons,
    unplacedLessons,
    companyPeriods,
    setScheduledLessons,
    setUnplacedLessons,
    refetchData,
    refetchMeta,
  } = useTimetableData(timetableId);

  // Optimize / export / edit / lock — DnD'ga aloqasiz amallar.
  const {
    isProcessingAction,
    handleEdit,
    handleToggleLock,
    handleOptimize,
    handleExport,
  } = useTimetableActions({
    timetableId,
    timetableMeta,
    setScheduledLessons,
    refetchData,
    refetchMeta,
  });

  // Drag-and-drop tahrirlash: undo/redo + net-diff autosave.
  const {
    handleDrop,
    unscheduleLesson,
    undo,
    redo,
    save,
    canUndo,
    canRedo,
    isDirty,
    isSaving,
  } = useTimetableEditor({
    timetableId,
    version,
    scheduledLessons,
    unplacedLessons,
    setScheduledLessons,
    setUnplacedLessons,
    apiTeachers,
    apiClasses,
    apiSubjects,
    isLoading,
    refetchData,
  });

  // O'chirish = darsni unscheduled qilish (undo qilinadi, save bo'ladi).
  const handleDelete = (lesson: Lesson | UnplacedLesson) => unscheduleLesson(lesson);

  // Track the currently dragged item globally for highlighting.
  const { isDragging, draggedLesson } = useDragLayer((monitor) => ({
    isDragging: monitor.isDragging(),
    draggedLesson: monitor.getItem() as Lesson | null,
  }));

  // Mirror scheduled lessons into the mock-action service so validation works.
  useEffect(() => {
    if (scheduledLessons.length > 0) {
      initializeMockLessons(scheduledLessons);
    }
  }, [scheduledLessons.length]);

  // Toggle-select for manual placement mode.
  const handleSelectLesson = (lesson: Lesson | UnplacedLesson) => {
    setSelectedLesson((prev) => (prev?.id === lesson.id ? null : lesson));
  };
  const handleManualPlace = (day: string, timeSlot: number) => {
    if (!selectedLesson) return;
    handleDrop(selectedLesson as Lesson, day, timeSlot);
    setSelectedLesson(null);
  };

  // Derived data ─────────────────────────────────────────────────────────────
  const allClasses = useMemo(
    () => Array.from(new Set(scheduledLessons.map((l) => l.class))).sort(),
    [scheduledLessons],
  );
  const allTeachers = useMemo(
    () => Array.from(new Set(scheduledLessons.map((l) => l.teacher))).sort(),
    [scheduledLessons],
  );
  // "No Room" (xonasiz darslar) by-room ko'rinishida alohida guruh bo'lib chiqmasin.
  const allRooms = useMemo(
    () => Array.from(new Set(scheduledLessons.map((l) => l.room)))
      .filter((room) => room !== 'No Room')
      .sort(),
    [scheduledLessons],
  );

  const timeSlots = useMemo(() => {
    const slots = new Set(scheduledLessons.map((l) => l.timeSlot).filter(Boolean) as number[]);
    companyPeriods.forEach((p) => slots.add(p));
    if (slots.size === 0) return [1, 2, 3, 4, 5, 6, 7];
    return Array.from(slots).sort((a, b) => a - b);
  }, [scheduledLessons, companyPeriods]);

  const totalLessons = scheduledLessons.length + unplacedLessons.length;
  const scheduleIntegrity = totalLessons > 0
    ? Math.round((scheduledLessons.length / totalLessons) * 100)
    : 100;
  const conflicts = 0; // TODO: real conflict detection

  const filteredLessons = useMemo(() => {
    if (filterBy === 'all') return scheduledLessons;
    return scheduledLessons.filter((lesson) => {
      switch (filterBy) {
        case 'class': return lesson.class === selectedEntity;
        case 'teacher': return lesson.teacher === selectedEntity;
        case 'room': return lesson.room === selectedEntity;
        default: return true;
      }
    });
  }, [scheduledLessons, filterBy, selectedEntity]);

  const classesToDisplay = useMemo(() => {
    if (filterBy === 'all') return allClasses;
    if (filterBy === 'class') return [selectedEntity];
    const relevant = new Set(
      scheduledLessons
        .filter((l) =>
          (filterBy === 'teacher' && l.teacher === selectedEntity)
          || (filterBy === 'room' && l.room === selectedEntity))
        .map((l) => l.class),
    );
    return Array.from(relevant);
  }, [scheduledLessons, allClasses, filterBy, selectedEntity]);

  const teachersToDisplay = useMemo(() => {
    if (filterBy === 'all') return allTeachers;
    if (filterBy === 'teacher') return [selectedEntity];
    const relevant = new Set(
      scheduledLessons
        .filter((l) =>
          (filterBy === 'class' && l.class === selectedEntity)
          || (filterBy === 'room' && l.room === selectedEntity))
        .map((l) => l.teacher),
    );
    return Array.from(relevant);
  }, [scheduledLessons, allTeachers, filterBy, selectedEntity]);

  const roomsToDisplay = useMemo(() => {
    if (filterBy === 'all') return allRooms;
    if (filterBy === 'room') return [selectedEntity];
    const relevant = new Set(
      scheduledLessons
        .filter((l) =>
          (filterBy === 'class' && l.class === selectedEntity)
          || (filterBy === 'teacher' && l.teacher === selectedEntity))
        .map((l) => l.room),
    );
    return Array.from(relevant).filter((room) => room !== 'No Room');
  }, [scheduledLessons, allRooms, filterBy, selectedEntity]);

  // Prepare DragContext data.
  const dragContextLessons = useMemo(
    () => scheduledLessons.map((l) => ({
      id: l.id,
      teacherId: l.teacherId,
      roomId: l.roomId,
      classId: l.classId,
      className: l.class,
      day: l.day,
      timeSlot: l.timeSlot,
    })),
    [scheduledLessons],
  );

  // Render ───────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <PageContainer size="wide">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Loading timetable data...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <DragContextProvider
      teachers={apiTeachers}
      classes={apiClasses}
      subjects={apiSubjects}
      scheduledLessons={dragContextLessons}
    >
      <PageContainer size="wide" noGap>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {(isProcessingAction || isSaving) && (
          <Alert className="mb-6 bg-blue-50 border-blue-300">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <AlertDescription className="text-blue-800">
              {isSaving ? 'Saqlanmoqda...' : 'Amal bajarilmoqda...'} Iltimos kuting.
            </AlertDescription>
          </Alert>
        )}

        <TimetableHeader
          onNavigate={onNavigate}
          timetableMeta={timetableMeta}
          scheduledCount={scheduledLessons.length}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          displayOptions={displayOptions}
          onDisplayOptionsChange={setDisplayOptions}
          filterPopoverOpen={filterPopoverOpen}
          onFilterPopoverOpenChange={setFilterPopoverOpen}
          filterBy={filterBy}
          selectedEntity={selectedEntity}
          onFilterByChange={setFilterBy}
          onSelectedEntityChange={setSelectedEntity}
          allClasses={allClasses}
          allTeachers={allTeachers}
          allRooms={allRooms}
          timetableVersion={version}
          scheduleIntegrity={scheduleIntegrity}
          conflicts={conflicts}
          unplacedCount={unplacedLessons.length}
          onOptimize={handleOptimize}
          onExport={handleExport}
          onUndo={undo}
          onRedo={redo}
          onSave={save}
          canUndo={canUndo}
          canRedo={canRedo}
          isDirty={isDirty}
          isSaving={isSaving}
        />

        <div className="flex gap-6 items-start">
          <div className="flex-1 min-w-0">
            <MainGrid
              viewMode={viewMode}
              filteredLessons={filteredLessons}
              scheduledLessons={scheduledLessons}
              classesToDisplay={classesToDisplay}
              teachersToDisplay={teachersToDisplay}
              roomsToDisplay={roomsToDisplay}
              allClasses={allClasses}
              timeSlots={timeSlots}
              displayOptions={displayOptions}
              draggedLesson={isDragging ? draggedLesson : null}
              selectedLesson={selectedLesson}
              onDrop={handleDrop}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleLock={handleToggleLock}
              onManualPlace={handleManualPlace}
            />
          </div>

          <UnplacedSidebar
            unplacedLessons={unplacedLessons}
            displayOptions={displayOptions}
            selectedLesson={selectedLesson}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleLock={handleToggleLock}
            onSelectLesson={handleSelectLesson}
            collapsed={unplacedCollapsed}
            onToggleCollapse={() => setUnplacedCollapsed((v) => !v)}
          />
        </div>
      </PageContainer>

      <DragStatusLegend />
    </DragContextProvider>
  );
};

export default function TimetableViewPageWithAPI(props: {
  timetableId?: string;
  onNavigate?: (page: string) => void;
}) {
  return (
    <DndProvider backend={HTML5Backend}>
      <TimetableContent {...props} />
    </DndProvider>
  );
}
