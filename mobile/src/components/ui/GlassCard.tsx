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
      <View style={[styles.wrap, { borderRadius: radius.xl, shadowColor: colors.shadow }, style]}>
        <BlurView
          intensity={intensity}
          tint={isDark ? 'dark' : 'light'}
          style={[styles.blur, { borderRadius: radius.xl, borderColor: colors.border }]}
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
          borderRadius: radius.xl,
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
  wrap: { overflow: 'hidden', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 20 },
  blur: {
    overflow: 'hidden',
    borderWidth: 1,
    padding: 16,
  },
  fallback: {
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 3,
  },
});
