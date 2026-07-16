/**
 * Spacing per DESIGN.md ("Layout & Spacing"). The existing numeric scale below is
 * already built on DESIGN.md's 4px `unit`, so it stays as-is; `layout` adds the
 * semantic tokens DESIGN.md names directly.
 * Source: docs/design/stitch-export/.../wardro/DESIGN.md
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  jumbo: 40,
} as const;

export const layout = {
  unit: 4,
  stackSm: 12,
  stackMd: 24,
  stackLg: 48,
  gutter: 24,
  marginMobile: 20,
  marginDesktop: 64,
  containerMax: 1200,
} as const;

/**
 * DESIGN.md ("Shapes"): 4px on buttons, inputs and small cards; 8px on large
 * containers; pill for chips. Screens migrate onto this as they are restyled —
 * `radius` below is the pre-Stitch scale still used by screens not yet skinned.
 */
export const rounded = {
  sm: 2,
  DEFAULT: 4,
  md: 6,
  lg: 8,
  xl: 12,
  full: 9999,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 16,
  xxl: 20,
  full: 999,
} as const;
