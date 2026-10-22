import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import Text from './Text';
import { colors, fontSize, radius, spacing, touchTarget } from '@/theme';

interface StepPickerProps {
  title: string;
  subtitle?: string;
  prevLabel: string;
  nextLabel: string;
  onPrev: () => void;
  onNext: () => void;
  prevDisabled?: boolean;
  nextDisabled?: boolean;

  onPressCenter?: () => void;
  centerHint?: string;
}

const StepPicker = ({
  title,
  subtitle,
  prevLabel,
  nextLabel,
  onPrev,
  onNext,
  prevDisabled = false,
  nextDisabled = false,
  onPressCenter,
  centerHint,
}: StepPickerProps) => {
  return (
    <View style={styles.row}>
      <Arrow symbol="‹" label={prevLabel} disabled={prevDisabled} onPress={onPrev} />
      <Pressable
        accessibilityRole={onPressCenter ? 'button' : undefined}
        accessibilityLabel={onPressCenter ? `${title}. ${centerHint ?? ''}` : undefined}
        disabled={!onPressCenter}
        onPress={onPressCenter}
        style={({ pressed }) => [styles.center, pressed && styles.pressed]}
      >
        <View style={styles.titleRow}>
          {onPressCenter ? <Ionicons name="calendar-outline" size={20} color={colors.primary} /> : null}
          <Text selectable={!onPressCenter} style={styles.title}>
            {title}
          </Text>
        </View>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </Pressable>
      <Arrow symbol="›" label={nextLabel} disabled={nextDisabled} onPress={onNext} />
    </View>
  );
};

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
      style={({ pressed }) => [
        styles.arrow,
        disabled && styles.arrowOff,
        pressed && !disabled && styles.pressed,
      ]}
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
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  arrowOff: { opacity: 0.35 },
  pressed: { opacity: 0.7 },
  arrowSymbol: { fontSize: fontSize.title + 10, color: colors.primary, lineHeight: fontSize.title + 12 },
  center: {
    flex: 1,
    minHeight: touchTarget + spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: '800',
    color: colors.text,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  subtitle: { fontSize: fontSize.small, color: colors.textMuted },
});

export default StepPicker;
