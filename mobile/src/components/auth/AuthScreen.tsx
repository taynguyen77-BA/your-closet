import type { PropsWithChildren, ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { layout, useTheme } from '@/theme';

interface AuthScreenProps {
  title: string;
  subtitle?: string;
  /** Pinned to the bottom of the viewport, as in the Stitch auth screens. */
  footer?: ReactNode;
  showBack?: boolean;
}

/**
 * Auth shell per the Stitch export (nh_p_s_i_n_tho_i_wardro, x_c_nh_n_otp_wardro):
 * a Linen canvas with a back nav, a serif headline, the form, and the primary
 * action pinned in a footer.
 */
export function AuthScreen({
  title,
  subtitle,
  footer,
  showBack = true,
  children,
}: PropsWithChildren<AuthScreenProps>) {
  const { colors, typeScale } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.stage}>
          {showBack && router.canGoBack() ? (
            <View style={styles.nav}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Quay lại"
                onPress={() => router.back()}
                hitSlop={8}
                style={({ pressed }) => [styles.back, { opacity: pressed ? 0.6 : 1 }]}
              >
                <Ionicons name="arrow-back" size={24} color={colors.primary} />
              </Pressable>
            </View>
          ) : (
            <View style={styles.navSpacer} />
          )}
          <View style={styles.main}>
            <AppText style={[typeScale.headlineMd, { color: colors.primary }]}>{title}</AppText>
            {subtitle ? (
              <AppText variant="bodySmall" color={colors.textSecondary} style={styles.subtitle}>
                {subtitle}
              </AppText>
            ) : null}
            <View style={styles.body}>{children}</View>
          </View>
        </View>
      </ScrollView>
      {footer ? (
        <View style={[styles.footer, { backgroundColor: colors.background }]}>
          <View style={styles.footerInner}>{footer}</View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { flexGrow: 1 },
  stage: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' },
  nav: { paddingHorizontal: layout.marginMobile, paddingTop: 48, paddingBottom: layout.stackMd },
  navSpacer: { height: 48 },
  back: { padding: 8, marginLeft: -8, alignSelf: 'flex-start' },
  main: { flexGrow: 1, paddingHorizontal: layout.marginMobile },
  subtitle: { marginTop: layout.stackSm },
  body: { marginTop: layout.stackLg, gap: layout.stackMd },
  footer: { paddingHorizontal: layout.marginMobile, paddingTop: layout.stackSm, paddingBottom: 48 },
  footerInner: { width: '100%', maxWidth: 480, alignSelf: 'center' },
});
