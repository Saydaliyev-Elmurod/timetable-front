# E-timetable Design System

> The official design system for **E-timetable** (`e-timetable.uz`). This platform is a SaaS product that automatically generates conflict-free class schedules for schools, universities, and learning centers in Uzbekistan using AI and mathematical optimization (Google OR-Tools).

---

## 1. Product Context

* **Market and Audience:** The Uzbekistan market. Primary users are school directors, heads of academic affairs, and private center administrators.
* **Core Solution:** Solves a scheduling process that usually takes weeks in mere seconds, eliminating "windows" (gaps in teacher schedules) and double-booking conflicts. Features full integration with `e-maktab.uz`.
* **Tone:** Professional, confident, and modern. Acts as a helpful assistant who understands the problem and offers a concrete solution.

## 2. Content and Copywriting (UX Writing)

* **Language:** Uzbek language (Latin script).
* **Punctuation:** Only the straight ASCII apostrophe (`'`) is used for the tutuq belgisi (e.g., *O'qituvchi*, *yo'q*).
* **Formality:** Always use the formal **"Siz"** (you). Never use the informal "sen".
* **Numbers:** Always write counts using numerals (`15 ta o'qituvchi`, not *o'n besh ta*).
* **Capitalization:** Use sentence case for headlines and buttons. ALL CAPS may only be used for small eyebrow labels.

## 3. Visual Foundations (UI)

**Aesthetic:** "Modern SaaS" — Clean, generous whitespace, confident typography, and a **Grid** motif that reflects the core product (since schedules are literal grids).

**Color Palette:**
* **Primary:** `#4F46E5` (Indigo-600) — Represents trust and algorithmic precision.
* **Primary Hover:** `#4338CA` (Darker indigo).
* **Accent:** `#14B8A6` (Teal-500) — Symbolizes successful optimization.
* **Warn:** `#F59E0B` (Amber-500) — For schedule "windows" (gaps).
* **Danger:** `#EF4444` (Red-500) — For conflicts and errors.
* **Neutrals:** Cool-tinted slate grays from `#0B0F1A` to `#F8FAFC`. White (`#FFFFFF`) is the default surface color.

**Typography:**
* **Display (Headlines):** `Plus Jakarta Sans` (700/800) — Modern geometric sans, fully supports Latin-Extended.
* **UI & Body:** `Manrope` (400/500/600/700) — Highly legible even at small sizes.
* **Mono (Code & Tables):** `JetBrains Mono` (400/500).

## 4. Components and Surfaces

* **Spacing:** A 4px-based spacing system (4, 8, 12, 16, 24, 32, 48, 64, 96, 128). Sections use 96–128px vertical padding.
* **Corner Radii:** `10px` (sm) for buttons, `20px` (lg) for cards.
* **Cards:** White background, `1px` light gray (`slate-200`) border, soft `md` shadow, 24-32px interior padding.
* **Icons:** Only **[Lucide](https://lucide.dev/)** icons are used (20-24px size, 1.75px stroke width). Never use emojis inside the UI chrome.
* **Backgrounds:** A very faint `slate-100` grid pattern can be used as a background in Hero sections to hint at the timetable metaphor.
