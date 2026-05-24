// Letter-substitution helpers for darsjadval / Timetable wordmarks.
// Each helper is sized to drop in next to Plus Jakarta Sans 800 text:
// it consumes ~1 character of space at the same cap height.

// Dotless j (U+0237) + custom teal cell instead of the dot.
// The dot sits where the j-tittle would be at PJS 800.
function CellJ({ accent = '#14B8A6', size = 64 }) {
  // size = font-size in px; sit the cell at ~0.22em above baseline of cap.
  const cell = size * 0.16;
  const top = -size * 0.16;
  const left = size * 0.07;
  return (
    <span style={{ position: 'relative', display: 'inline-block', lineHeight: 1 }}>
      <span>&#x0237;</span>
      <span
        style={{
          position: 'absolute',
          top: `${top}px`,
          left: `${left}px`,
          width: `${cell}px`,
          height: `${cell}px`,
          background: accent,
          borderRadius: `${cell * 0.22}px`,
        }}
      />
    </span>
  );
}

// Dotless i (U+0131) + cell.
function CellI({ accent = '#14B8A6', size = 64 }) {
  const cell = size * 0.16;
  const top = -size * 0.16;
  const left = size * 0.04;
  return (
    <span style={{ position: 'relative', display: 'inline-block', lineHeight: 1 }}>
      <span>&#x0131;</span>
      <span
        style={{
          position: 'absolute',
          top: `${top}px`,
          left: `${left}px`,
          width: `${cell}px`,
          height: `${cell}px`,
          background: accent,
          borderRadius: `${cell * 0.22}px`,
        }}
      />
    </span>
  );
}

// "l" replaced by a vertical schedule-block bar (one tall column with 3 cells).
function BarL({ color = '#4F46E5', accent = '#14B8A6', size = 64 }) {
  const w = size * 0.32;
  const h = size * 0.78;
  const r = size * 0.07;
  const pad = size * 0.05;
  const cellH = (h - pad * 4) / 3;
  return (
    <svg
      width={w}
      height={size}
      viewBox={`0 0 ${w} ${size}`}
      style={{ display: 'inline-block', verticalAlign: 'baseline' }}
    >
      <rect x="0" y={size - h - size * 0.05} width={w} height={h} rx={r} fill={color} />
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={pad}
          y={size - h - size * 0.05 + pad + i * (cellH + pad)}
          width={w - pad * 2}
          height={cellH}
          rx={r * 0.4}
          fill={i === 1 ? accent : '#fff'}
          fillOpacity={i === 1 ? 1 : i === 0 ? 0.92 : 0.42}
        />
      ))}
    </svg>
  );
}

// "a" replaced by a rounded schedule cell with a horizontal crossbar (suggests an "a").
function CellA({ color = '#4F46E5', size = 64 }) {
  const w = size * 0.58;
  const h = size * 0.62;
  const r = size * 0.14;
  return (
    <svg
      width={w}
      height={size}
      viewBox={`0 0 ${w} ${size}`}
      style={{ display: 'inline-block', verticalAlign: 'baseline' }}
    >
      <rect x="0" y={size - h - size * 0.04} width={w} height={h} rx={r} fill={color} />
      <rect
        x={w * 0.18}
        y={size - h * 0.45 - size * 0.04}
        width={w * 0.64}
        height={h * 0.18}
        rx={r * 0.3}
        fill="#fff"
        fillOpacity="0.9"
      />
    </svg>
  );
}

// "T" cross-bar treatment: a tiny 3-cell schedule row above a stem.
function CellT({ color = '#4F46E5', accent = '#14B8A6', size = 64 }) {
  // sized to read as a capital T at PJS 800
  const w = size * 0.62;
  const top = size * 0.05;
  const barH = size * 0.18;
  const stemW = size * 0.14;
  const stemH = size * 0.62;
  return (
    <svg
      width={w}
      height={size}
      viewBox={`0 0 ${w} ${size}`}
      style={{ display: 'inline-block', verticalAlign: 'baseline' }}
    >
      {/* top bar */}
      <rect x="0" y={top} width={w} height={barH} rx={barH * 0.28} fill={color} />
      {/* 3 cells inside top bar */}
      {[0, 1, 2].map((i) => {
        const pad = barH * 0.18;
        const cw = (w - pad * 4) / 3;
        return (
          <rect
            key={i}
            x={pad + i * (cw + pad)}
            y={top + pad}
            width={cw}
            height={barH - pad * 2}
            rx="2.5"
            fill={i === 1 ? accent : '#fff'}
            fillOpacity={i === 1 ? 1 : 0.85}
          />
        );
      })}
      {/* stem */}
      <rect x={(w - stemW) / 2} y={top + barH} width={stemW} height={stemH} fill={color} />
    </svg>
  );
}

Object.assign(window, { CellJ, CellI, BarL, CellA, CellT });
