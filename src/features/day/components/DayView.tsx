import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { deleteClosing, type ClosingWithItems } from '@/features/day/services';
import {
  Button,
  Card,
  ClosingStatus,
  type DateKey,
  formatBRL,
  formatDateKeyBR,
  Stat,
  summarizeClosing,
  SummaryCard,
  Text,
  todayKey,
} from '@/features/shared';
import { colors, fontSize, spacing, touchTarget } from '@/theme';
import DayHeader from './DayHeader';
import DayItemsList from './DayItemsList';
import EditChip from './EditChip';
import StepRow from './StepRow';

interface DayViewProps {
  date: DateKey;
  closing: ClosingWithItems;
  currentCosts: Record<number, number>;
  onCancelled: () => void;
}

const DayView = ({ date, closing, currentCosts, onCancelled }: DayViewProps) => {
  const summary = summarizeClosing(closing);
  const isOpen = closing.status === ClosingStatus.OPEN;
  const params = { date };
  const editOpening = () => router.push({ pathname: '/edit-opening-cash', params });

  const confirmCancel = () => {
    Alert.alert(
      'Cancelar lançamento?',
      `O dia ${formatDateKeyBR(date)} e as compras lançadas nele serão removidos.`,
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Cancelar lançamento',
          style: 'destructive',
          onPress: () => {
            deleteClosing(closing.id)
              .then(onCancelled)
              .catch(() => Alert.alert('Não foi possível cancelar', 'Tente novamente.'));
          },
        },
      ],
    );
  };

  return (
    <>
      <DayHeader date={date} status={closing.status} />

      {isOpen ? (
        <Card flush>
          <StepRow
            done
            title="Caixa Inicial"
            detail="Valor com que o dia começou"
            value={formatBRL(summary.openingCashCents)}
            onEdit={editOpening}
          />
          <StepRow
            done={closing.items.length > 0}
            divider
            title="Compras"
            detail={
              closing.items.length === 0
                ? 'Nenhuma compra lançada'
                : `${closing.items.length} ${closing.items.length === 1 ? 'item' : 'itens'}`
            }
            value={closing.items.length === 0 ? undefined : formatBRL(summary.expensesCents)}
          />
          <StepRow divider title="Caixa Final" detail="Informe no fim do dia" />
        </Card>
      ) : (
        <>
          <SummaryCard
            label="Líquido"
            valueCents={summary.netCents}
            description={
              summary.netCents < 0 ? 'Despesas maiores que a venda neste dia.' : 'Bruto menos Despesas.'
            }
          >
            <Stat label="Bruto" valueCents={summary.grossCents} />
            <Stat label="Despesas" valueCents={summary.expensesCents} />
          </SummaryCard>
          <Card flush>
            <Pressable
              accessibilityRole="button"
              accessibilityHint="Toque para editar o Caixa Inicial"
              onPress={editOpening}
              style={({ pressed }) => [styles.cashRow, styles.cashPad, pressed && styles.pressed]}
            >
              <Text style={styles.cashLabel}>Caixa Inicial</Text>
              <View style={styles.cashEdit}>
                <Text selectable style={styles.cashValue}>
                  {formatBRL(summary.openingCashCents)}
                </Text>
                <EditChip />
              </View>
            </Pressable>
            <View style={[styles.cashRow, styles.cashPad]}>
              <Text style={styles.cashLabelStrong}>Caixa Final</Text>
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

      <Text style={styles.sectionTitle}>{date === todayKey() ? 'Compras de hoje' : 'Compras do dia'}</Text>
      <DayItemsList
        items={closing.items}
        currentCosts={currentCosts}
        emptyText={isOpen ? 'Nenhuma compra lançada.' : 'Nenhuma compra neste dia.'}
        onPressItem={(item) =>
          router.push({ pathname: '/edit-item', params: { date, itemId: String(item.id) } })
        }
      />

      <View style={styles.actions}>
        <Button
          label="Adicionar compra"
          variant="secondary"
          onPress={() => router.push({ pathname: '/add-purchase', params })}
        />
        <Button
          label={isOpen ? 'Informar Caixa Final e fechar o dia' : 'Editar Caixa Final e observação'}
          variant={isOpen ? 'primary' : 'secondary'}
          onPress={() => router.push({ pathname: '/close-day', params })}
        />
        {isOpen ? <Button label="Cancelar lançamento do dia" variant="text" onPress={confirmCancel} /> : null}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: fontSize.small,
    fontWeight: '700',
    color: colors.primaryDark,
    marginTop: spacing.sm,
  },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
  cashRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignContent: 'center',
    gap: spacing.sm,
  },
  cashPad: { minHeight: touchTarget, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  pressed: { backgroundColor: colors.accentSoft },
  cashEdit: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  cashLabel: { fontSize: fontSize.body, color: colors.textMuted },
  cashValue: { fontSize: fontSize.body, color: colors.text, fontVariant: ['tabular-nums'] },
  cashLabelStrong: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  cashValueStrong: {
    fontSize: fontSize.title,
    fontWeight: '800',
    color: colors.primaryDark,
    fontVariant: ['tabular-nums'],
  },
});

export default DayView;
