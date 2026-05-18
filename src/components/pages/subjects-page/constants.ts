export const CL_DAYS = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sha', 'Yak'];

export interface SubjectPaletteEntry {
  id: string;
  base: string;
  tint: string;
  ink: string;
}

export const SX_PALETTE: SubjectPaletteEntry[] = [
  { id: 'indigo', base: '#4F46E5', tint: '#EEF2FF', ink: '#3730A3' },
  { id: 'blue', base: '#3B82F6', tint: '#DBEAFE', ink: '#1E40AF' },
  { id: 'sky', base: '#0EA5E9', tint: '#E0F2FE', ink: '#075985' },
  { id: 'teal', base: '#14B8A6', tint: '#CCFBF1', ink: '#115E59' },
  { id: 'emerald', base: '#10B981', tint: '#D1FAE5', ink: '#065F46' },
  { id: 'lime', base: '#84CC16', tint: '#ECFCCB', ink: '#3F6212' },
  { id: 'amber', base: '#F59E0B', tint: '#FEF3C7', ink: '#92400E' },
  { id: 'orange', base: '#F97316', tint: '#FFEDD5', ink: '#9A3412' },
  { id: 'rose', base: '#F43F5E', tint: '#FFE4E6', ink: '#9F1239' },
  { id: 'pink', base: '#DB2777', tint: '#FCE7F3', ink: '#9D174D' },
  { id: 'fuchsia', base: '#C026D3', tint: '#FAE8FF', ink: '#86198F' },
  { id: 'violet', base: '#8B5CF6', tint: '#EDE9FE', ink: '#5B21B6' },
  { id: 'slate', base: '#475569', tint: '#F1F5F9', ink: '#1E293B' },
];

const SX_PAL_BY_BASE: Record<string, SubjectPaletteEntry> = Object.fromEntries(
  SX_PALETTE.map((p) => [p.base, p]),
);

export const palOf = (color: string): SubjectPaletteEntry =>
  SX_PAL_BY_BASE[color] || SX_PALETTE[0];

export const SX_WEIGHT_PRESETS = [
  { v: 2, label: 'Yengil', desc: 'Erkin joylashtirish' },
  { v: 4, label: "O'rtacha", desc: "Mumkin bo'lganda ertalab" },
  { v: 6, label: 'Muhim', desc: 'Asosan ertalab' },
  { v: 8, label: 'Yuqori', desc: 'Ertalab + bir kunda jamlash' },
  { v: 10, label: 'Kritik', desc: 'Avval joylashtiriladi' },
];

export const SX_CATEGORIES = [
  { id: 'ALL', label: 'Barchasi' },
  { id: 'EXACT', label: 'Aniq fanlar' },
  { id: 'NATURAL', label: 'Tabiiy fanlar' },
  { id: 'LANGUAGES', label: 'Tillar' },
  { id: 'SOCIAL', label: 'Ijtimoiy fanlar' },
  { id: 'CREATIVE', label: 'Amaliy va ijodiy' },
];

export const dayMapToApi: Record<string, string> = {
  Du: 'MONDAY',
  Se: 'TUESDAY',
  Ch: 'WEDNESDAY',
  Pa: 'THURSDAY',
  Ju: 'FRIDAY',
  Sha: 'SATURDAY',
  Yak: 'SUNDAY',
};

export const dayMapFromApi: Record<string, string> = {
  MONDAY: 'Du',
  TUESDAY: 'Se',
  WEDNESDAY: 'Ch',
  THURSDAY: 'Pa',
  FRIDAY: 'Ju',
  SATURDAY: 'Sha',
  SUNDAY: 'Yak',
};
