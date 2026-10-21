import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { MoneyInput } from '@/components/MoneyInput';
import { LoadingState, StateMessage } from '@/components/StateMessage';
import { summarizeClosing } from '@/domain/closing';
import { formatBRL } from '@/domain/money';
import { closeDaySchema } from '@/domain/validation';
import { useDateParam } from '@/hooks/useDay';
import { closeDay, getClosingByDate, updateOpeningCash, type ClosingWithItems } from '@/repositories/closings';
import { colors, fontSize, radius, spacing, touchTarget } from '@/theme';

type Load = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; closing: ClosingWithItems | null };

/** Informa a venda total e fecha o dia. Também serve para corrigir um dia já fechado. */
export default function FecharDiaScreen() {
  const date = useDateParam();
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [opening, setOpening] = useState(0);
  const [gross, setGross] = useState(0);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getClosingByDate(date)
      .then((closing) => {
        if (closing) setOpening(closing.openingCashCents);
        if (closing?.status === 'closed') {
          setGross(closing.grossSalesCents ?? 0);
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
    return <StateMessage title="Não deu para abrir o dia" description={load.message} />;
  }
  const closing = load.closing;
  if (!closing) {
    return (
      <StateMessage
        title="Abra o dia primeiro"
        description="Informe o caixa inicial na tela Hoje antes de fechar."
        actionLabel="Voltar"
        onAction={() => router.back()}
      />
    );
  }

  const summary = summarizeClosing({
    openingCashCents: opening,
    grossSalesCents: gross,
    items: closing.items,
  });
  const isEditing = closing.status === 'closed';

  async function submit() {
    if (!closing) return;
    const parsed = closeDaySchema.safeParse({ grossSalesCents: gross, note: note.trim() === '' ? null : note });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Confira os valores');
      return;
    }
    setError(undefined);
    setSaving(true);
    try {
      if (opening !== closing.openingCashCents) await updateOpeningCash(closing.id, opening);
      await closeDay(closing.id, parsed.data);
      router.back();
    } catch {
      // Mantém o que foi digitado para tentar de novo
      setError('Não deu para salvar. O que você digitou continua aqui; tente de novo.');
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
        Confira o dinheiro com que você começou, informe o total que vendeu e veja quanto sobrou.
      </Text>
      <MoneyInput label="Caixa inicial" valueCents={opening} onChangeCents={setOpening} />
      <MoneyInput label="Venda total (bruto)" valueCents={gross} onChangeCents={setGross} autoFocus />

      <Card>
        <Row label="Despesas" value={formatBRL(summary.expensesCents)} />
        <Row label="Líquido" value={formatBRL(summary.netCents)} strong />
        <Row label="Caixa final" value={formatBRL(summary.finalCashCents)} />
        {summary.netCents < 0 ? (
          <Text style={styles.hint}>As compras passaram da venda neste dia.</Text>
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
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={strong ? styles.rowLabelStrong : styles.rowLabel}>{label}</Text>
      <Text selectable style={strong ? styles.rowValueStrong : styles.rowValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
  description: { fontSize: fontSize.body, color: colors.textMuted },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: fontSize.body, color: colors.textMuted },
  rowValue: { fontSize: fontSize.body, color: colors.text, fontVariant: ['tabular-nums'] },
  rowLabelStrong: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  rowValueStrong: { fontSize: fontSize.title, fontWeight: '800', color: colors.primaryDark, fontVariant: ['tabular-nums'] },
  hint: { fontSize: fontSize.small, color: colors.textMuted },
  noteField: { gap: spacing.xs },
  label: { fontSize: fontSize.small, color: colors.textMuted },
  noteInput: {
    minHeight: touchTarget,
    borderWidth: 1,
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
