import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '@/theme';

interface GlassCardProps {
  children: ReactNode;
  style?: ViewStyle;
  intensity?: number;
}

export function GlassCard({ children, style }: GlassCardProps) {
  const { colors, radius } = useTheme();
  return (
    <View
      style={[
        styles.fallback,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    borderWidth: 0,
    padding: 16,
  },
});
