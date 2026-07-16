import { Ionicons } from '@expo/vector-icons';
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
  pill = false,
}: ButtonProps) {
  const { colors, rounded } = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  // Button styling per DESIGN.md ("Components"): primary is Espresso on White,
  // secondary is a bare Espresso outline, accent is Sand carrying Espresso text.
  // ai/community keep their category colours, which DESIGN.md does not cover.
  const bg =
    variant === 'primary'
      ? colors.primary
      : variant === 'accent'
        ? colors.sand
        : variant === 'ai' || variant === 'community'
          ? variant === 'ai' ? colors.ai : colors.community
          : 'transparent';

  const textColor =
    variant === 'primary' || variant === 'ai' || variant === 'community'
      ? colors.textInverse
      : colors.text;

  const borderColor =
    variant === 'secondary'
      ? colors.primary
      : variant === 'ghost'
        ? colors.border
        : 'transparent';

  const content = <>
    {icon ? <Ionicons name={icon} size={small ? 16 : 18} color={textColor} style={styles.icon} /> : null}
    <AppText variant="label" style={{ color: textColor, fontSize: small ? 13 : 14 }}>{label}</AppText>
  </>;
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
          borderRadius: pill ? rounded.full : rounded.DEFAULT,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          paddingVertical: small ? 8 : 12,
          paddingHorizontal: small ? 12 : 16,
          borderWidth: variant === 'secondary' || variant === 'ghost' ? 1 : 0,
          borderColor,
        },
      ]}
    >
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
    minHeight: 42,
  },
  icon: { marginRight: 6 },
});
