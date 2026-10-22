import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  formatBRL,
  LoadingState,
  MoneyInput,
  multiplyCents,
  purchaseTypePlural,
  purchaseTypeSingular,
  QuantityStepper,
  StateMessage,
  Text,
} from '@/features/shared';
import { closingItemFormSchema } from '@/features/day/validators';
import { useDateParam } from '@/features/day/hooks';
import { getClosingByDate, removeItem, updateItem } from '@/features/day/services';
import { getProduct } from '@/features/products';
import type { ClosingItem } from '@/db/schema';
import { colors, fontSize, spacing } from '@/theme';

type Load =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; item: ClosingItem; catalogCostCents: number | null };

const EditItemScreen = () => {
  const date = useDateParam();
  const { itemId } = useLocalSearchParams<{ itemId?: string }>();
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [quantityText, setQuantityText] = useState('1');
  const [costCents, setCostCents] = useState(0);
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const id = Number.parseInt(itemId ?? '', 10);
    getClosingByDate(date)
      .then(async (closing) => {
        const item = closing?.items.find((i) => i.id === id);
        if (!item) {
          setLoad({ status: 'error', message: 'Compra não encontrada.' });
          return;
        }
        const product = await getProduct(item.productId);
        setQuantityText(String(item.quantity));
        setCostCents(item.unitCostCents);
        setLoad({ status: 'ready', item, catalogCostCents: product?.costCents ?? null });
      })
      .catch((e: unknown) =>
        setLoad({ status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido' }),
      );
  }, [date, itemId]);

  if (load.status === 'loading') return <LoadingState />;
  if (load.status === 'error') {
    return (
      <StateMessage
        title="Não foi possível abrir a compra"
        description={load.message}
        actionLabel="Voltar"
        onAction={() => router.back()}
      />
    );
  }

  const { item, catalogCostCents } = load;
  const quantity = Number.parseInt(quantityText, 10) || 0;
  const unitWord = purchaseTypeSingular[item.purchaseType];

  async function submit() {
    const parsed = closingItemFormSchema.safeParse({
      productId: item.productId,
      quantity,
      unitCostCents: costCents,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Confira os valores');
      return;
    }
    setError(undefined);
    setSaving(true);
    try {
      await updateItem(item.id, { quantity: parsed.data.quantity, unitCostCents: parsed.data.unitCostCents });
      router.back();
    } catch {
      setError('Não foi possível salvar. Tente novamente.');
      setSaving(false);
    }
  }

  function confirmRemove() {
    Alert.alert('Remover compra?', `${item.productName} será removido das compras deste dia.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => {
          removeItem(item.id)
            .then(() => router.back())
            .catch(() => setError('Não foi possível remover. Tente novamente.'));
        },
      },
    ]);
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      style={styles.scroll}
      contentContainerStyle={styles.content}
    >
      <Text selectable style={styles.name}>
        {item.productName}
      </Text>

      <View style={styles.field}>
        <Text style={styles.label}>Quantidade ({purchaseTypePlural[item.purchaseType]})</Text>
        <QuantityStepper value={quantityText} onChangeText={setQuantityText} />
      </View>

      <MoneyInput
        label={`Custo do ${unitWord}`}
        valueCents={costCents}
        onChangeCents={(next) => {
          setCostCents(next);
          setError(undefined);
        }}
      />
      {catalogCostCents !== null && costCents !== catalogCostCents ? (
        <Text style={styles.hint}>Vale só para este dia. Cadastro: {formatBRL(catalogCostCents)}.</Text>
      ) : null}

      <Card>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text selectable style={styles.totalValue}>
            {formatBRL(multiplyCents(costCents, quantity))}
          </Text>
        </View>
      </Card>

      {error ? (
        <Text selectable style={styles.error}>
          {error}
        </Text>
      ) : null}
      <Button label="Salvar alterações" onPress={submit} loading={saving} />
      <Button label="Remover compra" variant="secondary" onPress={confirmRemove} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
  name: { fontSize: fontSize.title, fontWeight: '700', color: colors.primaryDark },
  field: { gap: spacing.xs },
  label: { fontSize: fontSize.small, fontWeight: '600', color: colors.textMuted },
  hint: { fontSize: fontSize.small, color: colors.textMuted },
  totalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.xs,
  },
  totalLabel: { fontSize: fontSize.body, color: colors.textMuted },
  totalValue: {
    fontSize: fontSize.title,
    fontWeight: '800',
    color: colors.primaryDark,
    fontVariant: ['tabular-nums'],
  },
  error: { fontSize: fontSize.small, color: colors.danger },
});

export default EditItemScreen;
