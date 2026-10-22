import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import {
  Button,
  Card,
  finalCashCents,
  formatBRL,
  isClosed,
  LoadingState,
  MoneyInput,
  StateMessage,
  Text,
} from '@/features/shared';
import { openDaySchema } from '@/features/day/validators';
import { useDateParam } from '@/features/day/hooks';
import { getClosingByDate, type ClosingWithItems, updateOpeningCash } from '@/features/day/services';
import { colors, fontSize, spacing } from '@/theme';

type Load =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; closing: ClosingWithItems | null };

const EditOpeningCashScreen = () => {
  const date = useDateParam();
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [cents, setCents] = useState(0);
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getClosingByDate(date)
      .then((closing) => {
        if (closing) setCents(closing.openingCashCents);
        setLoad({ status: 'ready', closing });
      })
      .catch((e: unknown) =>
        setLoad({ status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido' }),
      );
  }, [date]);

  if (load.status === 'loading') return <LoadingState />;
  if (load.status === 'error') {
    return <StateMessage title="Não foi possível abrir o dia" description={load.message} />;
  }
  const closing = load.closing;
  if (!closing) {
    return <StateMessage title="Dia não lançado" actionLabel="Voltar" onAction={() => router.back()} />;
  }

  const dayIsClosed = isClosed(closing.status);
  const finalCash = dayIsClosed
    ? finalCashCents(closing.openingCashCents, closing.grossSalesCents ?? 0)
    : null;

  async function submit() {
    if (!closing) return;
    const parsed = openDaySchema.safeParse({ date, openingCashCents: cents });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Valor inválido');
      return;
    }
    if (finalCash !== null && cents > finalCash) {
      setError(`O Caixa Inicial não pode ser maior que o Caixa Final (${formatBRL(finalCash)}).`);
      return;
    }
    setError(undefined);
    setSaving(true);
    try {
      await updateOpeningCash(closing.id, parsed.data.openingCashCents);
      router.back();
    } catch {
      setError('Não foi possível salvar. Tente novamente.');
      setSaving(false);
    }
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      style={styles.scroll}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.description}>Informe o valor com que o dia começou.</Text>
      <MoneyInput
        label="Caixa Inicial"
        valueCents={cents}
        onChangeCents={(next) => {
          setCents(next);
          setError(undefined);
        }}
        autoFocus
      />
      {finalCash !== null ? (
        <Card>
          <Text style={styles.hint}>
            O Caixa Final ({formatBRL(finalCash)}) não muda. A Venda Total é recalculada com o novo Caixa
            Inicial.
          </Text>
        </Card>
      ) : null}
      {error ? (
        <Text selectable style={styles.error}>
          {error}
        </Text>
      ) : null}
      <Button label="Salvar Caixa Inicial" onPress={submit} loading={saving} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
  description: { fontSize: fontSize.body, color: colors.textMuted },
  hint: { fontSize: fontSize.small, color: colors.textMuted, lineHeight: 20 },
  error: { fontSize: fontSize.small, color: colors.danger },
});

export default EditOpeningCashScreen;
