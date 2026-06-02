import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, View } from 'react-native';
import { useTheme } from '@/theme';

export default function TabLayout() {
  const { colors, gradients } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: 'transparent',
          height: Platform.OS === 'ios' ? 92 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hôm nay',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="closet"
        options={{
          title: 'Tủ đồ',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shirt-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="try-on"
        options={{
          title: 'AI Stylist',
          tabBarIcon: ({ color, size }) => (
            <LinearGradient colors={gradients.ai} style={{ width: 52, height: 52, marginTop: -21, borderRadius: 26, alignItems: 'center', justifyContent: 'center', shadowColor: colors.ai, shadowOpacity: 0.34, shadowRadius: 10 }}>
              <Ionicons name="sparkles" size={size - 2} color={colors.textInverse} />
            </LinearGradient>
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Cộng đồng',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cá nhân',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="events" options={{ href: null }} />
    </Tabs>
  );
}
