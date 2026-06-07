import type { PropsWithChildren } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme';

export function AuthScreen({ title, subtitle, children }: PropsWithChildren<{ title: string; subtitle: string }>) {
  const { colors, gradients, radius } = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= 820;

  return (
    <LinearGradient colors={gradients.marketplace} style={styles.fill}>
      <ScrollView contentContainerStyle={[styles.scroll, wide && styles.scrollWide]} keyboardShouldPersistTaps="handled">
        <View style={[styles.stage, wide && styles.stageWide]}>
          <View style={[styles.copyPane, wide && styles.copyPaneWide]}>
            <View style={styles.brandRow}>
              <View style={[styles.brandMark, { backgroundColor: colors.accent }]} />
              <AppText variant="caption" color={colors.textInverse}>YOUR CLOSET</AppText>
            </View>
            <AppText variant="display" color={colors.textInverse} style={styles.title}>{title}</AppText>
            <AppText color="#D8CEC2" style={styles.subtitle}>{subtitle}</AppText>
            <View style={[styles.preview, { borderColor: '#FFFFFF24', backgroundColor: '#FFFFFF10', borderRadius: radius.xl }]}>
              <View style={[styles.rail, { backgroundColor: '#FFFFFF99' }]} />
              {['#F6DCE5', '#DCEBE3', '#E7E1F5'].map((color, index) => (
                <View key={color} style={[styles.hanger, { left: 34 + index * 58 }]}>
                  <View style={[styles.hook, { borderColor: '#FFF9F1' }]} />
                  <View style={[styles.garment, { backgroundColor: color, borderColor: '#FFFFFF66' }]} />
                </View>
              ))}
              <View style={[styles.note, { backgroundColor: colors.surface }]}>
                <AppText variant="caption" color={colors.accentDark}>AI stylist</AppText>
                <AppText variant="bodySmall" color={colors.textSecondary}>Gợi ý outfit theo tủ đồ, thời tiết và gu riêng.</AppText>
              </View>
            </View>
          </View>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: '#FFFFFF33', borderRadius: radius.xl }]}>
            {children}
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}
const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  scrollWide: { padding: 36 },
  stage: { gap: 22, width: '100%', maxWidth: 1120, alignSelf: 'center' },
  stageWide: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  copyPane: { minHeight: 300, justifyContent: 'center' },
  copyPaneWide: { flex: 1, paddingRight: 32 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  brandMark: { width: 32, height: 32, borderRadius: 8 },
  title: { maxWidth: 560, fontSize: 38, lineHeight: 44 },
  subtitle: { maxWidth: 560, marginTop: 12, fontSize: 16, lineHeight: 25 },
  preview: { height: 230, marginTop: 26, maxWidth: 520, overflow: 'hidden', borderWidth: 1 },
  rail: { height: 2, left: 28, right: 28, top: 38, position: 'absolute' },
  hanger: { position: 'absolute', top: 30, width: 52, alignItems: 'center' },
  hook: { width: 18, height: 18, borderTopWidth: 2, borderRightWidth: 2, borderRadius: 12, transform: [{ rotate: '-35deg' }] },
  garment: { width: 50, height: 86, marginTop: 2, borderWidth: 1, borderRadius: 14 },
  note: { position: 'absolute', right: 18, bottom: 18, width: 190, padding: 14, borderRadius: 14 },
  card: { width: '100%', maxWidth: 500, alignSelf: 'center', padding: 22, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 12 } },
});
