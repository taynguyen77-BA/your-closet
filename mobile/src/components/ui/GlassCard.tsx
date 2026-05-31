import { BlurView } from 'expo-blur';
import { ReactNode } from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '@/theme';

interface GlassCardProps {
  children: ReactNode;
  style?: ViewStyle;
  intensity?: number;
}

export function GlassCard({ children, style, intensity = 40 }: GlassCardProps) {
  const { colors, radius, isDark } = useTheme();

  if (Platform.OS === 'ios') {
    return (
      <View style={[styles.wrap, { borderRadius: radius.lg }, style]}>
        <BlurView
          intensity={intensity}
          tint={isDark ? 'dark' : 'light'}
          style={[styles.blur, { borderRadius: radius.lg, borderColor: colors.border }]}
        >
          {children}
        </BlurView>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden' },
  blur: {
    overflow: 'hidden',
    borderWidth: 1,
    padding: 16,
  },
  fallback: {
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
});
