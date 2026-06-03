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
- `lib/api.ts` → `createCrudService<TRes,TReq,TUpdateReq>(endpointKey)` + `buildQuery(base, params)` — entity services (`lib/{classes,rooms,subjects,teachers}.ts`) compose the factory; **don't re-add the `apiCall → throw → return data!` boilerplate.** Each service spreads the base methods and aliases its own names (`createBulk`/`bulkAdd`/`deleteBulk`/`getTemplates`/`bulkTimeoff`) — keep that pattern so call sites stay stable
- `config/api.ts` → `API_CONFIG.BASE_URL` (from `VITE_API_URL`), versioned `API_ENDPOINTS`, `USE_MOCK`
- `components/api/timetableActionApi.ts` → action-based DnD edits (`MOVE_LESSON`/`SWAP_LESSONS`/`PLACE_UNPLACED_LESSON`), validate→apply, `timetable_version` optimistic locking; call `initializeMockLessons()` first in mock mode
- Mock mode: `VITE_USE_MOCK_API=true` in `.env`

## Shared Building Blocks (use these — do NOT re-duplicate)
The CRUD entity pages (`Classes/Teachers/Subjects/Rooms`) share these. Reuse before reinventing inline:
- `lib/availability.ts` → `AvailState` type + `getEmptyAvail`/`getFullAvail`/`convertToApiFormat`/`convertFromApiFormat` (optional `{ dayMap }` for localized day keys). `days` is **required** (no default). Subjects re-exports them dayMap-bound via `pages/subjects-page/helpers.ts`
- `components/shared/AvailGrid.tsx` → interactive day×period grid; per-page look (colors, border, fonts, `dayLabel`, `stopPropagation`) is driven by props — pass props, don't fork it
- `components/shared/AvailMini.tsx` → read-only availability heatmap for list rows
- `components/shared/PageLoading.tsx` → full-page loading spinner; use as `if (isLoading && list.length===0) return <PageLoading />`
- Barrel: import from `@/components/shared` (also re-exports `CrudPageHeader`, `BulkActionBar`, `Pagination`, `btnPrimary/btnSecondary/inp`, `API_DAYS_OF_WEEK`, `API_DAY_SHORT`, `getActiveApiDays`)
- ⚠️ Delete-confirm modals are intentionally **per-page** (each diverges in layout/icon/animation/backdrop-close) — not shared. Don't try to unify them into one component; that's a redesign, not a dedupe

## Known Type Issues
- `ConnectDragSource`/`ConnectDropTarget` → `Ref<HTMLDivElement>` mismatch
- react-dnd v16 + React 18 known issue — works at runtime, ignore TS errors

## Styling
- Tailwind CSS v4 + Shadcn/UI (`components/ui/`) — Tailwind must compile live, never dump a static `index.css`
- Subject colors defined in `components/pages/timetable-view/constants.ts`
- NEVER use inline hex colors — use Tailwind utilities

## Performance (render isolation & deferral)
`content-visibility` utilities live in `styles/globals.css` (each paired with a `@supports not` fallback). **Reuse these — do NOT inline raw `content-visibility` or re-invent.**
- `.cv-grid-isolate` → on each **repeated grid root** (per class/teacher/room) in `timetable-view/grids.tsx`. Isolates drag/cell reflow to one grid + defers off-screen grids. Keep on any new per-entity grid.
- `.cv-list-item` → on items in a **genuinely overflowing** list (e.g. `UnplacedSidebar`). ⚠️ Do NOT add to paginated/above-the-fold rows (CRUD entity lists) — `content-visibility:auto` on in-viewport content *delays* paint (anti-pattern).
- ⚠️ `MainGrid` switches views by **remount** (early-return per `viewMode`), intentionally. A `content-visibility:hidden` view-cache was tried and reverted: benchmarking showed the reveal-paint of the revealed view ≈ remount cost, and keeping all 4 views mounted added a constant per-switch layout cost on the larger DOM. Don't re-add a view cache without a production-build measurement proving a win.
- Drag conflict checks use a per-drop `day-hour` slot index (`buildSlotIndex` in `useTimetableEditor.ts`), not a full scan — keep `validatePlacement` O(1)-per-slot; never reintroduce a `scheduledRef.current` full loop.
- `lib/webVitals.ts` → dev-only INP/LCP/CLS attribution, wired behind `import.meta.env.DEV` in `main.tsx` (stripped from prod). Open DevTools console + drag → `[web-vitals] INP …` to measure. Pass `{ beacon: '/url' }` to switch to prod RUM when an endpoint exists.
