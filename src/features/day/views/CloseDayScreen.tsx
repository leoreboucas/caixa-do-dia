import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  finalCashCents,
  formatBRL,
  grossFromFinalCashCents,
  isClosed,
  LoadingState,
  MoneyInput,
  StateMessage,
  summarizeClosing,
  Text,
  TextInput,
} from '@/features/shared';
import { closeDaySchema } from '@/features/day/validators';
import { useDateParam } from '@/features/day/hooks';
import { closeDay, getClosingByDate, type ClosingWithItems } from '@/features/day/services';
import { colors, fontSize, radius, spacing, touchTarget } from '@/theme';

type Load =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; closing: ClosingWithItems | null };

const CloseDayScreen = () => {
  const date = useDateParam();
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [finalCash, setFinalCash] = useState(0);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getClosingByDate(date)
      .then((closing) => {
        if (closing && isClosed(closing.status)) {
          setFinalCash(finalCashCents(closing.openingCashCents, closing.grossSalesCents ?? 0));
          setNote(closing.note ?? '');
        }
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
    return (
      <StateMessage
        title="Dia não aberto"
        description="Informe o Caixa Inicial na tela Hoje antes de fechar."
        actionLabel="Voltar"
        onAction={() => router.back()}
      />
    );
  }

  const opening = closing.openingCashCents;
  const gross = grossFromFinalCashCents(finalCash, opening);
  const belowOpening = gross < 0;
  const summary = summarizeClosing({
    openingCashCents: opening,
    grossSalesCents: Math.max(gross, 0),
    items: closing.items,
  });
  const isEditing = isClosed(closing.status);

  async function submit() {
    if (!closing) return;
    if (belowOpening) {
      setError(`O Caixa Final não pode ser menor que o Caixa Inicial (${formatBRL(opening)}).`);
      return;
    }
    const parsed = closeDaySchema.safeParse({
      grossSalesCents: gross,
      note: note.trim() === '' ? null : note,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Confira os valores');
      return;
    }
    setError(undefined);
    setSaving(true);
    try {
      await closeDay(closing.id, parsed.data);
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
      <Text style={styles.description}>
        Informe o dinheiro contado no caixa. A Venda Total e o Líquido são calculados automaticamente.
      </Text>
      <MoneyInput
        label="Caixa Final"
        valueCents={finalCash}
        onChangeCents={(next) => {
          setFinalCash(next);
          setError(undefined);
        }}
        autoFocus
      />

      <Card>
        <Row label="Caixa Final" value={formatBRL(finalCash)} />
        <Row label="Caixa Inicial" value={`− ${formatBRL(opening)}`} />
        <View style={styles.divider} />
        <Row label="Venda Total (Bruto)" value={belowOpening ? '—' : formatBRL(summary.grossCents)} strong />
        <Row label="Despesas" value={`− ${formatBRL(summary.expensesCents)}`} />
        <View style={styles.divider} />
        <Row label="Líquido" value={belowOpening ? '—' : formatBRL(summary.netCents)} strong big />
        {belowOpening ? (
          <Text style={styles.hint}>
            Caixa Final menor que o Caixa Inicial ({formatBRL(opening)}). Confira o valor informado.
          </Text>
        ) : summary.netCents < 0 ? (
          <Text style={styles.hint}>Despesas maiores que a venda neste dia.</Text>
        ) : null}
      </Card>

      <View style={styles.noteField}>
        <Text style={styles.label}>Observação (opcional)</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Choveu à tarde"
          placeholderTextColor={colors.textMuted}
          maxLength={200}
          style={styles.noteInput}
          accessibilityLabel="Observação"
        />
      </View>

      {error ? (
        <Text selectable style={styles.error}>
          {error}
        </Text>
      ) : null}
      <Button label={isEditing ? 'Salvar alterações' : 'Fechar o dia'} onPress={submit} loading={saving} />
    </ScrollView>
  );
};

function Row({
  label,
  value,
  strong = false,
  big = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
  big?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={strong ? styles.rowLabelStrong : styles.rowLabel}>{label}</Text>
      <Text selectable style={[strong ? styles.rowValueStrong : styles.rowValue, big && styles.rowValueBig]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
  description: { fontSize: fontSize.body, color: colors.textMuted },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.xs,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  rowLabel: { fontSize: fontSize.body, color: colors.textMuted },
  rowValue: { fontSize: fontSize.body, color: colors.text, fontVariant: ['tabular-nums'] },
  rowLabelStrong: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  rowValueStrong: {
    fontSize: fontSize.body,
    fontWeight: '800',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  rowValueBig: { fontSize: fontSize.title, color: colors.primaryDark },
  hint: { fontSize: fontSize.small, color: colors.textMuted },
  noteField: { gap: spacing.xs },
  label: { fontSize: fontSize.small, fontWeight: '600', color: colors.textMuted },
  noteInput: {
    minHeight: touchTarget,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.body,
    color: colors.text,
  },
  error: { fontSize: fontSize.small, color: colors.danger },
});

export default CloseDayScreen;
