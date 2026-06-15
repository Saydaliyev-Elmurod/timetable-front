import { createContext, useContext } from 'react';

/**
 * Minimal edit-intent channel for the timetable view.
 *
 * Lives in the `timetable-view/` layer (next to the grids that consume it) so
 * the grids never import upward from `timetable-view-api/`. The actual modal +
 * data loading is supplied by `EntityEditorProvider` (in `timetable-view-api/`),
 * which renders the SHARED `ClassEditor`/`TeacherEditor`/`RoomEditor`.
 *
 * Why a context instead of prop-drilling `onEditEntity` through MainGrid → grids:
 * `openEditor` is referentially stable, so opening the modal re-renders only the
 * provider — NOT the orchestrator, MainGrid, or the (heavy) grids. That is the
 * state-colocation that keeps the big timetable from re-rendering on edit.
 */
export type EntityKind = 'class' | 'teacher' | 'room';

export interface EntityEditApi {
  /** Open the shared editor for an entity by id. No-op if no provider is mounted. */
  openEditor: (kind: EntityKind, id: number) => void;
}

const NOOP: EntityEditApi = { openEditor: () => {} };

export const EntityEditContext = createContext<EntityEditApi>(NOOP);

export const useEntityEdit = (): EntityEditApi => useContext(EntityEditContext);
