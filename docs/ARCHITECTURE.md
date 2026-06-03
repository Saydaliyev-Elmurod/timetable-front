# School Timetable Management — Frontend

Single source of truth for this frontend. Vite + React 18 + TypeScript SPA for managing school timetables (classes, teachers, subjects, rooms, lessons) with drag-and-drop scheduling.

> Agent-facing rules live in [`/CLAUDE.md`](../CLAUDE.md) (sharp edges). This file is the architecture reference.

---

## Quick start

```bash
npm i
npm run dev        # Vite dev server, http://localhost:3000
npm run build      # output → build/
npm run typecheck  # tsc --noEmit
npm test           # vitest
```

Environment (`.env`):

| Var | Default | Meaning |
|-----|---------|---------|
| `VITE_API_URL` | `http://localhost:8080` | Backend base URL |
| `VITE_USE_MOCK_API` | `true` | Use in-memory mock DnD actions instead of real backend |

Path alias: `@/` → `src/` (configured in `vite.config.ts` + `tsconfig.json`).

---

## Architecture

### Boot chain
`index.html` → `src/main.tsx` → `TranslationProvider` → `<Suspense>` → `src/App.tsx`.

`App.tsx` holds top-level view state (`landing` → `login` → `dashboard`) and persists `user` + `language` in `localStorage`. Auth token via `lib/auth.ts` (JWT bearer).

### Routing
No router library. `Dashboard.tsx` switches screens off a `currentPage` string with `lazy()`-loaded pages. Pages live in **`src/components/pages/*`** (not `src/pages/`). Dynamic route: `timetable-view-{id}` → `TimetableViewPageWithAPI`.

Pages: Organization, Classes, ClassSetup, DocsClasses, Teachers, Subjects, Rooms, Lessons, Timetables, TimetableView, TimetableViewPageWithAPI, Profile.

### API layer
- `config/api.ts` — single source: `API_CONFIG.BASE_URL`, `API_ENDPOINTS` (versioned, e.g. `/api/teachers/v1`), `USE_MOCK` flag, `getApiUrl()`.
- `lib/api.ts` — `apiCall<T>()` generic fetch wrapper: injects JWT `Authorization`, `Accept-Language` (backend localizes errors), parses JSON, surfaces structured server errors via `sonner` toast. Types: `ApiResponse<T>`, `PaginatedResponse<T>`.
- Per-entity clients: `lib/{classes,rooms,subjects,teachers,lessons}.ts`, `api/organizationApi.ts`.
- `components/api/timetableActionApi.ts` — **action-based** DnD edit API. Models edits as atomic actions: `MOVE_LESSON`, `SWAP_LESSONS`, `PLACE_UNPLACED_LESSON`. Two-phase: **validate** before **apply**. Carries `timetable_version` for optimistic locking (mock returns version conflicts). Validation responses include `soft_constraint_impact` (gaps / quality score / warnings). Call `initializeMockLessons(lessons)` before using mock actions.

### Drag & Drop (⚠️ critical subsystem)
- `react-dnd` + `HTML5Backend`, `DndProvider` wraps the timetable view.
- `components/timetable/context/DragContext.tsx` — auto-switch class on drag start, availability-based slot highlighting, precomputed O(1) occupation index for conflict detection.
- Live grid/card components: **`components/pages/timetable-view/`** (`DraggableLessonCard`, `grids/`, `types.ts`, `constants.ts` incl. subject colors) and **`components/pages/timetable-view-api/`** (`MainGrid`, `UnplacedSidebar`, hooks: `useTimetableData`, `useTimetableActions`, `useTimetableEditor`).
- `components/pages/TimetableViewPageWithAPI.tsx` is the orchestrator (~340 lines) — composes the above + `DragContextProvider` + `DragStatusLegend`.
- **NEVER put `useMemo`/`useCallback`/hooks after an early `return`** → "Rendered more hooks" crash.

### Real-time
`lib/generationSocket.ts` + `@stomp/stompjs` + `sockjs-client` stream timetable-generation progress. `context/GenerationNotifier.tsx` exposes `GenerationProvider`.

### i18n
`i18n/index.tsx` → `TranslationProvider` + `useTranslation` over `react-i18next`. Locales: `src/locales/{en,ru,uz}.json`.

### Styling
Tailwind CSS v4 (`@tailwindcss/vite`) + Shadcn/UI primitives in `components/ui/*`. Tailwind must compile live — never dump a static `index.css`. Use Tailwind utilities, never inline hex.

### State
React local state + Context only (no Redux/Zustand): `TranslationProvider`, `GenerationProvider`, `DragContext`.

---

## Testing
Vitest + React Testing Library + jsdom. Config `vitest.config.ts`, setup `src/setupTests.ts`. Tests under `src/components/pages/__tests__/`.

---

## Known type issues
`ConnectDragSource` / `ConnectDropTarget` → `Ref<HTMLDivElement>` mismatch is a react-dnd v16 + React 18 issue. Works at runtime; ignore the TS error.

---

## Attribution
UI primitives from [shadcn/ui](https://ui.shadcn.com/) under [MIT license](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md).
