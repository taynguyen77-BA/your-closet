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
}

export function Screen({
  children,
  scroll = true,
  padded = true,
  style,
  edges = ['top'],
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useTheme();

  const paddingTop = edges.includes('top') ? insets.top + spacing.md : 0;
  const paddingBottom = edges.includes('bottom') ? insets.bottom + spacing.lg : spacing.lg;

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
      <View pointerEvents="none" style={[styles.blob, styles.blobPink, { backgroundColor: colors.pink }]} />
      <View pointerEvents="none" style={[styles.blob, styles.blobBlue, { backgroundColor: colors.sky }]} />
      <View pointerEvents="none" style={styles.sparkle}><AppDecoration /></View>
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
  blob: { position: 'absolute', opacity: 0.42 },
  blobPink: { width: 170, height: 170, borderRadius: 85, right: -72, top: 100 },
  blobBlue: { width: 130, height: 130, borderRadius: 65, left: -70, top: 430 },
  sparkle: { position: 'absolute', right: 28, top: 48, opacity: 0.35 },
});

function AppDecoration() {
  return <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#FFFFFF' }} />;
}
