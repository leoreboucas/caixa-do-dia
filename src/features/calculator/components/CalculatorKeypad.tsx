import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/features/shared';
import { colors, fontSize, radius, spacing } from '@/theme';

interface CalculatorKeypadProps {
  onDigit: (digit: string) => void;
  onDecimal: () => void;
  onOperator: (operator: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onEquals: () => void;
}

type KeyKind = 'digit' | 'operator' | 'action' | 'equals';

const Key = ({
  label,
  accessibilityLabel,
  kind,
  onPress,
  grow = 1,
}: {
  label: string;
  accessibilityLabel: string;
  kind: KeyKind;
  onPress: () => void;
  grow?: number;
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    onPress={onPress}
    style={({ pressed }) => [styles.key, styles[kind], { flexGrow: grow }, pressed && styles.pressed]}
  >
    <Text
      style={[
        styles.label,
        kind === 'equals' && styles.labelEquals,
        kind === 'operator' && styles.labelOperator,
      ]}
    >
      {label}
    </Text>
  </Pressable>
);

const CalculatorKeypad = ({
  onDigit,
  onDecimal,
  onOperator,
  onBackspace,
  onClear,
  onEquals,
}: CalculatorKeypadProps) => {
  const digit = (value: string) => (
    <Key key={value} label={value} accessibilityLabel={value} kind="digit" onPress={() => onDigit(value)} />
  );
  const operator = (value: string, name: string) => (
    <Key
      key={value}
      label={value}
      accessibilityLabel={name}
      kind="operator"
      onPress={() => onOperator(value)}
    />
  );

  return (
    <View style={styles.pad}>
      <View style={styles.row}>
        <Key label="C" accessibilityLabel="Limpar" kind="action" grow={3} onPress={onClear} />
        <Key label="⌫" accessibilityLabel="Apagar" kind="action" onPress={onBackspace} />
      </View>
      <View style={styles.row}>
        {['7', '8', '9'].map(digit)}
        {operator('÷', 'Dividir')}
      </View>
      <View style={styles.row}>
        {['4', '5', '6'].map(digit)}
        {operator('×', 'Multiplicar')}
      </View>
      <View style={styles.row}>
        {['1', '2', '3'].map(digit)}
        {operator('−', 'Subtrair')}
      </View>
      <View style={styles.row}>
        {digit('0')}
        <Key label="," accessibilityLabel="Vírgula" kind="digit" onPress={onDecimal} />
        <Key label="=" accessibilityLabel="Calcular" kind="equals" onPress={onEquals} />
        {operator('+', 'Somar')}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pad: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  key: {
    flexBasis: 0,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: 1,
  },
  digit: { backgroundColor: colors.surface, borderColor: colors.border },
  operator: { backgroundColor: colors.accentSoft, borderColor: colors.accentSoft },
  action: { backgroundColor: colors.surface, borderColor: colors.border },
  equals: { backgroundColor: colors.primary, borderColor: colors.primary },
  pressed: { opacity: 0.7 },
  label: { fontSize: fontSize.title + 4, fontWeight: '600', color: colors.text },
  labelOperator: { color: colors.primaryDark, fontWeight: '800' },
  labelEquals: { color: colors.onPrimary, fontWeight: '800' },
});

export default CalculatorKeypad;
