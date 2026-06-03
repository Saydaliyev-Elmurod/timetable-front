# School Timetable Management — Frontend

Vite + React 18 + TypeScript SPA for managing school timetables: classes, teachers, subjects, rooms, lessons, and drag-and-drop scheduling.

## Run

```bash
npm i
npm run dev        # http://localhost:3000
npm run build      # → build/
npm run typecheck  # tsc --noEmit
npm test           # vitest
```

Config via `.env`: `VITE_API_URL` (backend, default `http://localhost:8080`), `VITE_USE_MOCK_API` (`true` = in-memory mock).

## Docs

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — architecture, API layer, DnD subsystem, i18n, testing. Single source of truth.
- **[CLAUDE.md](CLAUDE.md)** — sharp edges / agent guardrails.

Original design: [Figma](https://www.figma.com/design/OJ3dM44Isy2DkbUgQ7uAIS/School-Timetable-Management).
