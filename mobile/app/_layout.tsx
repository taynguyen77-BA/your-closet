import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Pressable, StyleSheet, useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';
import { GuestAuthModal } from '@/components/auth/GuestAuthModal';
import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans';
import { DMSerifDisplay_400Regular } from '@expo-google-fonts/dm-serif-display';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'DM Sans': DMSans_400Regular,
    'DM Serif Display': DMSerifDisplay_400Regular,
  });
  const scheme = useColorScheme();
  const router = useRouter(); const segments = useSegments(); const { colors } = useTheme();
  const initialize = useAppStore((state) => state.initialize);
  const resetSession = useAppStore((state) => state.resetSession);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const {
    isAuthLoading, isAuthenticated, isGuest, onboardingCompleted, biometricEnabled,
    biometricVerified, verifyBiometric, logout, currentUser,
  } = useAuthStore();
  const routeKey = segments.join('/');
  const publicGuestRoutes = [
    '(tabs)',
    '(tabs)/index',
    '(tabs)/profile',
    '(tabs)/community',
    '(tabs)/closet',
    '(tabs)/try-on',
    '(tabs)/events',
    'profile',
    'community',
    'closet',
    'try-on',
    'events',
    'missions',
    'outfits',
    'shopping',
  ];
  const isPublicGuestRoute = publicGuestRoutes.includes(routeKey);
  const needsStyleSurvey = Boolean(currentUser && !currentUser.hasCompletedStyleSurvey && !currentUser.styleSurveySkipped);
  useEffect(() => { initializeAuth(); }, [initializeAuth]);
  useEffect(() => {
    if (!isAuthLoading && (isGuest || !isAuthenticated || (isAuthenticated && (!biometricEnabled || biometricVerified)))) void initialize();
  }, [initialize, isAuthLoading, isAuthenticated, isGuest, biometricEnabled, biometricVerified, routeKey]);
  useEffect(() => { if (!isAuthLoading && !isAuthenticated && !isGuest && !isPublicGuestRoute) resetSession(); }, [isAuthLoading, isAuthenticated, isGuest, resetSession, isPublicGuestRoute]);
  useEffect(() => {
    if (isAuthLoading) return;
    const inAuth = segments[0] === 'auth';
    const guestAllowedAuthRoute = [
      'auth/welcome',
      'auth/phone',
      'auth/otp',
    ].includes(segments.join('/'));
    const inStyleSurvey = segments.join('/') === 'onboarding/style-survey';
    const canEnterPrivate = isAuthenticated && (!biometricEnabled || biometricVerified);
    const canEnterUngated = isGuest;
    const guestBlockedRoute = [
      'community/create',
      'onboarding/style-survey',
      'payment/prepare',
      'profile/edit',
      'profile/style-preferences',
      'profile/style-preferences/advanced',
      'profile/delete-account',
      'settings',
    ].includes(segments.join('/'));
    if (!onboardingCompleted && !canEnterUngated && segments.join('/') !== 'auth/onboarding') router.replace('/auth/onboarding');
    else if (onboardingCompleted && !isAuthenticated && !canEnterUngated && !inAuth && !isPublicGuestRoute) router.replace('/auth/welcome');
    else if (onboardingCompleted && canEnterUngated && inAuth && !guestAllowedAuthRoute) router.replace('/(tabs)');
    else if (onboardingCompleted && canEnterUngated && guestBlockedRoute) router.replace('/(tabs)');
    else if (onboardingCompleted && canEnterPrivate && needsStyleSurvey && !inStyleSurvey) router.replace('/onboarding/style-survey' as never);
    else if (onboardingCompleted && canEnterPrivate && !needsStyleSurvey && (inAuth || inStyleSurvey)) router.replace('/(tabs)');
  }, [biometricEnabled, biometricVerified, currentUser, isAuthLoading, isAuthenticated, isGuest, isPublicGuestRoute, needsStyleSurvey, onboardingCompleted, router, routeKey, segments]);

  if (!fontsLoaded || isAuthLoading) return <View style={[styles.splash, { backgroundColor: colors.background }]}><View style={[styles.dot, { backgroundColor: colors.accent }]} /><AppText variant="display">Tủ đồ của bạn</AppText><AppText muted>Đang chuẩn bị phong cách riêng cho bạn...</AppText></View>;
  if (isAuthenticated && biometricEnabled && !biometricVerified) return <View style={[styles.splash, { backgroundColor: colors.background, padding: 24 }]}><View style={[styles.dot, { backgroundColor: colors.accent }]} /><AppText variant="display">Mở khóa tủ đồ</AppText><AppText muted style={{ textAlign: 'center', marginBottom: 16 }}>Xác minh Face ID, Touch ID hoặc vân tay để vào ứng dụng.</AppText><Pressable style={[styles.unlock, { backgroundColor: colors.primary }]} onPress={() => { void verifyBiometric(); }}><AppText color={colors.textInverse}>Đăng nhập bằng Face ID / Vân tay</AppText></Pressable><Pressable onPress={() => { void logout(); }} style={{ marginTop: 14 }}><AppText muted>Đăng nhập lại</AppText></Pressable></View>;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="community/index"
            options={{ headerShown: true, title: 'Cộng đồng Pass đồ', presentation: 'card' }}
          />
          <Stack.Screen
            name="community/[id]"
            options={{ headerShown: true, title: 'Chi tiết', presentation: 'card' }}
          />
          <Stack.Screen
            name="community/create"
            options={{ headerShown: true, title: 'Đăng tin', presentation: 'modal' }}
          />
          <Stack.Screen
            name="missions"
            options={{ headerShown: true, title: 'Nhiệm vụ', presentation: 'card' }}
          />
          <Stack.Screen
            name="membership"
            options={{ headerShown: true, title: 'Gói thành viên', presentation: 'modal' }}
          />
          <Stack.Screen
            name="outfit/[id]"
            options={{ headerShown: true, title: 'Chi tiết outfit', presentation: 'card' }}
          />
          <Stack.Screen
            name="closet/[id]"
            options={{ headerShown: true, title: 'Chi tiết món đồ', presentation: 'card' }}
          />
          <Stack.Screen
            name="settings"
            options={{ headerShown: true, title: 'Cài đặt', presentation: 'card' }}
          />
          <Stack.Screen
            name="profile/edit"
            options={{ headerShown: true, title: 'Chỉnh sửa hồ sơ', presentation: 'modal' }}
          />
          <Stack.Screen
            name="profile/delete-account"
            options={{ headerShown: true, title: 'Xoá tài khoản', presentation: 'modal' }}
          />
          <Stack.Screen name="onboarding/style-survey" />
          <Stack.Screen name="profile/style-preferences" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="profile/style-preferences/advanced" options={{ headerShown: true, title: 'Hồ sơ nâng cao', presentation: 'modal' }} />
          <Stack.Screen name="outfits" options={{ headerShown: true, title: 'Outfit', presentation: 'card' }} />
          <Stack.Screen name="shopping" options={{ headerShown: true, title: 'Mua sắm gợi ý', presentation: 'card' }} />
          <Stack.Screen name="payment/prepare" options={{ headerShown: true, title: 'Chuẩn bị thanh toán', presentation: 'card' }} />
        </Stack>
        <GuestAuthModal />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
const styles = StyleSheet.create({ splash: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }, dot: { width: 58, height: 58, borderRadius: 29, marginBottom: 8 }, unlock: { paddingHorizontal: 18, paddingVertical: 13, borderRadius: 14 } });
