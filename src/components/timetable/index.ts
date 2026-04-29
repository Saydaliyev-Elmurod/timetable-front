/**
 * Timetable Components - Barrel Export
 * @module components/timetable
 */

// Types
export * from './types';

// Constants
export * from './constants';

// Components
export { DraggableLessonCard } from './DraggableLessonCard';
export { DroppableTimeSlot } from './DroppableTimeSlot';
export { DragLegend } from './DragLegend';
export { TimetableToolbar } from './TimetableToolbar';
export { UnplacedSidebar } from './UnplacedSidebar';

// Grids
export {
    ClassViewGrid,
    TeacherViewGrid,
    RoomViewGrid,
    CompactViewGrid,
} from './grids';

// Hooks
export {
    useTimetableData,
    useTimetableActions,
} from './hooks';
export type {
    UseTimetableDataReturn,
    UseTimetableActionsReturn,
    UseTimetableActionsProps,
} from './hooks';
