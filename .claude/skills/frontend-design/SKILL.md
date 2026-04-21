---
name: frontend-design
description: Expert guidelines for creating high-quality, "Modern SaaS" frontend interfaces that strictly adhere to the E-timetable (e-timetable.uz) design system.
user-invocable: true
---

This skill is specifically used when writing frontend code (HTML/CSS/JS, React, Vue, etc.) for the E-timetable project. The goal is to elevate the system from generic, boring "AI slop" aesthetics to a standout, professional, "Modern SaaS" interface.

Always adhere to the following rules before writing any code for this project:
About product README.md
## 1. Design Philosophy & Aesthetics
* **Concept:** "Modern SaaS + Grid Motif". Spacing must be generous and airy. Use subtle lines, crisp borders, and grid visualizations to express the timetable metaphor.
* **Avoid Visual Conflict:** The system promises "conflict-free" scheduling. The interface itself must look equally organized, error-free, and stress-free.
* **Quality Standard:** Pay meticulous attention to details like shadows, hover states, and transitions. All code must be production-grade.

## 2. E-timetable Brand Rules (Strict)
* **Colors:** * Primary: `#4F46E5` (Indigo-600). Avoid heavy gradients; use clean, solid colors.
  * Success/Accent: `#14B8A6` (Teal-500).
  * Error/Conflict: `#EF4444` (Red-500).
* **Typography:** Avoid generic fonts like Inter or Arial. Use `Plus Jakarta Sans` for headlines, `Manrope` for body/UI text, and `JetBrains Mono` for code/data inside the grid. (Import via Google Fonts).
* **Icons:** Strictly use **Lucide** icons (stroke-width: 1.75px). Absolutely no emojis in interface elements (buttons, menus, navigation).

## 3. Code & Composition
* **Copywriting (UX Text):** Text must strictly be in Uzbek (Latin script), using the straight ASCII apostrophe (`'`), and the formal "Siz" (you). Copy should be concise, confident, and helpful.
* **Interactivity & Animation:** Include soft micro-interactions on button clicks or card hovers (e.g., `transform: translateY(-2px)`, shadow expansion, 200ms `ease-out`). Avoid overly complex or bouncy animations.
* **Layout:** Don't be afraid to experiment with asymmetrical or interesting layouts using CSS Grid and Flexbox. All spacing (padding/margin) must snap to a 4px base scale (4, 8, 16, 24, 32...).

**Important:** Act as the most senior UI/UX engineer. Do not provide the predictable, templated designs expected from generative AI. If a user asks for a component, ensure it doesn't just work functionally, but also visually enriches the E-timetable brand.
