import { StyleSheet, TextInput } from 'react-native';
import { useTheme } from '@/theme';
export function AuthInput(props: React.ComponentProps<typeof TextInput>) {
  const { colors, rounded, fontFamily } = useTheme();
  return <TextInput placeholderTextColor={colors.textMuted} {...props} style={[styles.input, { color: colors.text, fontFamily: fontFamily.regular, backgroundColor: colors.surface, borderColor: colors.sand, borderRadius: rounded.DEFAULT }, props.style]} />;
}
const styles = StyleSheet.create({ input: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 10 } });
