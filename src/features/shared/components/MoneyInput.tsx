import { StyleSheet, View } from 'react-native';
import Text from './Text';
import TextInput from './TextInput';
import { centsFromDigits, formatBRL } from '@/features/shared/utils';
import { colors, fontSize, maxHeroFontScale, radius, spacing, touchTarget } from '@/theme';

interface MoneyInputProps {
  label?: string;
  valueCents: number;
  onChangeCents: (cents: number) => void;
  error?: string;
  autoFocus?: boolean;
}

const MoneyInput = ({ label, valueCents, onChangeCents, error, autoFocus }: MoneyInputProps) => {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        value={formatBRL(valueCents)}
        onChangeText={(text) => onChangeCents(centsFromDigits(text))}
        keyboardType="number-pad"
        inputMode="numeric"
        selectTextOnFocus
        maxFontSizeMultiplier={maxHeroFontScale}
        autoFocus={autoFocus}
        style={[styles.input, error ? styles.inputError : null]}
        accessibilityLabel={label}
      />
      {error ? (
        <Text selectable style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  label: { fontSize: fontSize.small, fontWeight: '600', color: colors.textMuted },
  input: {
    minHeight: touchTarget + spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.title + 6,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  inputError: { borderColor: colors.danger },
  error: { fontSize: fontSize.small, color: colors.danger },
});

export default MoneyInput;
