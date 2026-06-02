import { StyleSheet, TextInput } from 'react-native';
import { useTheme } from '@/theme';
export function AuthInput(props: React.ComponentProps<typeof TextInput>) {
  const { colors, radius } = useTheme();
  return <TextInput placeholderTextColor={colors.textMuted} {...props} style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }, props.style]} />;
}
const styles = StyleSheet.create({ input: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 10 } });
