import { Text, TextProps, TextStyle } from 'react-native';
import { useTheme } from '@/theme';

type Variant = 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'bodySmall' | 'caption' | 'label';

interface AppTextProps extends TextProps {
  variant?: Variant;
  muted?: boolean;
  color?: string;
}

export function AppText({
  variant = 'body',
  muted,
  color,
  style,
  ...props
}: AppTextProps) {
  const { colors, typography } = useTheme();
  const textColor = color ?? (muted ? colors.textMuted : colors.text);

  return (
    <Text
      style={[typography[variant] as TextStyle, { color: textColor }, style]}
      {...props}
    />
  );
}
