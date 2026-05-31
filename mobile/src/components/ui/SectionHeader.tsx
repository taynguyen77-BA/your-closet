import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  const { spacing } = useTheme();

  return (
    <View style={[styles.row, { marginBottom: spacing.md }]}>
      <AppText variant="h2">{title}</AppText>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction}>
          <AppText variant="label" color="#9B7A8A">
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
