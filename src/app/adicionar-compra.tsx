import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { MoneyInput } from '@/components/MoneyInput';
import { QuantityStepper } from '@/components/QuantityStepper';
import { LoadingState, StateMessage } from '@/components/StateMessage';
import type { Product } from '@/db/schema';
import { formatBRL, multiplyCents } from '@/domain/money';
import { closingItemFormSchema } from '@/domain/validation';
import { useDateParam } from '@/hooks/useDay';
import { addItem, getClosingByDate, type ClosingWithItems } from '@/repositories/closings';
import { listActiveProducts } from '@/repositories/products';
import { colors, fontSize, spacing, touchTarget } from '@/theme';

type Load =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; closing: ClosingWithItems | null; products: Product[] };

/** Escolhe o produto, a quantidade e (se precisar) o custo DE HOJE. O cadastro do produto nunca é alterado aqui. */
export default function AdicionarCompraScreen() {
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
    return <StateMessage title="Não deu para carregar" description={load.message} />;
  }
  const { closing, products } = load;
  if (!closing) {
    return (
      <StateMessage
        title="Abra o dia primeiro"
        description="Informe o caixa inicial antes de registrar compras."
        actionLabel="Voltar"
        onAction={() => router.back()}
      />
    );
  }
  if (products.length === 0) {
    return (
      <StateMessage
        title="Cadastre um produto primeiro"
        description="Vá em Produtos e cadastre o que você compra, como coco, doce de banana e amendoim."
        actionLabel="Voltar"
        onAction={() => router.back()}
      />
    );
  }

  const selected = products.find((p) => p.id === productId) ?? null;
  const quantity = Number.parseInt(quantityText.replace(/\D/g, ''), 10) || 0;
  const alreadyToday = selected ? closing.items.find((i) => i.productId === selected.id) : undefined;
  const unitWord = selected?.purchaseType === 'pack' ? 'pacote' : 'unidade';

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
      // Mantém produto, quantidade e custo digitados para tentar de novo
      setError('Não deu para salvar. O que você digitou continua aqui; tente de novo.');
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
      <Text style={styles.label}>O que você comprou?</Text>
      <Card flush>
        {products.map((product, index) => {
          const isSelected = product.id === productId;
          return (
            <Pressable
              key={product.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              onPress={() => choose(product)}
              style={({ pressed }) => [styles.productRow, index > 0 && styles.divider, pressed && styles.pressed]}
            >
              <View style={styles.productText}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productDetail}>
                  {product.purchaseType === 'pack' ? 'Pacote' : 'Unidade'} · {formatBRL(product.costCents)}
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
            <Text style={styles.label}>Quantidade ({selected.purchaseType === 'pack' ? 'pacotes' : 'unidades'})</Text>
            <QuantityStepper value={quantityText} onChangeText={setQuantityText} />
            {alreadyToday ? (
              <Text style={styles.hint}>
                Já tem {alreadyToday.quantity} de {selected.name} neste dia. A quantidade será somada.
              </Text>
            ) : null}
          </View>

          <MoneyInput
            label={`Custo do ${unitWord} (vale só para hoje)`}
            valueCents={costCents}
            onChangeCents={(next) => {
              setCostCents(next);
              setError(undefined);
            }}
          />
          {costCents !== selected.costCents ? (
            <Text style={styles.hint}>O cadastro continua em {formatBRL(selected.costCents)}.</Text>
          ) : null}

          <Card>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total desta compra</Text>
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
}

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
  check: { fontSize: fontSize.title, fontWeight: '800', color: colors.primary, width: 24, textAlign: 'center' },
  hint: { fontSize: fontSize.small, color: colors.textMuted },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: fontSize.body, color: colors.textMuted },
  totalValue: { fontSize: fontSize.title, fontWeight: '800', color: colors.primaryDark, fontVariant: ['tabular-nums'] },
  error: { fontSize: fontSize.small, color: colors.danger },
});
