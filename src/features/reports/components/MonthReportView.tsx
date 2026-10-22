import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  Card,
  ClosingStatus,
  formatBRL,
  formatDateKeyBR,
  pluralize,
  Stat,
  summarizeClosing,
  SummaryCard,
  Text,
  weekdayNameBR,
} from '@/features/shared';
import {
  buildMonthReport,
  expensesByProduct,
  formatMonthBR,
  monthKeyOf,
  monthNameBR,
  type MonthKey,
} from '@/features/reports/utils';
import type { ClosingWithItems } from '@/features/day';
import { colors, fontSize, radius, spacing, touchTarget } from '@/theme';
import MonthPicker from './MonthPicker';

const MonthReportView = ({
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
}) => {
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
                : `${pluralize(totals.days, 'dia fechado', 'dias fechados')} · média de ${formatBRL(report.averageNetCents ?? 0)} por dia`
            }
          >
            <Stat label="Bruto" valueCents={totals.grossCents} />
            <Stat label="Despesas" valueCents={totals.expensesCents} />
          </SummaryCard>

          {report.openDays > 0 ? (
            <View style={styles.note}>
              <Text style={styles.noteText}>
                {pluralize(report.openDays, 'dia em aberto não entra', 'dias em aberto não entram')} no
                cálculo.
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
              <Text style={styles.sectionTitle}>Despesas por produto</Text>
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
              const isOpen = closing.status === ClosingStatus.OPEN;
              return (
                <Pressable
                  key={closing.id}
                  accessibilityRole="button"
                  accessibilityHint="Toque para ver o dia"
                  onPress={() => router.push({ pathname: '/day/[date]', params: { date: closing.date } })}
                  style={({ pressed }) => [
                    styles.row,
                    index > 0 && styles.divider,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.rowText}>
                    <Text selectable style={styles.rowTitle}>
                      {weekdayNameBR(closing.date)}, {formatDateKeyBR(closing.date).slice(0, 5)}
                    </Text>
                    <Text selectable style={styles.rowDetail}>
                      {isOpen
                        ? 'Em aberto'
                        : `Bruto ${formatBRL(summary.grossCents)} · Despesas ${formatBRL(summary.expensesCents)}`}
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
};

const styles = StyleSheet.create({
  hint: { fontSize: fontSize.small, color: colors.textMuted, lineHeight: 20 },
  note: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    padding: spacing.md,
  },
  noteText: { fontSize: fontSize.small, color: colors.text, lineHeight: 20 },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  lineLabel: { fontSize: fontSize.body, color: colors.textMuted },
  lineValue: {
    flexShrink: 1,
    fontSize: fontSize.body,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
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
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  rowTitle: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  rowValue: { fontSize: fontSize.body, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] },
  pressed: { backgroundColor: colors.accentSoft },
  rowText: { flex: 1, gap: 2 },
  rowDetail: { fontSize: fontSize.caption, color: colors.textMuted, fontVariant: ['tabular-nums'] },
});

export default MonthReportView;
