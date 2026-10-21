import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/Card';
import { MonthPicker } from '@/components/MonthPicker';
import { SegmentedChoice } from '@/components/SegmentedChoice';
import { LoadingState, StateMessage } from '@/components/StateMessage';
import { Stat, SummaryCard } from '@/components/SummaryCard';
import { formatDateKeyBR, todayKey, weekdayNameBR } from '@/domain/date';
import { formatBRL } from '@/domain/money';
import {
  buildMonthReport,
  expensesByProduct,
  formatMonthBR,
  listMonthReports,
  monthKeyOf,
  monthNameBR,
  sumMonthReports,
  type MonthKey,
} from '@/domain/report';
import { summarizeClosing } from '@/domain/closing';
import { listClosingsBetween, type ClosingWithItems } from '@/repositories/closings';
import { colors, fontSize, radius, spacing, touchTarget } from '@/theme';

type Mode = 'month' | 'all';
const MODE_OPTIONS = [
  { value: 'month', label: 'Por mês' },
  { value: 'all', label: 'Todos os meses' },
] as const;

type Load = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; closings: ClosingWithItems[] };

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export default function RelatoriosScreen() {
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [mode, setMode] = useState<Mode>('month');
  const currentMonth = monthKeyOf(todayKey());
  const [month, setMonth] = useState<MonthKey>(currentMonth);
  const hasData = useRef(false);

  const refresh = useCallback(() => {
    listClosingsBetween('1900-01-01', '9999-12-31')
      .then((closings) => {
        hasData.current = true;
        setLoad({ status: 'ready', closings });
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
        title="Não deu para abrir os relatórios"
        description={load.message}
        actionLabel="Tentar de novo"
        onAction={() => {
          setLoad({ status: 'loading' });
          refresh();
        }}
      />
    );
  }

  const { closings } = load;
  if (closings.length === 0) {
    return (
      <StateMessage
        title="Seus relatórios aparecem aqui"
        description="Depois de fechar o primeiro dia, você vê quanto vendeu, gastou e sobrou em cada mês, e no total."
      />
    );
  }

  // closings vem do mais recente para o mais antigo
  const firstMonth = monthKeyOf((closings[closings.length - 1] as ClosingWithItems).date);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.scroll} contentContainerStyle={styles.content}>
      <SegmentedChoice options={MODE_OPTIONS} value={mode} onChange={setMode} />

      {mode === 'month' ? (
        <MonthReportView
          closings={closings}
          month={month}
          onChangeMonth={setMonth}
          min={firstMonth < currentMonth ? firstMonth : currentMonth}
          max={currentMonth}
        />
      ) : (
        <AllMonthsView
          closings={closings}
          onOpenMonth={(next) => {
            setMonth(next);
            setMode('month');
          }}
        />
      )}
    </ScrollView>
  );
}

function MonthReportView({
  closings,
  month,
  onChangeMonth,
  min,
  max,
}: {
  closings: ClosingWithItems[];
  month: MonthKey;
  onChangeMonth: (month: MonthKey) => void;
  min: MonthKey;
  max: MonthKey;
}) {
  const report = buildMonthReport(month, closings);
  const monthClosings = closings.filter((c) => monthKeyOf(c.date) === month);
  const products = expensesByProduct(monthClosings);
  const { totals } = report;

  return (
    <>
      <MonthPicker value={month} onChange={onChangeMonth} min={min} max={max} />

      {monthClosings.length === 0 ? (
        <Card>
          <Text style={styles.hint}>Nenhum dia lançado em {formatMonthBR(month)}.</Text>
        </Card>
      ) : (
        <>
          <SummaryCard
            label={`Líquido de ${monthNameBR(month)}`}
            valueCents={totals.netCents}
            description={
              totals.days === 0
                ? 'Nenhum dia fechado neste mês.'
                : `${plural(totals.days, 'dia fechado', 'dias fechados')} · média de ${formatBRL(report.averageNetCents ?? 0)} por dia`
            }
          >
            <Stat label="Bruto" valueCents={totals.grossCents} />
            <Stat label="Despesas" valueCents={totals.expensesCents} />
          </SummaryCard>

          {report.openDays > 0 ? (
            <View style={styles.note}>
              <Text style={styles.noteText}>
                {plural(report.openDays, 'dia ainda falta', 'dias ainda faltam')} fechar e não entra
                {report.openDays === 1 ? '' : 'm'} na conta.
              </Text>
            </View>
          ) : null}

          {report.bestDay ? (
            <Card>
              <View style={styles.line}>
                <Text style={styles.lineLabel}>Melhor dia</Text>
                <Text selectable style={styles.lineValue}>
                  {weekdayNameBR(report.bestDay.date)}, {formatDateKeyBR(report.bestDay.date).slice(0, 5)} ·{' '}
                  {formatBRL(report.bestDay.netCents)}
                </Text>
              </View>
            </Card>
          ) : null}

          {products.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Quanto você gastou em cada produto</Text>
              <Card flush>
                {products.map((product, index) => (
                  <View key={product.productName} style={[styles.row, index > 0 && styles.divider]}>
                    <Text selectable style={styles.rowTitle}>
                      {product.productName}
                    </Text>
                    <Text selectable style={styles.rowValue}>
                      {formatBRL(product.totalCents)}
                    </Text>
                  </View>
                ))}
              </Card>
            </>
          ) : null}

          <Text style={styles.sectionTitle}>Dias do mês</Text>
          <Card flush>
            {monthClosings.map((closing, index) => {
              const summary = summarizeClosing(closing);
              const isOpen = closing.status === 'open';
              return (
                <Pressable
                  key={closing.id}
                  accessibilityRole="button"
                  accessibilityHint="Toque para ver o dia"
                  onPress={() => router.push({ pathname: '/dia/[date]', params: { date: closing.date } })}
                  style={({ pressed }) => [styles.row, index > 0 && styles.divider, pressed && styles.pressed]}
                >
                  <View style={styles.rowText}>
                    <Text selectable style={styles.rowTitle}>
                      {weekdayNameBR(closing.date)}, {formatDateKeyBR(closing.date).slice(0, 5)}
                    </Text>
                    <Text selectable style={styles.rowDetail}>
                      {isOpen
                        ? 'Falta fechar'
                        : `Bruto ${formatBRL(summary.grossCents)} · despesas ${formatBRL(summary.expensesCents)}`}
                    </Text>
                  </View>
                  <Text selectable style={styles.rowValue}>
                    {isOpen ? 'Em aberto' : formatBRL(summary.netCents)}
                  </Text>
                </Pressable>
              );
            })}
          </Card>
        </>
      )}
    </>
  );
}

function AllMonthsView({
  closings,
  onOpenMonth,
}: {
  closings: ClosingWithItems[];
  onOpenMonth: (month: MonthKey) => void;
}) {
  const reports = listMonthReports(closings);
  const total = sumMonthReports(reports);

  return (
    <>
      <SummaryCard
        label="Líquido de todos os meses"
        valueCents={total.netCents}
        description={`${plural(reports.length, 'mês', 'meses')} · ${plural(total.days, 'dia fechado', 'dias fechados')}`}
      >
        <Stat label="Bruto" valueCents={total.grossCents} />
        <Stat label="Despesas" valueCents={total.expensesCents} />
      </SummaryCard>

      {total.openDays > 0 ? (
        <View style={styles.note}>
          <Text style={styles.noteText}>
            {plural(total.openDays, 'dia ainda falta', 'dias ainda faltam')} fechar e não entra
            {total.openDays === 1 ? '' : 'm'} na conta.
          </Text>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Mês a mês</Text>
      <Card flush>
        {reports.map((report, index) => (
          <Pressable
            key={report.month}
            accessibilityRole="button"
            accessibilityHint="Toque para ver o relatório do mês"
            onPress={() => onOpenMonth(report.month)}
            style={({ pressed }) => [styles.row, index > 0 && styles.divider, pressed && styles.pressed]}
          >
            <View style={styles.rowText}>
              <Text selectable style={styles.rowTitle}>
                {formatMonthBR(report.month)}
              </Text>
              <Text selectable style={styles.rowDetail}>
                {report.totals.days === 0
                  ? 'Nenhum dia fechado'
                  : `Bruto ${formatBRL(report.totals.grossCents)} · despesas ${formatBRL(report.totals.expensesCents)}`}
              </Text>
            </View>
            <Text selectable style={styles.rowValue}>
              {formatBRL(report.totals.netCents)}
            </Text>
          </Pressable>
        ))}
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
  hint: { fontSize: fontSize.small, color: colors.textMuted, lineHeight: 20 },
  sectionTitle: { fontSize: fontSize.small, fontWeight: '700', color: colors.primaryDark, marginTop: spacing.sm },
  note: { backgroundColor: colors.accentSoft, borderRadius: radius.md, borderCurve: 'continuous', padding: spacing.md },
  noteText: { fontSize: fontSize.small, color: colors.text, lineHeight: 20 },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  lineLabel: { fontSize: fontSize.body, color: colors.textMuted },
  lineValue: { flexShrink: 1, fontSize: fontSize.body, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'], textAlign: 'right' },
  row: {
    minHeight: touchTarget + spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  pressed: { backgroundColor: colors.accentSoft },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  rowDetail: { fontSize: fontSize.caption, color: colors.textMuted, fontVariant: ['tabular-nums'] },
  rowValue: { fontSize: fontSize.body, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] },
});
