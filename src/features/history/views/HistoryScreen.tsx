import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  addDays,
  Button,
  Card,
  ClosingStatus,
  formatBRL,
  formatDateKeyBR,
  isClosed,
  LoadingState,
  type PeriodTotals,
  startOfMonthKey,
  startOfWeekKey,
  StateMessage,
  summarizeClosing,
  sumSummaries,
  Text,
  todayKey,
  useLargeText,
  weekdayNameBR,
} from '@/features/shared';
import { listClosingsBetween, type ClosingWithItems } from '@/features/day';
import { colors, fontSize, radius, spacing, touchTarget } from '@/theme';

const WINDOW_DAYS = 90;

type Load =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; closings: ClosingWithItems[]; week: PeriodTotals; month: PeriodTotals };

function totalsSince(closings: ClosingWithItems[], from: string): PeriodTotals {
  return sumSummaries(closings.filter((c) => isClosed(c.status) && c.date >= from).map(summarizeClosing));
}

const HistoryScreen = () => {
  const largeText = useLargeText();
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const hasData = useRef(false);

  const refresh = useCallback(() => {
    const today = todayKey();
    listClosingsBetween(addDays(today, -(WINDOW_DAYS - 1)), today)
      .then((closings) => {
        hasData.current = true;
        setLoad({
          status: 'ready',
          closings,
          week: totalsSince(closings, startOfWeekKey(today)),
          month: totalsSince(closings, startOfMonthKey(today)),
        });
      })
      .catch((e: unknown) => {
        if (hasData.current) return;
        setLoad({ status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido' });
      });
  }, []);

  useFocusEffect(refresh);

  if (load.status === 'loading') return <LoadingState />;
  if (load.status === 'error') {
    return (
      <StateMessage
        title="Não foi possível carregar o histórico"
        description={load.message}
        actionLabel="Tentar novamente"
        onAction={() => {
          setLoad({ status: 'loading' });
          refresh();
        }}
      />
    );
  }

  const { closings, week, month } = load;
  if (closings.length === 0) {
    return (
      <StateMessage
        title="Histórico vazio"
        description="Os dias fechados aparecem aqui, com Bruto, Despesas e Líquido. Para registrar um dia anterior, use Lançar dia esquecido."
        actionLabel="Lançar dia esquecido"
        onAction={() => router.push('/launch-day')}
      />
    );
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.scroll}
      contentContainerStyle={styles.content}
    >
      <View style={[styles.periods, largeText && styles.periodsStacked]}>
        <PeriodCard label="Esta semana" totals={week} />
        <PeriodCard label="Este mês" totals={month} />
      </View>

      <Text style={styles.sectionTitle}>Dias anteriores</Text>
      <Card flush>
        {closings.map((closing, index) => {
          const summary = summarizeClosing(closing);
          const isOpen = closing.status === ClosingStatus.OPEN;
          return (
            <Pressable
              key={closing.id}
              accessibilityRole="button"
              accessibilityHint="Toque para ver o dia"
              onPress={() => router.push({ pathname: '/day/[date]', params: { date: closing.date } })}
              style={({ pressed }) => [styles.row, index > 0 && styles.divider, pressed && styles.pressed]}
            >
              <View style={styles.rowText}>
                <Text selectable style={styles.day}>
                  {weekdayNameBR(closing.date)}, {formatDateKeyBR(closing.date).slice(0, 5)}
                </Text>
                <Text selectable style={styles.detail}>
                  {isOpen
                    ? `Em aberto · Despesas ${formatBRL(summary.expensesCents)}`
                    : `Bruto ${formatBRL(summary.grossCents)} · Despesas ${formatBRL(summary.expensesCents)}`}
                </Text>
              </View>
              <Text selectable style={styles.net}>
                {isOpen ? 'Em aberto' : formatBRL(summary.netCents)}
              </Text>
            </Pressable>
          );
        })}
      </Card>

      <Button label="Lançar dia esquecido" variant="secondary" onPress={() => router.push('/launch-day')} />
    </ScrollView>
  );
};

function PeriodCard({ label, totals }: { label: string; totals: PeriodTotals }) {
  return (
    <Card style={styles.period}>
      <Text style={styles.periodLabel}>{label}</Text>
      <Text selectable adjustsFontSizeToFit numberOfLines={1} style={styles.periodValue}>
        {formatBRL(totals.netCents)}
      </Text>
      <Text style={styles.periodDetail}>
        {totals.days === 0
          ? 'Nenhum dia fechado'
          : `${totals.days} ${totals.days === 1 ? 'dia' : 'dias'} · Líquido`}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
  periods: { flexDirection: 'row', gap: spacing.sm },
  periodsStacked: { flexDirection: 'column' },
  period: { flex: 1, gap: spacing.xs },
  periodLabel: { fontSize: fontSize.small, fontWeight: '600', color: colors.textMuted },
  periodValue: {
    fontSize: fontSize.title + 2,
    fontWeight: '800',
    color: colors.primaryDark,
    fontVariant: ['tabular-nums'],
  },
  periodDetail: { fontSize: fontSize.caption, color: colors.textMuted },
  sectionTitle: {
    fontSize: fontSize.small,
    fontWeight: '700',
    color: colors.primaryDark,
    marginTop: spacing.sm,
  },
  row: {
    minHeight: touchTarget + spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  pressed: { backgroundColor: colors.accentSoft },
  rowText: { flex: 1, gap: 2 },
  day: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  detail: { fontSize: fontSize.caption, color: colors.textMuted, fontVariant: ['tabular-nums'] },
  net: {
    fontSize: fontSize.body,
    fontWeight: '800',
    color: colors.text,
    fontVariant: ['tabular-nums'],
    borderRadius: radius.md,
  },
});

export default HistoryScreen;
