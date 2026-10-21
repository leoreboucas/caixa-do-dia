import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { MoneyInput } from '@/components/MoneyInput';
import { formatBRL } from '@/domain/money';
import type { DateKey } from '@/domain/date';
import { openDaySchema } from '@/domain/validation';
import { colors, fontSize, spacing } from '@/theme';

interface Props {
  date: DateKey;
  suggestedCents: number | null;
  onSubmit: (values: { date: DateKey; openingCashCents: number }) => Promise<void>;
}

/** Estado "dia ainda não aberto": pede o caixa inicial, já sugerindo o caixa final do último dia fechado. */
export function OpenDayForm({ date, suggestedCents, onSubmit }: Props) {
  const [cents, setCents] = useState(suggestedCents ?? 0);
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  async function submit() {
    const parsed = openDaySchema.safeParse({ date, openingCashCents: cents });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Valor inválido');
      return;
    }
    setError(undefined);
    setSaving(true);
    try {
      await onSubmit(parsed.data);
    } catch {
      setError('Não deu para salvar. O valor continua aqui; tente de novo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.intro}>
        <Text style={styles.title}>Lançar o dia de hoje</Text>
        <Text style={styles.description}>
          Faça tudo no fim do dia, em 3 passos: caixa inicial, compras e venda total. Comece pelo dinheiro com que você
          começou o dia.
        </Text>
      </View>
      <MoneyInput
        label="Caixa inicial"
        valueCents={cents}
        onChangeCents={(next) => {
          setCents(next);
          setError(undefined);
        }}
        error={error}
      />
      {suggestedCents !== null ? (
        <Card>
          <Text style={styles.hint}>
            Sugestão: {formatBRL(suggestedCents)}, o caixa final do último dia fechado. Se o valor de hoje foi outro,
            toque no campo e digite o correto.
          </Text>
        </Card>
      ) : (
        <Card>
          <Text style={styles.hint}>Primeiro dia por aqui. Digite quanto dinheiro você tinha ao começar o dia.</Text>
        </Card>
      )}
      <Button label="Continuar" onPress={submit} loading={saving} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  intro: { gap: spacing.xs },
  title: { fontSize: fontSize.title, fontWeight: '700', color: colors.primaryDark },
  description: { fontSize: fontSize.body, color: colors.textMuted },
  hint: { fontSize: fontSize.small, color: colors.textMuted, lineHeight: 20 },
});
