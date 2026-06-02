export const lightColors = {
  primary: '#1A1208',
  secondary: '#C8A97E',
  background: '#F5F0E8',
  backgroundTint: '#F5F0E8',
  surface: '#FFFFFF',
  surfaceGlass: '#FFFFFF',
  beige: '#F5F0E8',
  warmGray: '#9E8E78',
  pink: '#F5F0E8',
  electricPink: '#1A1208',
  coral: '#C8A97E',
  lavender: '#F5F0E8',
  sky: '#F5F0E8',
  mint: '#F5F0E8',
  lemon: '#C8A97E',
  peach: '#F5F0E8',
  deepPurple: '#1A1208',
  accent: '#C8A97E',
  accentDark: '#1A1208',
  gold: '#C8A97E',
  sage: '#F5F0E8',
  success: '#1A1208',
  warning: '#C8A97E',
  error: '#1A1208',
  ai: '#1A1208',
  community: '#1A1208',
  marketplace: '#1A1208',
  border: '#C8A97E',
  shadow: '#1A1208',
  text: '#1A1208',
  textMuted: '#9E8E78',
  textSecondary: '#9E8E78',
  textInverse: '#F5F0E8',
  overlay: '#1A1208',
} as const;

// Kept for compatibility while legacy screens migrate from LinearGradient.
// Identical stops render as flat fills and stay inside the three-color palette.
export const gradients = {
  hero: ['#1A1208', '#1A1208'] as const,
  primary: ['#1A1208', '#1A1208'] as const,
  ai: ['#1A1208', '#1A1208'] as const,
  closet: ['#1A1208', '#1A1208'] as const,
  community: ['#1A1208', '#1A1208'] as const,
  marketplace: ['#1A1208', '#1A1208'] as const,
  premium: ['#1A1208', '#1A1208'] as const,
  dark: ['#1A1208', '#1A1208'] as const,
  sunshine: ['#FFFFFF', '#FFFFFF'] as const,
  deep: ['#1A1208', '#1A1208'] as const,
} as const;

export const darkColors = lightColors;
export type AppColors = typeof lightColors;
