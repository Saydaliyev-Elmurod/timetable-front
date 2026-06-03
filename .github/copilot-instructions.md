# Copilot / AI agent instructions

This is a Vite + React 18 + TypeScript frontend for School Timetable Management. Dev runs against in-repo mock APIs (`VITE_USE_MOCK_API=true`).

Read these before editing:

- **[../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)** — architecture, API layer, DnD subsystem, routing, i18n, testing. Single source of truth.
- **[../CLAUDE.md](../CLAUDE.md)** — sharp edges / guardrails (DnD hook rules, legacy `components/timetable/`, action API contract).

Commands: `npm i` · `npm run dev` (port 3000) · `npm run build` (→ `build/`) · `npm run typecheck` · `npm test`.

Conventions: components are PascalCase with default exports; reuse `src/components/ui/*` primitives; import via `@/` alias; pages live in `src/components/pages/*`.
