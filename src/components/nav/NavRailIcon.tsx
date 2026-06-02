import React from 'react';

// Bo'limga moslashtirilgan navigatsiya ikonlari (B variant — kompakt ikon-rail).
// Har biri 24x24 viewBox, currentColor, stroke konfiguratsiya qilinadi.
// Manba: Claude Design "Sidebar Variants" — nav-variants/icons.jsx.
export type NavIconName =
  | 'maktab'
  | 'sinflar'
  | 'oqituvchilar'
  | 'fanlar'
  | 'xonalar'
  | 'darslar'
  | 'jadvallari';

interface NavRailIconProps {
  name: NavIconName;
  size?: number;
  stroke?: number;
}

const PATHS: Record<NavIconName, React.ReactNode> = {
  // Maktab — bayroqli maktab binosi (umumiy "home" emas, aniq "maktab")
  maktab: (
    <>
      <path d="M3 21h18" />
      <path d="M5 21V10l7-5 7 5v11" />
      <path d="M10 21v-5h4v5" />
      <path d="M12 5V2" />
    </>
  ),
  // Sinflar — uchta figura (sinf guruhi)
  sinflar: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20v-1a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1" />
      <circle cx="17" cy="9" r="2.2" />
      <path d="M15.5 20v-.5a3 3 0 0 1 3-3h.5a2.5 2.5 0 0 1 2.5 2.5V20" />
    </>
  ),
  // O'qituvchilar — pointerli yakka shaxs
  oqituvchilar: (
    <>
      <circle cx="12" cy="7" r="3.2" />
      <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
      <path d="M18 4.5l3-1.5v4" />
    </>
  ),
  // Fanlar — ochiq kitob (dastur)
  fanlar: (
    <>
      <path d="M3 5a2 2 0 0 1 2-2h5v16H5a2 2 0 0 1-2-2z" />
      <path d="M21 5a2 2 0 0 0-2-2h-5v16h5a2 2 0 0 0 2-2z" />
      <path d="M3 19h18" />
    </>
  ),
  // Xonalar — ramka ichidagi eshik
  xonalar: (
    <>
      <path d="M4 21V4a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v17" />
      <path d="M2 21h20" />
      <path d="M9 21v-9a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v9" />
      <circle cx="13.5" cy="16" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),
  // Darslar — doska / dars slaydi
  darslar: (
    <>
      <rect x="3" y="4" width="18" height="13" rx="1.5" />
      <path d="M7 21h10" />
      <path d="M12 17v4" />
      <path d="M7 9h6" />
      <path d="M7 12h4" />
    </>
  ),
  // Dars jadvallari — to'ldirilgan kalendar grid
  jadvallari: (
    <>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M8 2v4M16 2v4M3 10h18" />
      <rect x="6.5" y="13" width="3" height="2" rx="0.4" fill="currentColor" stroke="none" opacity="0.55" />
      <rect x="14.5" y="13" width="3" height="2" rx="0.4" fill="currentColor" stroke="none" opacity="0.55" />
      <rect x="10.5" y="16.5" width="3" height="2" rx="0.4" fill="currentColor" stroke="none" opacity="0.55" />
    </>
  ),
};

export function NavRailIcon({ name, size = 20, stroke = 1.75 }: NavRailIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
