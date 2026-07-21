import { Ionicons } from '@expo/vector-icons';
import { Image, type ImageProps } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

interface SafeImageProps extends ImageProps {
  fallbackLabel?: string;
}

export function SafeImage({ fallbackLabel = 'ẢNH MINH HỌA', onError, style, ...props }: SafeImageProps) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <View style={[style, styles.fallback, { backgroundColor: colors.background }]}>
        <Ionicons name="image-outline" size={34} color={colors.accent} />
        <AppText variant="caption" color={colors.accent}>{fallbackLabel}</AppText>
      </View>
    );
  }

  return <Image {...props} style={style} onError={(event) => { setFailed(true); onError?.(event); }} />;
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center', gap: 6 },
});
