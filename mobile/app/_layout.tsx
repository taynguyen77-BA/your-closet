import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { useAppStore } from '@/stores/appStore';

export default function RootLayout() {
  const scheme = useColorScheme();
  const initialize = useAppStore((state) => state.initialize);
  useEffect(() => { void initialize(); }, [initialize]);

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
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
