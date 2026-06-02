import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

type Variant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'ai' | 'community';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  style?: ViewStyle;
  small?: boolean;
  pill?: boolean;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  style,
  small,
  pill = true,
}: ButtonProps) {
  const { colors, gradients, radius } = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const bg =
    variant === 'primary'
      ? 'transparent'
      : variant === 'accent'
        ? colors.accent
        : variant === 'ai' || variant === 'community'
          ? 'transparent'
          : variant === 'secondary'
          ? colors.beige
          : 'transparent';

  const textColor =
    variant === 'primary' || variant === 'accent' || variant === 'ai' || variant === 'community'
      ? colors.textInverse
      : colors.text;

  const content = <>
    {icon ? <Ionicons name={icon} size={small ? 16 : 18} color={textColor} style={styles.icon} /> : null}
    <AppText variant="label" style={{ color: textColor, fontSize: small ? 13 : 14 }}>{label}</AppText>
  </>;
  const gradient = variant === 'ai' ? gradients.ai : variant === 'community' ? gradients.community : gradients.primary;
  return (
    <Animated.View style={[style, animatedStyle]}>
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => { scale.value = withSpring(0.97); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg,
          borderRadius: pill ? radius.full : radius.md,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          paddingVertical: small ? 8 : 12,
          paddingHorizontal: small ? 12 : 16,
          borderWidth: variant === 'ghost' ? 1 : 0,
          borderColor: colors.border,
        },
      ]}
    >
      {variant === 'primary' || variant === 'ai' || variant === 'community'
        ? <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: pill ? radius.full : radius.md }]} />
        : null}
      {content}
    </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { marginRight: 6 },
});
