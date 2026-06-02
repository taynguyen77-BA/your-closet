import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { OutfitCard } from '@/components/outfit/OutfitCard';
import { AppText } from '@/components/ui/AppText';
import { DataState } from '@/components/ui/DataState';
import { useAppStore } from '@/stores/appStore';
import { useTheme } from '@/theme';

export default function OutfitsScreen() {
  const { filter } = useLocalSearchParams<{ filter?: string }>();
  const { spacing } = useTheme();
  const outfits = useAppStore((state) => state.outfits);
  const visible = filter === 'saved' ? outfits.filter((item) => item.isSaved) : outfits;
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
