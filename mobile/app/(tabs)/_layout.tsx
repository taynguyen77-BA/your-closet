import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { useTheme } from '@/theme';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#C4B8AD',
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: 'transparent',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          position: 'absolute',
          height: Platform.OS === 'ios' ? 92 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 9, fontWeight: '500', letterSpacing: 0.5 },
        tabBarItemStyle: { borderRadius: 18 },
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
            <View style={{ width: 40, height: 40, marginTop: -13, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary }}>
              <Ionicons name="sparkles" size={size - 2} color={colors.accent} />
            </View>
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
