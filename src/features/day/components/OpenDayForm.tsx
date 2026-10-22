import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, MoneyInput, Text, type DateKey } from '@/features/shared';
import { openDaySchema } from '@/features/day/validators';
import { colors, fontSize, spacing } from '@/theme';

const OpenDayForm = ({
  date,
  onSubmit,
}: {
  date: DateKey;
  onSubmit: (values: { date: DateKey; openingCashCents: number }) => Promise<void>;
}) => {
  const [cents, setCents] = useState(0);
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
      setError('Não foi possível salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.intro}>
        <Text style={styles.title}>Lançar o dia</Text>
        <Text style={styles.description}>
          Lance o dia em 3 etapas: Caixa Inicial, compras e Caixa Final. A Venda Total e o Líquido são
          calculados automaticamente. Comece informando o Caixa Inicial.
        </Text>
      </View>
      <MoneyInput
        label="Caixa Inicial"
        valueCents={cents}
        onChangeCents={(next) => {
          setCents(next);
          setError(undefined);
        }}
        error={error}
      />
      <Button label="Continuar" onPress={submit} loading={saving} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  intro: { gap: spacing.xs },
  title: { fontSize: fontSize.title, fontWeight: '700', color: colors.primaryDark },
  description: { fontSize: fontSize.body, color: colors.textMuted },
});

export default OpenDayForm;
