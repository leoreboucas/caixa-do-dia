import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import {
  Button,
  Card,
  MoneyInput,
  Text,
  addDays,
  formatDateKeyBR,
  todayKey,
  type DateKey,
} from '@/features/shared';
import { DatePicker } from '@/features/day/components';
import { openDaySchema } from '@/features/day/validators';
import { useDateParam } from '@/features/day/hooks';
import { getClosingByDate, openDay } from '@/features/day/services';
import { colors, fontSize, spacing } from '@/theme';

type Check = { status: 'checking' | 'exists' | 'free' };

const LaunchDayScreen = () => {
  const today = todayKey();
  const param = useDateParam();

  const [date, setDate] = useState<DateKey>(param === today ? addDays(today, -1) : param);
  const [check, setCheck] = useState<Check>({ status: 'checking' });
  const [cents, setCents] = useState(0);
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getClosingByDate(date)
      .then((existing) => {
        if (cancelled) return;
        setCheck({ status: existing ? 'exists' : 'free' });
      })
      .catch(() => {
        if (!cancelled) setError('Não foi possível verificar a data. Tente novamente.');
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
      router.replace({ pathname: '/day/[date]', params: { date } });
    } catch {
      setError('Não foi possível lançar o dia. Tente novamente.');
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
      <Text style={styles.description}>Selecione a data do dia a lançar.</Text>
      <DatePicker value={date} onChange={changeDate} max={today} />

      {check.status === 'exists' ? (
        <>
          <Card>
            <Text style={styles.hint}>O dia {formatDateKeyBR(date)} já foi lançado.</Text>
          </Card>
          <Button
            label="Abrir dia"
            onPress={() => router.replace({ pathname: '/day/[date]', params: { date } })}
          />
        </>
      ) : check.status === 'free' ? (
        <>
          <MoneyInput
            label="Caixa Inicial"
            valueCents={cents}
            onChangeCents={(next) => {
              setCents(next);
              setError(undefined);
            }}
          />
          {error ? (
            <Text selectable style={styles.error}>
              {error}
            </Text>
          ) : null}
          <Button label="Lançar dia" onPress={submit} loading={saving} />
        </>
      ) : error ? (
        <Text selectable style={styles.error}>
          {error}
        </Text>
      ) : null}
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

export default LaunchDayScreen;
