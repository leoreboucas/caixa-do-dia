import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  formatBRL,
  LoadingState,
  MoneyInput,
  multiplyCents,
  PurchaseType,
  purchaseTypeLabels,
  purchaseTypePlural,
  purchaseTypeSingular,
  QuantityStepper,
  StateMessage,
  Text,
} from '@/features/shared';
import { closingItemFormSchema } from '@/features/day/validators';
import { useDateParam } from '@/features/day/hooks';
import { addItem, getClosingByDate, type ClosingWithItems } from '@/features/day/services';
import { listActiveProducts } from '@/features/products';
import type { Product } from '@/db/schema';
import { colors, fontSize, spacing, touchTarget } from '@/theme';

type Load =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; closing: ClosingWithItems | null; products: Product[] };

const AddPurchaseScreen = () => {
  const date = useDateParam();
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [productId, setProductId] = useState<number | null>(null);
  const [quantityText, setQuantityText] = useState('1');
  const [costCents, setCostCents] = useState(0);
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getClosingByDate(date), listActiveProducts()])
      .then(([closing, products]) => setLoad({ status: 'ready', closing, products }))
      .catch((e: unknown) =>
        setLoad({ status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido' }),
      );
  }, [date]);

  if (load.status === 'loading') return <LoadingState />;
  if (load.status === 'error') {
    return <StateMessage title="Não foi possível carregar" description={load.message} />;
  }
  const { closing, products } = load;
  if (!closing) {
    return (
      <StateMessage
        title="Dia não aberto"
        description="Informe o Caixa Inicial antes de lançar compras."
        actionLabel="Voltar"
        onAction={() => router.back()}
      />
    );
  }
  if (products.length === 0) {
    return (
      <StateMessage
        title="Nenhum produto cadastrado"
        description="Cadastre os produtos na aba Produtos para lançar compras."
        actionLabel="Voltar"
        onAction={() => router.back()}
      />
    );
  }

  const selected = products.find((p) => p.id === productId) ?? null;
  const quantity = Number.parseInt(quantityText.replace(/\D/g, ''), 10) || 0;
  const alreadyToday = selected ? closing.items.find((i) => i.productId === selected.id) : undefined;
  const unitWord = selected
    ? purchaseTypeSingular[selected.purchaseType]
    : purchaseTypeSingular[PurchaseType.UNIT];

  function choose(product: Product) {
    setProductId(product.id);
    setCostCents(product.costCents);
    setError(undefined);
  }

  async function submit() {
    if (!closing || !selected) {
      setError('Escolha um produto.');
      return;
    }
    const parsed = closingItemFormSchema.safeParse({
      productId: selected.id,
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
      await addItem({
        closingId: closing.id,
        product: selected,
        quantity: parsed.data.quantity,
        unitCostCents: parsed.data.unitCostCents,
      });
      router.back();
    } catch {
      setError('Não foi possível salvar. Tente novamente.');
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
      <Text style={styles.label}>Produto</Text>
      <Card flush>
        {products.map((product, index) => {
          const isSelected = product.id === productId;
          return (
            <Pressable
              key={product.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              onPress={() => choose(product)}
              style={({ pressed }) => [
                styles.productRow,
                index > 0 && styles.divider,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.productText}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productDetail}>
                  {purchaseTypeLabels[product.purchaseType]} · {formatBRL(product.costCents)}
                </Text>
              </View>
              <Text style={styles.check}>{isSelected ? '✓' : ''}</Text>
            </Pressable>
          );
        })}
      </Card>

      {selected ? (
        <>
          <View style={styles.field}>
            <Text style={styles.label}>Quantidade ({purchaseTypePlural[selected.purchaseType]})</Text>
            <QuantityStepper value={quantityText} onChangeText={setQuantityText} />
            {alreadyToday ? (
              <Text style={styles.hint}>
                {selected.name} já está neste dia com {alreadyToday.quantity}. A quantidade será somada.
              </Text>
            ) : null}
          </View>

          <MoneyInput
            label={`Custo do ${unitWord}`}
            valueCents={costCents}
            onChangeCents={(next) => {
              setCostCents(next);
              setError(undefined);
            }}
          />
          {costCents !== selected.costCents ? (
            <Text style={styles.hint}>Vale só para este dia. Cadastro: {formatBRL(selected.costCents)}.</Text>
          ) : null}

          <Card>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text selectable style={styles.totalValue}>
                {formatBRL(multiplyCents(costCents, quantity))}
              </Text>
            </View>
          </Card>
        </>
      ) : null}

      {error ? (
        <Text selectable style={styles.error}>
          {error}
        </Text>
      ) : null}
      <Button label="Adicionar" onPress={submit} loading={saving} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
  label: { fontSize: fontSize.small, color: colors.textMuted },
  field: { gap: spacing.xs },
  productRow: {
    minHeight: touchTarget + spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  pressed: { opacity: 0.7 },
  productText: { flex: 1, gap: 2 },
  productName: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  productDetail: { fontSize: fontSize.small, color: colors.textMuted, fontVariant: ['tabular-nums'] },
  check: {
    fontSize: fontSize.title,
    fontWeight: '800',
    color: colors.primary,
    width: 24,
    textAlign: 'center',
  },
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

export default AddPurchaseScreen;
