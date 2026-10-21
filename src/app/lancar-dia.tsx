import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { DatePicker } from '@/components/DatePicker';
import { MoneyInput } from '@/components/MoneyInput';
import { addDays, formatDateKeyBR, todayKey, type DateKey } from '@/domain/date';
import { formatBRL } from '@/domain/money';
import { openDaySchema } from '@/domain/validation';
import { useDateParam } from '@/hooks/useDay';
import { getClosingByDate, getSuggestedOpeningCash, openDay } from '@/repositories/closings';
import { colors, fontSize, spacing } from '@/theme';

type Check = { status: 'checking' } | { status: 'exists' } | { status: 'free'; suggestedCents: number | null };

/** Lança um dia esquecido: escolhe a data, informa o caixa inicial e segue para o dia, onde registra compras e venda. */
export default function LancarDiaScreen() {
  const today = todayKey();
  const param = useDateParam();
  // Sem data na rota, `useDateParam` devolve hoje; para esquecidos o mais comum é ontem.
  const [date, setDate] = useState<DateKey>(param === today ? addDays(today, -1) : param);
  const [check, setCheck] = useState<Check>({ status: 'checking' });
  const [cents, setCents] = useState(0);
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getClosingByDate(date), getSuggestedOpeningCash(date)])
      .then(([existing, suggested]) => {
        if (cancelled) return;
        if (existing) {
          setCheck({ status: 'exists' });
        } else {
          setCheck({ status: 'free', suggestedCents: suggested });
          setCents(suggested ?? 0);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Não deu para verificar essa data. Tente de novo.');
      });
    return () => {
      cancelled = true;
    };
  }, [date]);

  function changeDate(next: DateKey) {
    setCheck({ status: 'checking' });
    setError(undefined);
    setDate(next);
  }

  async function submit() {
    const parsed = openDaySchema.safeParse({ date, openingCashCents: cents });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Valor inválido');
      return;
    }
    setError(undefined);
    setSaving(true);
    try {
      await openDay(parsed.data);
      router.replace({ pathname: '/dia/[date]', params: { date } });
    } catch {
      setError('Não deu para lançar o dia. Tente de novo.');
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
      <Text style={styles.description}>Esqueceu de lançar um dia? Escolha a data dele.</Text>
      <DatePicker value={date} onChange={changeDate} max={today} />

      {check.status === 'exists' ? (
        <>
          <Card>
            <Text style={styles.hint}>O dia {formatDateKeyBR(date)} já foi lançado. Abra para ver ou editar.</Text>
          </Card>
          <Button label="Ver esse dia" onPress={() => router.replace({ pathname: '/dia/[date]', params: { date } })} />
        </>
      ) : check.status === 'free' ? (
        <>
          <MoneyInput
            label="Caixa inicial desse dia"
            valueCents={cents}
            onChangeCents={(next) => {
              setCents(next);
              setError(undefined);
            }}
          />
          {check.suggestedCents !== null ? (
            <Text style={styles.hint}>
              Sugerido: {formatBRL(check.suggestedCents)}, o caixa final do dia fechado anterior.
            </Text>
          ) : null}
          {error ? (
            <Text selectable style={styles.error}>
              {error}
            </Text>
          ) : null}
          <Button label="Lançar esse dia" onPress={submit} loading={saving} />
        </>
      ) : error ? (
        <Text selectable style={styles.error}>
          {error}
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
  description: { fontSize: fontSize.body, color: colors.textMuted },
  hint: { fontSize: fontSize.small, color: colors.textMuted, lineHeight: 20 },
  error: { fontSize: fontSize.small, color: colors.danger },
});
