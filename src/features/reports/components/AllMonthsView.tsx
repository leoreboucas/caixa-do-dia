import { Pressable, StyleSheet, View } from 'react-native';
import { Card, formatBRL, pluralize, Stat, SummaryCard, Text } from '@/features/shared';
import { formatMonthBR, listMonthReports, sumMonthReports, type MonthKey } from '@/features/reports/utils';
import type { ClosingWithItems } from '@/features/day';
import { colors, fontSize, radius, spacing, touchTarget } from '@/theme';

const AllMonthsView = ({
  closings,
  onOpenMonth,
}: {
  closings: ClosingWithItems[];
  onOpenMonth: (month: MonthKey) => void;
}) => {
  const reports = listMonthReports(closings);
  const total = sumMonthReports(reports);

  return (
    <>
      <SummaryCard
        label="Líquido de todos os meses"
        valueCents={total.netCents}
        description={`${pluralize(reports.length, 'mês', 'meses')} · ${pluralize(total.days, 'dia fechado', 'dias fechados')}`}
      >
        <Stat label="Bruto" valueCents={total.grossCents} />
        <Stat label="Despesas" valueCents={total.expensesCents} />
      </SummaryCard>

      {total.openDays > 0 ? (
        <View style={styles.note}>
          <Text style={styles.noteText}>
            {pluralize(total.openDays, 'dia em aberto não entra', 'dias em aberto não entram')} no cálculo.
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
                  : `Bruto ${formatBRL(report.totals.grossCents)} · Despesas ${formatBRL(report.totals.expensesCents)}`}
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
};

const styles = StyleSheet.create({
  note: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    padding: spacing.md,
  },
  noteText: { fontSize: fontSize.small, color: colors.text, lineHeight: 20 },
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
  pressed: { backgroundColor: colors.accentSoft },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  rowDetail: { fontSize: fontSize.caption, color: colors.textMuted, fontVariant: ['tabular-nums'] },
  rowValue: { fontSize: fontSize.body, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] },
});

export default AllMonthsView;
