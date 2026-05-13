# Frontend (School Timetable Management) — Sharp Edges

## DnD System (⚠️ CRITICAL)
- `react-dnd` with `HTML5Backend` wraps the entire app via `DndProvider`
- Custom `DragContext` (in `timetable/context/DragContext.tsx`) handles:
  - Auto-switch class on drag start
  - Availability-based slot highlighting
  - Precomputed occupation index for O(1) conflict detection
- **NEVER put `useMemo`/`useCallback`/hooks after early `return`** — causes "Rendered more hooks" crash

## Component Architecture
- `TimetableViewPageWithAPI.tsx` is the GOD component (~2400 lines) — be careful
- `DraggableLessonCard` → triggers `DragContext.onDragStart()`
- `DroppableTimeSlot` → uses `DragContext.getSlotStatus()` for highlighting
- `ClassViewGrid` → auto-scrolls to target class during drag

## API Communication
- `lib/api.ts` → `apiCall<T>()` — generic fetch wrapper with JWT
- `config/api.ts` → `API_CONFIG.BASE_URL` (from `VITE_API_URL`)
- `components/api/timetableActionApi.ts` → mock DnD actions (validate + apply)
- Mock mode: `VITE_USE_MOCK_API=true` in `.env`

## Known Type Issues
- `ConnectDragSource`/`ConnectDropTarget` → `Ref<HTMLDivElement>` mismatch
- This is a react-dnd v16 + React 18 known issue — works at runtime, ignore TS errors

## Styling
- Tailwind CSS + Shadcn/UI (`components/ui/`)
- Subject colors defined in `timetable/constants.ts`
- NEVER use inline hex colors — use Tailwind utilities
