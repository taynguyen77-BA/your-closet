import { useColorScheme } from 'react-native';
import { darkColors, lightColors, type AppColors } from './colors';
import { radius, spacing } from './spacing';
import { typography } from './typography';

export { darkColors, lightColors, radius, spacing, typography };
export type { AppColors };

export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return {
    colors,
    isDark,
    spacing,
    radius,
    typography,
  };
}
