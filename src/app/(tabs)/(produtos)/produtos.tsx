import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { LoadingState, StateMessage } from '@/components/StateMessage';
import type { Product } from '@/db/schema';
import { formatBRL } from '@/domain/money';
import { unitCostCents } from '@/domain/productCost';
import { listActiveProducts } from '@/repositories/products';
import { colors, fontSize, spacing, touchTarget } from '@/theme';

type Load = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; products: Product[] };

function describe(product: Product): string {
  if (product.purchaseType === 'unit') return `Por unidade · ${formatBRL(product.costCents)}`;
  const each = unitCostCents(product.costCents, product);
  const pack = `Por pacote · ${formatBRL(product.costCents)}`;
  return each === null ? pack : `${pack} (${formatBRL(each)} cada)`;
}

export default function ProdutosScreen() {
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const hasData = useRef(false);

  const refresh = useCallback(() => {
    listActiveProducts()
      .then((products) => {
        hasData.current = true;
        setLoad({ status: 'ready', products });
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
        title="Não deu para abrir seus produtos"
        description={load.message}
        actionLabel="Tentar de novo"
        onAction={() => {
          setLoad({ status: 'loading' });
          refresh();
        }}
      />
    );
  }

  const { products } = load;
  if (products.length === 0) {
    return (
      <StateMessage
        title="Cadastre o que você compra"
        description="Coco, doce de banana, amendoim… Com os produtos cadastrados, registrar uma compra leva poucos toques."
        actionLabel="Novo produto"
        onAction={() => router.push('/produto')}
      />
    );
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.scroll} contentContainerStyle={styles.content}>
      <Card flush>
        {products.map((product, index) => (
          <Pressable
            key={product.id}
            accessibilityRole="button"
            accessibilityHint="Toque para editar"
            onPress={() => router.push({ pathname: '/produto', params: { id: String(product.id) } })}
            style={({ pressed }) => [styles.row, index > 0 && styles.divider, pressed && styles.pressed]}
          >
            <View style={styles.rowText}>
              <Text selectable style={styles.name}>
                {product.name}
              </Text>
              <Text selectable style={styles.detail}>
                {describe(product)}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </Card>
      <Button label="Novo produto" onPress={() => router.push('/produto')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
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
  name: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  detail: { fontSize: fontSize.small, color: colors.textMuted, fontVariant: ['tabular-nums'] },
  chevron: { fontSize: fontSize.title + 6, color: colors.textMuted },
});
