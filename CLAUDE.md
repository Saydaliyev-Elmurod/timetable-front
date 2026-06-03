# Frontend (School Timetable Management) — Sharp Edges

> Architecture reference: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). This file = guardrails only.

## DnD System (⚠️ CRITICAL)
- `react-dnd` with `HTML5Backend`; `DndProvider` wraps the timetable view
- Custom `DragContext` (in `components/timetable/context/DragContext.tsx`) handles:
  - Auto-switch class on drag start
  - Availability-based slot highlighting
  - Precomputed occupation index for O(1) conflict detection
- **NEVER put `useMemo`/`useCallback`/hooks after early `return`** — causes "Rendered more hooks" crash

## Component Architecture
- `components/pages/TimetableViewPageWithAPI.tsx` (~340 lines) is the orchestrator — composes the timetable view; be careful
- Live grid/card components live in `components/pages/timetable-view/` (cards, `grids/`, `types.ts`, `constants.ts`) and `components/pages/timetable-view-api/` (`MainGrid`, `UnplacedSidebar`, data/action/editor hooks)
- ⚠️ `components/timetable/` is mostly legacy — only `context/DragContext.tsx` + `DragStatusLegend.tsx` are still used. Do NOT add new code there or import its old grid duplicates.

## API Communication
- `lib/api.ts` → `apiCall<T>()` — generic fetch wrapper with JWT + `Accept-Language`
- `config/api.ts` → `API_CONFIG.BASE_URL` (from `VITE_API_URL`), versioned `API_ENDPOINTS`, `USE_MOCK`
- `components/api/timetableActionApi.ts` → action-based DnD edits (`MOVE_LESSON`/`SWAP_LESSONS`/`PLACE_UNPLACED_LESSON`), validate→apply, `timetable_version` optimistic locking; call `initializeMockLessons()` first in mock mode
- Mock mode: `VITE_USE_MOCK_API=true` in `.env`

## Known Type Issues
- `ConnectDragSource`/`ConnectDropTarget` → `Ref<HTMLDivElement>` mismatch
- react-dnd v16 + React 18 known issue — works at runtime, ignore TS errors

## Styling
- Tailwind CSS v4 + Shadcn/UI (`components/ui/`) — Tailwind must compile live, never dump a static `index.css`
- Subject colors defined in `components/pages/timetable-view/constants.ts`
- NEVER use inline hex colors — use Tailwind utilities
