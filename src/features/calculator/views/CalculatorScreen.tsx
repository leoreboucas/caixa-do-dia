import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { CalculationHistory, CalculatorKeypad } from '@/features/calculator/components';
import { useCalculator } from '@/features/calculator/hooks';
import { setFinalCash, useDateParam } from '@/features/day';
import { Button, Card, Text, formatBRL, formatDateKeyBR } from '@/features/shared';
import { colors, fontSize, spacing } from '@/theme';

const CONFIRM_CLEAR_AFTER = 3;

const CalculatorScreen = () => {
  const date = useDateParam();
  const calculator = useCalculator(date);
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const clearErrorThen =
    <Args extends unknown[]>(action: (...args: Args) => void) =>
    (...args: Args) => {
      setError(undefined);
      action(...args);
    };

  const confirmClear = () => {
    if (calculator.entries.length <= CONFIRM_CLEAR_AFTER) {
      calculator.pressClear();
      return;
    }
    Alert.alert('Limpar a conta?', 'Todos os lançamentos digitados serão apagados.', [
      { text: 'Voltar', style: 'cancel' },
      { text: 'Limpar', style: 'destructive', onPress: calculator.pressClear },
    ]);
  };

  const confirm = async () => {
    if (calculator.result === null) {
      setError('Conclua a conta para usar o resultado.');
      return;
    }
    setError(undefined);
    setSaving(true);
    try {
      await setFinalCash(date, calculator.result);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar. Tente novamente.');
      setSaving(false);
    }
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.scroll}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.caption}>Caixa Final de {formatDateKeyBR(date)}</Text>

      <Card>
        <View style={styles.display}>
          <CalculationHistory
            entries={calculator.entries}
            cursor={calculator.cursor}
            field={calculator.field}
            onSelectNumber={clearErrorThen((index: number) => calculator.selectEntry(index, 'value'))}
            onSelectOperator={clearErrorThen((index: number) => calculator.selectEntry(index, 'operator'))}
          />
          <Text selectable adjustsFontSizeToFit numberOfLines={1} style={styles.result}>
            {calculator.result === null ? '—' : formatBRL(calculator.result)}
          </Text>
        </View>
      </Card>

      <CalculatorKeypad
        onDigit={clearErrorThen(calculator.pressDigit)}
        onDecimal={clearErrorThen(calculator.pressDecimal)}
        onOperator={clearErrorThen(calculator.pressOperator)}
        onBackspace={clearErrorThen(calculator.pressBackspace)}
        onClear={clearErrorThen(confirmClear)}
        onEquals={clearErrorThen(calculator.pressEquals)}
      />

      {error ? (
        <Text selectable style={styles.error}>
          {error}
        </Text>
      ) : null}
      <Button label="Confirmar" onPress={confirm} loading={saving} />
      <Text style={styles.hint}>O resultado será definido como o Caixa Final deste dia.</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
  caption: { fontSize: fontSize.small, fontWeight: '600', color: colors.textMuted },
  display: { alignItems: 'flex-end', gap: spacing.xs, minHeight: 96, justifyContent: 'center' },

  result: {
    fontSize: fontSize.hero,
    fontWeight: '800',
    color: colors.primaryDark,
    fontVariant: ['tabular-nums'],
  },
  error: { fontSize: fontSize.small, color: colors.danger },
  hint: { fontSize: fontSize.caption, color: colors.textMuted, textAlign: 'center' },
});

export default CalculatorScreen;
