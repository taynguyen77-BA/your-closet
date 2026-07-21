import { TextStyle } from 'react-native';

/**
 * Type per DESIGN.md ("Typography"). Each family below is a single-weight face
 * registered in app/_layout.tsx, so weight is carried by the family name and
 * fontWeight is left unset — setting it would only trigger synthetic bolding.
 * Source: docs/design/stitch-export/.../wardro/DESIGN.md
 */
export const fontFamily = {
  serif: 'DM Serif Display',
  regular: 'DM Sans',
  medium: 'DM Sans Medium',
  bold: 'DM Sans Bold',
} as const;

/** DESIGN.md's canonical scale under its own token names. letterSpacing converted em -> px. */
export const typeScale = {
  displayLg: {
    fontFamily: fontFamily.serif,
    fontSize: 48,
    letterSpacing: -0.96,
    lineHeight: 56,
  },
  displayLgMobile: {
    fontFamily: fontFamily.serif,
    fontSize: 36,
    letterSpacing: -0.36,
    lineHeight: 42,
  },
  headlineMd: {
    fontFamily: fontFamily.serif,
    fontSize: 32,
    lineHeight: 40,
  },
  headlineSm: {
    fontFamily: fontFamily.serif,
    fontSize: 24,
    lineHeight: 32,
  },
  bodyLg: {
    fontFamily: fontFamily.regular,
    fontSize: 18,
    lineHeight: 28,
  },
  bodyMd: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  labelMd: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    letterSpacing: 0.7,
    lineHeight: 20,
  },
  labelSm: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    letterSpacing: 0.24,
    lineHeight: 16,
  },
} as const satisfies Record<string, TextStyle>;

/**
 * App variants. fontSize/lineHeight are held at their existing values so the
 * restyle stays layout-preserving; only family, weight and tracking follow
 * DESIGN.md. h3 has no DESIGN.md counterpart — its smallest serif step is
 * headlineSm at 24 — so h3 keeps its own size.
 */
export const typography: Record<string, TextStyle> = {
  display: {
    fontFamily: fontFamily.serif,
    fontSize: 28,
    letterSpacing: -0.28,
    lineHeight: 34,
  },
  h1: {
    fontFamily: fontFamily.serif,
    fontSize: 24,
    letterSpacing: 0,
    lineHeight: 30,
  },
  h2: {
    fontFamily: fontFamily.serif,
    fontSize: 20,
    letterSpacing: 0,
    lineHeight: 26,
  },
  h3: {
    fontFamily: fontFamily.serif,
    fontSize: 17,
    letterSpacing: 0,
    lineHeight: 22,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 21,
  },
  bodySmall: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  caption: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    letterSpacing: 1,
    lineHeight: 14,
    textTransform: 'uppercase',
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    letterSpacing: 0.7,
    lineHeight: 18,
  },
};
