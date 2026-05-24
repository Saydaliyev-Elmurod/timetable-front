import React from 'react';

// Brand assets live in /public/logos (source of truth: docs/logos).
// `glyph.svg` is the square mark; the wordmark text is rendered as HTML so it
// can recolor for dark backgrounds and use the app's Plus Jakarta Sans font.

const GLYPH_SRC = '/logos/glyph.svg';
const WORDMARK = 'darsjadval';

interface BrandMarkProps {
  size?: number;
  className?: string;
}

/** Square logo mark (glyph only). Use for collapsed sidebar, avatars, favicons. */
export function BrandMark({ size = 32, className }: BrandMarkProps) {
  return (
    <img
      src={GLYPH_SRC}
      width={size}
      height={size}
      alt={WORDMARK}
      className={className}
      style={{ display: 'block', borderRadius: size * 0.28 }}
    />
  );
}

interface BrandLogoProps {
  /** Light text for dark backgrounds. */
  dark?: boolean;
  /** Glyph size in px; wordmark scales with it. */
  size?: number;
  className?: string;
}

/** Full lockup: glyph mark + wordmark. */
export function BrandLogo({ dark = false, size = 32, className }: BrandLogoProps) {
  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.32 }}
    >
      <BrandMark size={size} />
      <span
        style={{
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          fontWeight: 800,
          fontSize: size * 0.6,
          letterSpacing: '-0.02em',
          color: dark ? '#F8FAFC' : '#0F172A',
        }}
      >
        {WORDMARK}
      </span>
    </span>
  );
}
