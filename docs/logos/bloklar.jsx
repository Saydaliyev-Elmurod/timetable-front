// Bloklar glyph + wordmark system
// Glyph: 3 rows that form an "E" — top/bottom long, middle shorter.
// One teal cell = the "live"/"resolved" mark.

const cellsTop = [
  { x: 32,  w: 30, op: 0.95 },
  { x: 66,  w: 30, op: 0.42 },
  { x: 100, w: 30, accent: 'teal' },
  { x: 134, w: 36, op: 0.42 },
];
const cellsMid = [
  { x: 32, w: 30, op: 0.95 },
  { x: 66, w: 30, op: 0.42 },
  { x: 100, w: 22, op: 0.95 },
];
const cellsBot = [
  { x: 32,  w: 30, op: 0.95 },
  { x: 66,  w: 30, op: 0.42 },
  { x: 100, w: 30, op: 0.95 },
  { x: 134, w: 36, op: 0.42 },
];

function row(cells, y, opts = {}) {
  const fg = opts.cellOn || '#ffffff';
  const accent = opts.accent || '#14B8A6';
  return cells.map((c, i) => (
    <rect
      key={i}
      x={c.x}
      y={y + 10}
      width={c.w}
      height="16"
      rx="3.5"
      fill={c.accent === 'teal' ? accent : fg}
      fillOpacity={c.accent ? 1 : (c.op ?? 1)}
    />
  ));
}

// Full color glyph — primary
function BloklarGlyph({ bg = '#4F46E5', cellOn = '#ffffff', accent = '#14B8A6' } = {}) {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      {/* top row */}
      <rect x="22" y="40" width="156" height="36" rx="9" fill={bg} />
      {row(cellsTop, 40, { cellOn, accent })}
      {/* middle row — shorter */}
      <rect x="22" y="82" width="108" height="36" rx="9" fill={bg} />
      {row(cellsMid, 82, { cellOn, accent })}
      {/* bottom row */}
      <rect x="22" y="124" width="156" height="36" rx="9" fill={bg} />
      {row(cellsBot, 124, { cellOn, accent })}
    </svg>
  );
}

// Compact version — used at small sizes, simplifies to 3 bars + a single dot.
function BloklarMini({ bg = '#4F46E5', accent = '#14B8A6' } = {}) {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <rect x="22" y="40" width="156" height="36" rx="9" fill={bg} />
      <rect x="22" y="82" width="108" height="36" rx="9" fill={bg} />
      <rect x="22" y="124" width="156" height="36" rx="9" fill={bg} />
      <circle cx="156" cy="58" r="7" fill={accent} />
    </svg>
  );
}

// Single-color (monochrome) version — for stamps, embossing, faxes.
function BloklarMono({ color = '#0B0F1A' } = {}) {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <rect x="22" y="40" width="156" height="36" rx="9" fill={color} />
      <rect x="22" y="82" width="108" height="36" rx="9" fill={color} />
      <rect x="22" y="124" width="156" height="36" rx="9" fill={color} />
    </svg>
  );
}

// Outline / line version — alt treatment
function BloklarOutline({ color = '#4F46E5', accent = '#14B8A6' } = {}) {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <rect x="22" y="40" width="156" height="36" rx="9" fill="none" stroke={color} strokeWidth="6" />
      <rect x="22" y="82" width="108" height="36" rx="9" fill="none" stroke={color} strokeWidth="6" />
      <rect x="22" y="124" width="156" height="36" rx="9" fill="none" stroke={color} strokeWidth="6" />
      <circle cx="156" cy="58" r="7" fill={accent} />
    </svg>
  );
}

window.BloklarGlyph = BloklarGlyph;
window.BloklarMini = BloklarMini;
window.BloklarMono = BloklarMono;
window.BloklarOutline = BloklarOutline;
