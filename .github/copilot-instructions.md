## Quick orientation

This repository is a Vite + React (TSX) frontend for a School Timetable Management UI. The app runs with the dev server (`vite`) and currently uses in-repo mock APIs to let the UI function without a backend.

Key commands (run from repository root):

- Install: `npm i`
- Dev server: `npm run dev` (Vite, opens at port 3000)
- Build: `npm run build` (output dir: `build`)

## Big-picture architecture and important files

- Entry: `src/main.tsx` creates the React root and mounts `src/App.tsx`.
- Top-level view switching: `src/App.tsx` (simple view-state: landing, login, dashboard).
- Pages: `src/pages/*` contain the main screens (Timetables, Lessons, Teachers, Rooms, etc.).
- Reusable UI primitives: `src/components/ui/*` — use these (Button, Select, Dialog, Toast/Toaster) when adding UI.
- Modals & forms: e.g. `src/components/AddLessonModal.tsx` demonstrates the project's form patterns (controlled state, Radix/Command/Popover combos, Chip lists for selections).

API & scheduling core
- Action-based timetable API: `src/components/api/timetableActionApi.ts` — the project models timetable edits as atomic actions (MOVE_LESSON, SWAP_LESSONS, PLACE_UNPLACED_LESSON). Important concepts:
  - Validation vs apply: the API exposes both `validateMove` and `applyAction` flows. UI typically validates before applying.
  - Optimistic locking: requests carry `timetable_version`. The mock implementation uses `mockTimetableVersion` and returns version conflicts. Preserve this pattern if you change the backend contract.
  - Soft constraint impact: validation responses include `soft_constraint_impact` describing gaps/quality score/warnings.
- Mock APIs: `src/components/api/mockApi.ts` contains in-memory subjects/teachers/rooms and convenience helpers. The front-end uses the `USE_MOCK_API` flag in `timetableActionApi.ts` to switch between mock and real endpoints.

Project conventions and patterns (important for editing code):

- TypeScript + React components use PascalCase filenames and default exports for components (e.g., `AddLessonModal.tsx`).
- UI primitives are composable and themed (use `src/components/ui/*` to keep consistent look and avoid duplicating behavior).
- Local state / persistence: `src/App.tsx` stores `user` and `language` in `localStorage`. Be aware of this convention when adding auth or cross-page state.
- Network / backend stubbing: many features expect the mock API to provide data structures (see `initializeMockLessons` in `timetableActionApi.ts`). When testing the timetable view, call `initializeMockLessons(lessons)` before using the mock action API.
- Aliases: Vite config maps `@` to `./src` in `vite.config.ts`. Use `@/path/to/file` when adding imports to match existing style.

Examples agents can use (concrete snippets)

- To run dev server and check the app: `npm run dev` (server opens on port 3000, configured in `vite.config.ts`).
- Example: validate a move action against mock API

  - File: `src/components/api/timetableActionApi.ts` (see `validateMove`) — follow the shape `TimetableActionRequest`:
    - `action_type`: one of `MOVE_LESSON` | `SWAP_LESSONS` | `PLACE_UNPLACED_LESSON`
    - `timetable_version`: use `timetableActionApi.getCurrentVersion()` in mocks
    - `payload`: action-specific payload (see validate/apply helpers in file)

- When changing scheduler behavior, respect version checks. The mock `apply*` helpers compare incoming `version` to `mockTimetableVersion` and return a conflict error if mismatched.

What an AI agent should prioritize when editing this repo

- Read `timetableActionApi.ts` before making changes to timetable flows. It contains the contract (validation, errors, soft-constraints) the UI expects.
- When adding UI, reuse components from `src/components/ui` to maintain consistent accessibility and styling.
- If you need to toggle backend vs mock, change `USE_MOCK_API` in `timetableActionApi.ts` and ensure `initializeMockLessons(...)` is called with the expected lesson shape.

Search tips and places to look

- Find timetable action usage: search for `timetableActionApi` (used in timetable pages/components).
- Look for pages under `src/pages/` to see how screens are wired.
- UI primitives live in `src/components/ui/` — use them as canonical examples for form controls, dialog, popover, select, command, etc.

Known gaps & assumptions (what I observed from source files)

- There is no server or backend in this repo; the mock APIs are used for development. If you implement a backend, preserve the action/validation/apply semantics and `timetable_version` optimistic-locking.
- There are no tests in the repo (no test scripts in `package.json`). If you add tests, prefer lightweight unit tests for API helper logic and React Testing Library for key components.

If something is unclear or you want the file to include additional examples (e.g., common refactors, data shapes for lessons, or walkthroughs for adding a real backend), tell me which parts to expand and I'll update this file.
