import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { MoneyInput } from '@/components/MoneyInput';
import { QuantityStepper } from '@/components/QuantityStepper';
import { LoadingState, StateMessage } from '@/components/StateMessage';
import type { ClosingItem } from '@/db/schema';
import { formatBRL, multiplyCents } from '@/domain/money';
import { closingItemFormSchema } from '@/domain/validation';
import { useDateParam } from '@/hooks/useDay';
import { getClosingByDate, removeItem, updateItem } from '@/repositories/closings';
import { getProduct } from '@/repositories/products';
import { colors, fontSize, spacing } from '@/theme';

type Load =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; item: ClosingItem; catalogCostCents: number | null };

/** Corrige quantidade e custo de UMA compra de UM dia. O cadastro do produto não é tocado. */
export default function EditarItemScreen() {
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
          setLoad({ status: 'error', message: 'Essa compra não existe mais.' });
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
        title="Não deu para abrir a compra"
        description={load.message}
        actionLabel="Voltar"
        onAction={() => router.back()}
      />
    );
  }

  const { item, catalogCostCents } = load;
  const quantity = Number.parseInt(quantityText, 10) || 0;
  const unitWord = item.purchaseType === 'pack' ? 'pacote' : 'unidade';

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
      setError('Não deu para salvar. O que você digitou continua aqui; tente de novo.');
      setSaving(false);
    }
  }

  function confirmRemove() {
    Alert.alert('Tirar da lista?', `${item.productName} sai das compras deste dia.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Tirar',
        style: 'destructive',
        onPress: () => {
          removeItem(item.id)
            .then(() => router.back())
            .catch(() => setError('Não deu para tirar. Tente de novo.'));
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
        <Text style={styles.label}>Quantidade ({item.purchaseType === 'pack' ? 'pacotes' : 'unidades'})</Text>
        <QuantityStepper value={quantityText} onChangeText={setQuantityText} />
      </View>

      <MoneyInput
        label={`Custo do ${unitWord} (vale só para este dia)`}
        valueCents={costCents}
        onChangeCents={(next) => {
          setCostCents(next);
          setError(undefined);
        }}
      />
      {catalogCostCents !== null && costCents !== catalogCostCents ? (
        <Text style={styles.hint}>O cadastro continua em {formatBRL(catalogCostCents)}.</Text>
      ) : null}

      <Card>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total desta compra</Text>
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
      <Button label="Tirar da lista" variant="secondary" onPress={confirmRemove} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
  name: { fontSize: fontSize.title, fontWeight: '700', color: colors.primaryDark },
  field: { gap: spacing.xs },
  label: { fontSize: fontSize.small, fontWeight: '600', color: colors.textMuted },
  hint: { fontSize: fontSize.small, color: colors.textMuted },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: fontSize.body, color: colors.textMuted },
  totalValue: { fontSize: fontSize.title, fontWeight: '800', color: colors.primaryDark, fontVariant: ['tabular-nums'] },
  error: { fontSize: fontSize.small, color: colors.danger },
});
