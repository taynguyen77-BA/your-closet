/**
 * Brand palette per DESIGN.md ("Colors"): Espresso / Sand / Linen / White.
 * DESIGN.md's YAML frontmatter carries a conflicting auto-generated Material-3
 * palette (primary #000000, background #f9f9f9); the prose palette is the brand.
 * Source: docs/design/stitch-export/.../wardro/DESIGN.md
 */
const ESPRESSO = '#1A1208';
const SAND = '#D4B896';
const LINEN = '#F7F4F0';
const WHITE = '#FFFFFF';

export const brand = {
  espresso: ESPRESSO,
  sand: SAND,
  linen: LINEN,
  white: WHITE,
} as const;

export const lightColors = {
  primary: ESPRESSO,
  secondary: '#6D8C7D',
  background: LINEN,
  backgroundTint: '#EEF4F1',
  surface: WHITE,
  surfaceGlass: '#FFFFFF',
  sand: SAND,
  beige: '#EFE5D7',
  warmGray: '#82786D',
  warmLight: '#F3E8D8',
  pink: '#F6DCE5',
  electricPink: '#D85D84',
  accentLight: '#F7C6D8',
  coral: '#E87868',
  lavender: '#E7E1F5',
  sky: '#DCEAF7',
  mint: '#DCEBE3',
  lemon: '#F3D98B',
  peach: '#F4C8AA',
  deepPurple: '#2E2347',
  accent: '#D85D84',
  accentDark: '#8F395A',
  gold: '#C9A15D',
  sage: '#6D8C7D',
  success: '#2F7D59',
  warning: '#B88128',
  error: '#B94B54',
  ai: '#2E2347',
  community: '#2F6F73',
  marketplace: ESPRESSO,
  border: '#E2D8CC',
  shadow: ESPRESSO,
  text: ESPRESSO,
  textMuted: '#746A60',
  textSecondary: '#4D463F',
  textInverse: WHITE,
  overlay: ESPRESSO,
} as const;

export const gradients = {
  hero: [ESPRESSO, '#2E2347', '#8F395A'] as const,
  primary: [ESPRESSO, ESPRESSO] as const,
  ai: ['#2E2347', ESPRESSO, '#8F395A'] as const,
  closet: [ESPRESSO, '#263F3B', '#6D8C7D'] as const,
  community: ['#2F6F73', '#263F3B', ESPRESSO] as const,
  marketplace: [ESPRESSO, '#263F3B'] as const,
  premium: [ESPRESSO, '#8F395A', '#D85D84'] as const,
  dark: [ESPRESSO, ESPRESSO] as const,
  sunshine: ['#FFF9F1', '#EEF4F1'] as const,
  deep: [ESPRESSO, '#2E2347'] as const,
} as const;

export const darkColors = lightColors;
export type AppColors = typeof lightColors;
