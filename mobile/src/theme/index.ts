import { useColorScheme } from 'react-native';
import { darkColors, gradients, lightColors, type AppColors } from './colors';
import { radius, spacing } from './spacing';
import { typography } from './typography';

export { darkColors, gradients, lightColors, radius, spacing, typography };
export type { AppColors };

export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return {
    colors,
    gradients,
    isDark,
    spacing,
    radius,
    typography,
  };
}
