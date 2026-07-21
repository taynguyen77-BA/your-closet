import { brand, darkColors, gradients, lightColors, type AppColors } from './colors';
import { layout, radius, rounded, spacing } from './spacing';
import { fontFamily, typeScale, typography } from './typography';

export {
  brand,
  darkColors,
  fontFamily,
  gradients,
  layout,
  lightColors,
  radius,
  rounded,
  spacing,
  typeScale,
  typography,
};
export type { AppColors };

export function useTheme() {
  const isDark = false;
  const colors = lightColors;

  return {
    brand,
    colors,
    fontFamily,
    gradients,
    isDark,
    layout,
    spacing,
    radius,
    rounded,
    typeScale,
    typography,
  };
}
