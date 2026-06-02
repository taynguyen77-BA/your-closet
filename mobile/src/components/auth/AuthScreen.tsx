import type { PropsWithChildren } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme';
export function AuthScreen({ title, subtitle, children }: PropsWithChildren<{ title: string; subtitle: string }>) {
  const { colors, gradients, radius } = useTheme();
  return <LinearGradient colors={gradients.marketplace} style={styles.fill}><ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
    <View style={[styles.sparkle, { backgroundColor: colors.accent }]} /><AppText variant="caption" color={colors.primary}>YOUR CLOSET · TỦ ĐỒ CỦA BẠN</AppText>
    <AppText variant="display" style={{ marginTop: 8 }}>{title}</AppText><AppText muted style={{ marginTop: 6 }}>{subtitle}</AppText>
    <View style={[styles.card, { backgroundColor: colors.surfaceGlass, borderColor: colors.border, borderRadius: radius.xl }]}>{children}</View>
  </ScrollView></LinearGradient>;
}
const styles = StyleSheet.create({ fill: { flex: 1 }, scroll: { flexGrow: 1, justifyContent: 'center', padding: 22 }, card: { marginTop: 22, padding: 18, borderWidth: 1 }, sparkle: { width: 46, height: 46, borderRadius: 23, marginBottom: 14 } });
