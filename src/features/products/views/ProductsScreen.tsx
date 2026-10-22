import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  formatBRL,
  isPack,
  LoadingState,
  purchaseTypeLabels,
  StateMessage,
  Text,
} from '@/features/shared';
import { unitCostCents } from '@/features/products/utils';
import { listActiveProducts } from '@/features/products/services';
import type { Product } from '@/db/schema';
import { colors, fontSize, spacing, touchTarget } from '@/theme';

type Load =
  { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; products: Product[] };

function describe(product: Product): string {
  if (!isPack(product.purchaseType))
    return `${purchaseTypeLabels[product.purchaseType]} · ${formatBRL(product.costCents)}`;
  const each = unitCostCents(product.costCents, product);
  const pack = `${purchaseTypeLabels[product.purchaseType]} · ${formatBRL(product.costCents)}`;
  return each === null ? pack : `${pack} (${formatBRL(each)} cada)`;
}

const ProductsScreen = () => {
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
        title="Não foi possível carregar os produtos"
        description={load.message}
        actionLabel="Tentar novamente"
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
        title="Nenhum produto cadastrado"
        description="Cadastre os produtos que você compra para lançar as compras do dia."
        actionLabel="Novo produto"
        onAction={() => router.push('/product')}
      />
    );
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.scroll}
      contentContainerStyle={styles.content}
    >
      <Card flush>
        {products.map((product, index) => (
          <Pressable
            key={product.id}
            accessibilityRole="button"
            accessibilityHint="Toque para editar"
            onPress={() => router.push({ pathname: '/product', params: { id: String(product.id) } })}
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
      <Button label="Novo produto" onPress={() => router.push('/product')} />
    </ScrollView>
  );
};

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

export default ProductsScreen;
