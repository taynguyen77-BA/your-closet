import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { OutfitCard } from '@/components/outfit/OutfitCard';
import { AppText } from '@/components/ui/AppText';
import { DataState } from '@/components/ui/DataState';
import { GuestAccessCard } from '@/components/auth/GuestAccessCard';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/theme';

export default function OutfitsScreen() {
  const { filter } = useLocalSearchParams<{ filter?: string }>();
  const { spacing } = useTheme();
  const outfits = useAppStore((state) => state.outfits);
  const { isAuthenticated, isGuest } = useAuthStore();
  const isPublicViewer = isGuest || !isAuthenticated;
  const visible = filter === 'saved' ? outfits.filter((item) => item.isSaved) : outfits;
  if (isPublicViewer) {
    return (
      <Screen>
        <View style={{ marginBottom: spacing.md }}>
          <AppText variant="display">{filter === 'saved' ? 'Outfit đã lưu' : 'Lịch sử outfit'}</AppText>
        </View>
        <GuestAccessCard icon="albums-outline" title="Đăng nhập để xem outfit cá nhân" description="Outfit đã lưu và lịch sử phối đồ chỉ hiển thị khi bạn có tài khoản." />
      </Screen>
    );
  }
  return (
    <Screen>
      <View style={{ marginBottom: spacing.md }}>
        <AppText variant="display">{filter === 'saved' ? 'Outfit đã lưu' : 'Lịch sử outfit'}</AppText>
      </View>
      <DataState empty={visible.length === 0} emptyText="Chưa có outfit phù hợp." />
      {visible.map((item) => <OutfitCard key={item.id} outfit={item} />)}
    </Screen>
  );
}
