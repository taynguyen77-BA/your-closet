import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { GlassCard } from '@/components/ui/GlassCard';
import { AppText } from '@/components/ui/AppText';
import type { WeatherInfo } from '@/models';
import { useTheme } from '@/theme';

interface WeatherWidgetProps {
  weather: WeatherInfo;
}

export function WeatherWidget({ weather }: WeatherWidgetProps) {
  const { colors } = useTheme();

  return (
    <GlassCard style={styles.card}>
      <View style={styles.row}>
        <View>
          <AppText variant="caption" muted>
            {weather.location}
          </AppText>
          <AppText variant="display">{weather.temperature}°</AppText>
          <AppText variant="bodySmall" muted>
            {weather.condition}
            {weather.humidity ? ` · Độ ẩm ${weather.humidity}%` : ''}
          </AppText>
        </View>
        <View style={[styles.iconWrap, { backgroundColor: colors.pink }]}>
          <Ionicons name="sunny" size={32} color={colors.accentDark} />
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
