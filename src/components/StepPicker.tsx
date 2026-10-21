import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing, touchTarget } from '@/theme';

interface Props {
  title: string;
  subtitle?: string;
  prevLabel: string;
  nextLabel: string;
  onPrev: () => void;
  onNext: () => void;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
}

/** Valor no centro com seta para voltar e avançar. Base dos seletores de dia e de mês. */
export function StepPicker({
  title,
  subtitle,
  prevLabel,
  nextLabel,
  onPrev,
  onNext,
  prevDisabled = false,
  nextDisabled = false,
}: Props) {
  return (
    <View style={styles.row}>
      <Arrow symbol="‹" label={prevLabel} disabled={prevDisabled} onPress={onPrev} />
      <View style={styles.center}>
        <Text selectable style={styles.title}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Arrow symbol="›" label={nextLabel} disabled={nextDisabled} onPress={onNext} />
    </View>
  );
}

function Arrow({
  symbol,
  label,
  disabled,
  onPress,
}: {
  symbol: string;
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      onPress={() => {
        if (!disabled) onPress();
      }}
      style={({ pressed }) => [styles.arrow, disabled && styles.arrowOff, pressed && !disabled && styles.pressed]}
    >
      <Text style={styles.arrowSymbol}>{symbol}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  arrow: {
    width: touchTarget + spacing.sm,
    height: touchTarget + spacing.sm,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowOff: { opacity: 0.35 },
  pressed: { opacity: 0.7 },
  arrowSymbol: { fontSize: fontSize.title + 10, color: colors.primary, lineHeight: fontSize.title + 12 },
  center: {
    flex: 1,
    minHeight: touchTarget + spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  title: { fontSize: fontSize.title, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] },
  subtitle: { fontSize: fontSize.small, color: colors.textMuted },
});
