// Six distinct E-timetable logo glyphs.
// Each glyph is square (viewBox 0 0 200 200) and uses brand tokens.
// Wordmarks are rendered alongside in the artboard.

const Glyph = {

  // 1 · BLOKLAR — three schedule rows form the letter E.
  //    The middle row is shorter, which is what creates the E shape.
  //    A few cells are highlighted teal: "active class" / "optimized".
  bloklar: (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      {/* top row */}
      <rect x="22" y="40" width="156" height="36" rx="9" fill="#4F46E5" />
      <rect x="32" y="50" width="30" height="16" rx="3.5" fill="#fff" fillOpacity="0.95" />
      <rect x="66" y="50" width="30" height="16" rx="3.5" fill="#fff" fillOpacity="0.42" />
      <rect x="100" y="50" width="30" height="16" rx="3.5" fill="#14B8A6" />
      <rect x="134" y="50" width="36" height="16" rx="3.5" fill="#fff" fillOpacity="0.42" />

      {/* middle row — shorter, creates the E */}
      <rect x="22" y="82" width="108" height="36" rx="9" fill="#4F46E5" />
      <rect x="32" y="92" width="30" height="16" rx="3.5" fill="#fff" fillOpacity="0.95" />
      <rect x="66" y="92" width="30" height="16" rx="3.5" fill="#fff" fillOpacity="0.42" />
      <rect x="100" y="92" width="22" height="16" rx="3.5" fill="#fff" fillOpacity="0.95" />

      {/* bottom row */}
      <rect x="22" y="124" width="156" height="36" rx="9" fill="#4F46E5" />
      <rect x="32" y="134" width="30" height="16" rx="3.5" fill="#14B8A6" />
      <rect x="66" y="134" width="30" height="16" rx="3.5" fill="#fff" fillOpacity="0.42" />
      <rect x="100" y="134" width="30" height="16" rx="3.5" fill="#fff" fillOpacity="0.95" />
      <rect x="134" y="134" width="36" height="16" rx="3.5" fill="#fff" fillOpacity="0.42" />
    </svg>
  ),

  // 2 · ANOR — Uzbek pomegranate. Body is a circle, seeds are a clean
  //    grid clipped to the body. National symbol meets timetable grid.
  anor: (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="anor-body">
          <circle cx="100" cy="116" r="54" />
        </clipPath>
        <linearGradient id="anor-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6366F1" />
          <stop offset="1" stopColor="#4338CA" />
        </linearGradient>
      </defs>

      {/* crown / leaves */}
      <path d="M100 28 L92 50 L100 48 L108 50 Z" fill="#0F8B7E" />
      <path d="M100 30 L96 48 L100 47 Z" fill="#14B8A6" />
      <path d="M100 30 L104 48 L100 47 Z" fill="#0E7A6F" />
      {/* tiny stem dot */}
      <circle cx="100" cy="50" r="3" fill="#0F8B7E" />

      {/* body */}
      <circle cx="100" cy="116" r="60" fill="url(#anor-grad)" />

      {/* faint inner ring suggesting cross-section */}
      <circle cx="100" cy="116" r="50" fill="none" stroke="#fff" strokeOpacity="0.12" strokeWidth="2" />

      {/* highlight */}
      <ellipse cx="80" cy="92" rx="14" ry="6" fill="#fff" fillOpacity="0.18" transform="rotate(-30 80 92)" />

      {/* seeds — 5×5 grid clipped to body */}
      <g clipPath="url(#anor-body)">
        {(() => {
          const cells = [];
          const accents = { '1,1': '#14B8A6', '3,2': '#F59E0B', '2,3': '#14B8A6' };
          for (let r = 0; r < 6; r++) {
            for (let c = 0; c < 6; c++) {
              const key = `${r},${c}`;
              const cx = 56 + c * 14;
              const cy = 86 + r * 12;
              cells.push(
                <rect
                  key={key}
                  x={cx}
                  y={cy}
                  width="10"
                  height="8"
                  rx="2"
                  fill={accents[key] || '#fff'}
                  fillOpacity={accents[key] ? 1 : 0.88}
                />
              );
            }
          }
          return cells;
        })()}
      </g>
    </svg>
  ),

  // 3 · YULDUZ — eight-point Uzbek star built from two overlaid squares,
  //    overlaid with a faint internal grid + one bright schedule cell.
  //    Cultural geometry × timetable cell.
  yulduz: (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="yulduz-clip">
          <g>
            <rect x="40" y="40" width="120" height="120" rx="6" />
            <rect x="40" y="40" width="120" height="120" rx="6" transform="rotate(45 100 100)" />
          </g>
        </clipPath>
      </defs>

      {/* star body — two overlaid squares */}
      <g>
        <rect x="40" y="40" width="120" height="120" rx="6" fill="#4F46E5" />
        <rect x="40" y="40" width="120" height="120" rx="6" fill="#4F46E5" transform="rotate(45 100 100)" />
      </g>

      {/* internal grid lines (clipped to star) */}
      <g clipPath="url(#yulduz-clip)" stroke="#fff" strokeOpacity="0.22" strokeWidth="1.25">
        <line x1="76" y1="20" x2="76" y2="180" />
        <line x1="100" y1="20" x2="100" y2="180" />
        <line x1="124" y1="20" x2="124" y2="180" />
        <line x1="20" y1="76" x2="180" y2="76" />
        <line x1="20" y1="100" x2="180" y2="100" />
        <line x1="20" y1="124" x2="180" y2="124" />
      </g>

      {/* central highlighted cell */}
      <rect x="88" y="88" width="24" height="24" rx="4" fill="#14B8A6" />

      {/* small accent inside center cell */}
      <path d="M93 100 L98 105 L107 95" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  ),

  // 4 · TANGRAM — four interlocking tetrominoes fill a perfect square.
  //    "Hamma narsa o'rniga tushadi." The optimization metaphor, literal.
  tangram: (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      {(() => {
        // 4×4 grid solution:
        //   A B B B
        //   A C B D
        //   A C D D
        //   A C C D
        // A = indigo-600, B = teal, C = amber, D = indigo-400
        const colors = { A: '#4F46E5', B: '#14B8A6', C: '#F59E0B', D: '#818CF8' };
        const grid = [
          ['A', 'B', 'B', 'B'],
          ['A', 'C', 'B', 'D'],
          ['A', 'C', 'D', 'D'],
          ['A', 'C', 'C', 'D'],
        ];
        const cellW = 36;
        const x0 = 100 - (cellW * 4) / 2;
        const y0 = 100 - (cellW * 4) / 2;
        const out = [];
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            out.push(
              <rect
                key={`${r}-${c}`}
                x={x0 + c * cellW + 2}
                y={y0 + r * cellW + 2}
                width={cellW - 4}
                height={cellW - 4}
                rx="6"
                fill={colors[grid[r][c]]}
              />
            );
          }
        }
        return out;
      })()}
    </svg>
  ),

  // 5 · LENTA — a single folded ribbon traces the letter E.
  //    Origami language: each fold has a darker shadow on the right edge.
  //    Implies continuous flow (one operation produces the whole schedule).
  lenta: (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      {/* left spine (the back of the ribbon) */}
      <path d="M22 38 L34 38 L34 162 L22 162 Z" fill="#3730A3" />

      {/* top arm */}
      <path d="M34 38 L172 38 L172 72 L34 72 Z" fill="#4F46E5" />
      {/* fold shadow on right end */}
      <path d="M172 38 L172 72 L160 55 Z" fill="#3730A3" />
      {/* arm shadow underneath */}
      <path d="M34 72 L172 72 L172 78 L34 78 Z" fill="#3730A3" opacity="0.55" />

      {/* middle arm (shorter) */}
      <path d="M34 86 L128 86 L128 120 L34 120 Z" fill="#6366F1" />
      <path d="M128 86 L128 120 L116 103 Z" fill="#4338CA" />
      <path d="M34 120 L128 120 L128 126 L34 126 Z" fill="#3730A3" opacity="0.45" />

      {/* bottom arm */}
      <path d="M34 134 L172 134 L172 168 L34 168 Z" fill="#4F46E5" />
      <path d="M172 134 L172 168 L160 151 Z" fill="#3730A3" />

      {/* tiny teal corner — the "delivered" mark */}
      <circle cx="166" cy="50" r="4" fill="#14B8A6" />
    </svg>
  ),

  // 6 · SOAT — clock face where the hours are rounded schedule cells
  //    instead of numerals. Hands set to 8:00 (school day start).
  soat: (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      {/* outer face */}
      <circle cx="100" cy="100" r="84" fill="#fff" stroke="#E2E8F0" strokeWidth="2" />

      {/* 12 hour cells around perimeter — radius 72 */}
      {(() => {
        const cells = [];
        const highlight = new Set([0, 7]); // 12 o'clock + 8 o'clock
        for (let i = 0; i < 12; i++) {
          const a = (i * 30 - 90) * (Math.PI / 180);
          const cx = 100 + Math.cos(a) * 72;
          const cy = 100 + Math.sin(a) * 72;
          const isHi = highlight.has(i);
          cells.push(
            <rect
              key={i}
              x={cx - 8}
              y={cy - 8}
              width="16"
              height="16"
              rx="3.5"
              fill={isHi ? '#14B8A6' : '#4F46E5'}
              fillOpacity={isHi ? 1 : (i % 3 === 0 ? 1 : 0.78)}
            />
          );
        }
        return cells;
      })()}

      {/* hour hand → pointing to 8 (240°) */}
      <line
        x1="100"
        y1="100"
        x2={100 + Math.cos((240 - 90) * Math.PI / 180) * 38}
        y2={100 + Math.sin((240 - 90) * Math.PI / 180) * 38}
        stroke="#0B0F1A"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* minute hand → pointing to 12 */}
      <line x1="100" y1="100" x2="100" y2="46" stroke="#0B0F1A" strokeWidth="3" strokeLinecap="round" />

      {/* center pin */}
      <circle cx="100" cy="100" r="6" fill="#0B0F1A" />
      <circle cx="100" cy="100" r="2" fill="#fff" />
    </svg>
  ),
};

// Tiny variant of each glyph for the 24px scale-test chip.
// For most, the full glyph works fine at small size; for cell-dense ones
// (bloklar, anor) we want a simplified read.
const GlyphMini = {
  bloklar: (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <rect x="22" y="40" width="156" height="36" rx="9" fill="#4F46E5" />
      <rect x="22" y="82" width="108" height="36" rx="9" fill="#4F46E5" />
      <rect x="22" y="124" width="156" height="36" rx="9" fill="#4F46E5" />
      <circle cx="156" cy="58" r="6" fill="#14B8A6" />
    </svg>
  ),
  anor: Glyph.anor,
  yulduz: Glyph.yulduz,
  tangram: Glyph.tangram,
  lenta: Glyph.lenta,
  soat: (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="80" fill="none" stroke="#4F46E5" strokeWidth="14" />
      <rect x="92" y="20" width="16" height="16" rx="3.5" fill="#14B8A6" />
      <line x1="100" y1="100" x2={100 + Math.cos((240 - 90) * Math.PI / 180) * 36} y2={100 + Math.sin((240 - 90) * Math.PI / 180) * 36} stroke="#0B0F1A" strokeWidth="8" strokeLinecap="round" />
      <line x1="100" y1="100" x2="100" y2="50" stroke="#0B0F1A" strokeWidth="6" strokeLinecap="round" />
      <circle cx="100" cy="100" r="8" fill="#0B0F1A" />
    </svg>
  ),
};

window.Glyph = Glyph;
window.GlyphMini = GlyphMini;
