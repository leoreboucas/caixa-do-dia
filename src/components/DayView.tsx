import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { DayItemsList } from '@/components/DayItemsList';
import { Stat, SummaryCard } from '@/components/SummaryCard';
import { summarizeClosing } from '@/domain/closing';
import { formatDateKeyBR, todayKey, type DateKey } from '@/domain/date';
import { formatBRL } from '@/domain/money';
import type { ClosingWithItems } from '@/repositories/closings';
import { colors, fontSize, radius, spacing } from '@/theme';

/** Data do dia e, se o dia já foi aberto, se está aberto ou fechado. */
export function DayHeader({ date, status }: { date: DateKey; status?: 'open' | 'closed' }) {
  return (
    <View style={styles.dateRow}>
      <Text style={styles.date}>{formatDateKeyBR(date)}</Text>
      {status ? (
        <View style={styles.status}>
          <View style={[styles.dot, status === 'open' && styles.dotOpen]} />
          <Text style={styles.statusText}>{status === 'open' ? 'Falta fechar' : 'Dia fechado'}</Text>
        </View>
      ) : null}
    </View>
  );
}

function StepRow({
  title,
  detail,
  value,
  done = false,
  divider = false,
}: {
  title: string;
  detail: string;
  value?: string;
  done?: boolean;
  divider?: boolean;
}) {
  return (
    <View style={[styles.step, divider && styles.stepDivider]}>
      <View style={[styles.check, done && styles.checkDone]}>
        <Text style={styles.checkMark}>{done ? '✓' : ''}</Text>
      </View>
      <View style={styles.stepText}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDetail}>{detail}</Text>
      </View>
      {value ? (
        <Text selectable style={styles.stepValue}>
          {value}
        </Text>
      ) : null}
    </View>
  );
}

interface Props {
  date: DateKey;
  closing: ClosingWithItems;
  currentCosts: Record<number, number>;
  /** Quantos dias existem depois deste. Se > 0, avisa que editar pode defasar o caixa deles. */
  laterDays: number;
}

/** Um dia já aberto (hoje ou um dia antigo): resumo, compras e ações. Serve para as telas Hoje e Histórico. */
export function DayView({ date, closing, currentCosts, laterDays }: Props) {
  const summary = summarizeClosing(closing);
  const isOpen = closing.status === 'open';
  const params = { date };

  return (
    <>
      <DayHeader date={date} status={closing.status} />

      {isOpen ? (
        <Card flush>
          <StepRow
            done
            title="Caixa inicial"
            detail="Dinheiro com que você começou o dia"
            value={formatBRL(summary.openingCashCents)}
          />
          <StepRow
            done={closing.items.length > 0}
            divider
            title="Compras"
            detail={
              closing.items.length === 0
                ? 'Adicione o que você comprou'
                : `${closing.items.length} ${closing.items.length === 1 ? 'item' : 'itens'}`
            }
            value={closing.items.length === 0 ? undefined : formatBRL(summary.expensesCents)}
          />
          <StepRow divider title="Venda total" detail="Falta informar para ver o líquido" />
        </Card>
      ) : (
        <>
          <SummaryCard
            label="Líquido"
            valueCents={summary.netCents}
            description={
              summary.netCents < 0
                ? 'As compras passaram da venda neste dia.'
                : 'O que sobrou da venda depois das despesas.'
            }
          >
            <Stat label="Bruto" valueCents={summary.grossCents} />
            <Stat label="Despesas" valueCents={summary.expensesCents} />
          </SummaryCard>
          <Card>
            <View style={styles.cashRow}>
              <Text style={styles.cashLabel}>Caixa inicial</Text>
              <Text selectable style={styles.cashValue}>
                {formatBRL(summary.openingCashCents)}
              </Text>
            </View>
            <View style={styles.cashRow}>
              <Text style={styles.cashLabelStrong}>Caixa final</Text>
              <Text selectable style={styles.cashValueStrong}>
                {formatBRL(summary.finalCashCents)}
              </Text>
            </View>
          </Card>
          {closing.note ? (
            <Card>
              <Text style={styles.cashLabel}>Observação</Text>
              <Text selectable style={styles.cashValue}>
                {closing.note}
              </Text>
            </Card>
          ) : null}
        </>
      )}

      {laterDays > 0 ? (
        <View style={styles.warning}>
          <Text style={styles.warningTitle}>Atenção com os dias seguintes</Text>
          <Text style={styles.warningText}>
            Existem dias depois deste. Se você mudar valores aqui, o caixa deles pode ficar desatualizado.
          </Text>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>{date === todayKey() ? 'Compras de hoje' : 'Compras do dia'}</Text>
      <DayItemsList
        items={closing.items}
        currentCosts={currentCosts}
        emptyText={
          isOpen
            ? 'Nenhuma compra lançada. Comprou coco, doce ou amendoim neste dia? Toque em Adicionar compra.'
            : 'Nenhuma compra neste dia.'
        }
        onPressItem={(item) => router.push({ pathname: '/editar-item', params: { date, itemId: String(item.id) } })}
      />

      <View style={styles.actions}>
        <Button
          label="Adicionar compra"
          variant="secondary"
          onPress={() => router.push({ pathname: '/adicionar-compra', params })}
        />
        <Button
          label={isOpen ? 'Informar a venda e fechar o dia' : 'Editar caixa, venda e observação'}
          variant={isOpen ? 'primary' : 'secondary'}
          onPress={() => router.push({ pathname: '/fechar-dia', params })}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: fontSize.small, fontWeight: '600', color: colors.textMuted, fontVariant: ['tabular-nums'] },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  dot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: colors.textMuted },
  dotOpen: { backgroundColor: colors.accent },
  statusText: { fontSize: fontSize.caption, fontWeight: '700', color: colors.text },
  sectionTitle: { fontSize: fontSize.small, fontWeight: '700', color: colors.primaryDark, marginTop: spacing.sm },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
  cashRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cashLabel: { fontSize: fontSize.body, color: colors.textMuted },
  cashValue: { fontSize: fontSize.body, color: colors.text, fontVariant: ['tabular-nums'] },
  cashLabelStrong: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  cashValueStrong: { fontSize: fontSize.title, fontWeight: '800', color: colors.primaryDark, fontVariant: ['tabular-nums'] },
  step: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  stepDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  check: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkMark: { fontSize: fontSize.small, fontWeight: '800', color: colors.onPrimary },
  stepText: { flex: 1, gap: 2 },
  stepTitle: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  stepDetail: { fontSize: fontSize.small, color: colors.textMuted },
  stepValue: { fontSize: fontSize.body, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  warning: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    padding: spacing.md,
    gap: spacing.xs,
  },
  warningTitle: { fontSize: fontSize.small, fontWeight: '700', color: colors.text },
  warningText: { fontSize: fontSize.small, color: colors.text, lineHeight: 20 },
});
