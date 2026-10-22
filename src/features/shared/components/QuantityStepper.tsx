import { Pressable, StyleSheet, View } from 'react-native';
import Text from './Text';
import TextInput from './TextInput';
import { colors, fontSize, maxHeroFontScale, radius, spacing, touchTarget } from '@/theme';

const QuantityStepper = ({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (value: string) => void;
}) => {
  const quantity = Number.parseInt(value, 10) || 0;
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Diminuir quantidade"
        onPress={() => onChangeText(String(Math.max(1, quantity - 1)))}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Text style={styles.symbol}>−</Text>
      </Pressable>
      <TextInput
        value={value}
        onChangeText={(text) => onChangeText(text.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        inputMode="numeric"
        selectTextOnFocus
        maxFontSizeMultiplier={maxHeroFontScale}
        style={styles.input}
        accessibilityLabel="Quantidade"
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Aumentar quantidade"
        onPress={() => onChangeText(String(quantity + 1))}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Text style={styles.symbol}>+</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  button: {
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
  pressed: { opacity: 0.7 },
  symbol: { fontSize: fontSize.title + 6, fontWeight: '600', color: colors.primary },
  input: {
    flex: 1,
    minHeight: touchTarget + spacing.sm,
    textAlign: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    fontSize: fontSize.title + 6,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
});

export default QuantityStepper;
