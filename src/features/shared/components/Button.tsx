import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import Text from './Text';
import { colors, fontSize, radius, spacing, touchTarget } from '@/theme';

const Button = ({
  label,
  onPress,
  variant = 'primary',
  loading = false,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'text';
  loading?: boolean;
}) => {
  const isPrimary = variant === 'primary';
  const textColor = isPrimary ? colors.onPrimary : colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: loading, busy: loading }}
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : variant === 'text' ? null : styles.secondary,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: touchTarget + spacing.xs,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.primary },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
  label: { fontSize: fontSize.body, fontWeight: '700', textAlign: 'center' },
});

export default Button;
