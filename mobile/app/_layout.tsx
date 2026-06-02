import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { StyleSheet, useColorScheme, View } from 'react-native';
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
  const { isAuthLoading, isAuthenticated, isGuest, hasCompletedOnboarding } = useAuthStore();
  const routeKey = segments.join('/');
  useEffect(() => { initializeAuth(); }, [initializeAuth]);
  useEffect(() => { if (!isAuthLoading && (isAuthenticated || isGuest)) void initialize(); }, [initialize, isAuthLoading, isAuthenticated, isGuest, routeKey]);
  useEffect(() => { if (!isAuthLoading && !isAuthenticated && !isGuest) resetSession(); }, [isAuthLoading, isAuthenticated, isGuest, resetSession]);
  useEffect(() => {
    if (isAuthLoading) return;
    const inAuth = segments[0] === 'auth';
    if (!isAuthenticated && !isGuest && !inAuth) router.replace('/auth/welcome');
    else if (isAuthenticated && !hasCompletedOnboarding && segments.join('/') !== 'auth/onboarding') router.replace('/auth/onboarding');
    else if ((isAuthenticated && hasCompletedOnboarding || isGuest) && inAuth) router.replace('/(tabs)');
  }, [hasCompletedOnboarding, isAuthLoading, isAuthenticated, isGuest, router, segments]);

  if (!fontsLoaded || isAuthLoading) return <View style={[styles.splash, { backgroundColor: colors.background }]}><View style={[styles.dot, { backgroundColor: colors.accent }]} /><AppText variant="display">Tủ đồ của bạn</AppText><AppText muted>Đang chuẩn bị phong cách riêng cho bạn...</AppText></View>;

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
          <Stack.Screen name="outfits" options={{ headerShown: true, title: 'Outfit', presentation: 'card' }} />
          <Stack.Screen name="shopping" options={{ headerShown: true, title: 'Mua sắm gợi ý', presentation: 'card' }} />
          <Stack.Screen name="payment/prepare" options={{ headerShown: true, title: 'Chuẩn bị thanh toán', presentation: 'card' }} />
        </Stack>
        <GuestAuthModal />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
const styles = StyleSheet.create({ splash: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }, dot: { width: 58, height: 58, borderRadius: 29, marginBottom: 8 } });
