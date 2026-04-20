# Timetable Frontend Engine Workflow

Whenever I ask you to build, update, or optimize a UI feature for the Timetable Frontend, you MUST follow this agent chain strictly:

1.  **Run `frontend-pm`**: To structure the UI requirements, user stories, and feature specs.
2.  **Run `ui-ux-expert`**: To design the interaction model, Tailwind design system, and Dnd feedback loops.
3.  **Run `frontend-architect`**: To design the state management (Zustand/Redux), component hierarchy, and data mapping layers.
4.  **Run `frontend-code-agent`**: To implement the React components and Dnd logic in TypeScript.
5.  **Run `frontend-test-agent`**: To write integration tests for the grid logic and end-to-end flows.
6.  **Run `frontend-review-agent`**: For performance profiling (re-render checks), code quality, and Tailwind standards.

## Execution Rules:
- **Do not skip any steps.**
- Ensure a seamless data flow between the Backend API responses and the Frontend Grid State.
- Every UI change must be verified for "Drag-and-Drop" stability (no ghosting, correct z-index, instant snapping).
- Performance is priority: Large grids must not lag during vertical/horizontal scrolling.
