import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

type Variant = 'primary' | 'secondary' | 'ghost' | 'accent';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  style?: ViewStyle;
  small?: boolean;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  style,
  small,
}: ButtonProps) {
  const { colors, radius } = useTheme();

  const bg =
    variant === 'primary'
      ? colors.primary
      : variant === 'accent'
        ? colors.accent
        : variant === 'secondary'
          ? colors.beige
          : 'transparent';

  const textColor =
    variant === 'primary' || variant === 'accent'
      ? colors.textInverse
      : colors.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg,
          borderRadius: radius.md,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          paddingVertical: small ? 8 : 12,
          paddingHorizontal: small ? 12 : 16,
          borderWidth: variant === 'ghost' ? 1 : 0,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {icon ? (
        <Ionicons name={icon} size={small ? 16 : 18} color={textColor} style={styles.icon} />
      ) : null}
      <AppText variant="label" style={{ color: textColor, fontSize: small ? 13 : 14 }}>
        {label}
      </AppText>
    </Pressable>
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
