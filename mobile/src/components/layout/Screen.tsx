import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  edges?: ('top' | 'bottom')[];
  bottomOffset?: number;
}

export function Screen({
  children,
  scroll = true,
  padded = true,
  style,
  edges = ['top'],
  bottomOffset = 0,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useTheme();

  const paddingTop = edges.includes('top') ? insets.top + spacing.md : 0;
  const paddingBottom = (edges.includes('bottom') ? insets.bottom + spacing.lg : spacing.lg) + bottomOffset;

  const content = (
    <Animated.View
      entering={FadeIn.duration(360)}
      style={[
        styles.inner,
        {
          backgroundColor: colors.background,
          paddingTop,
          paddingBottom,
          paddingHorizontal: padded ? spacing.lg : 0,
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );

  if (!scroll) return content;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      {content}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  inner: { flex: 1, overflow: 'hidden' },
});
