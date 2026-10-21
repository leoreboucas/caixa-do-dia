import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/Card';
import type { ClosingItem } from '@/db/schema';
import { itemTotalCents } from '@/domain/closing';
import { formatBRL } from '@/domain/money';
import { colors, fontSize, radius, spacing, touchTarget } from '@/theme';

interface Props {
  items: ClosingItem[];
  /** Custo atual do cadastro por produto; item com custo diferente ganha a etiqueta "custo de hoje". */
  currentCosts: Record<number, number>;
  emptyText: string;
  /** Se informado, cada linha vira um toque para editar quantidade e custo. */
  onPressItem?: (item: ClosingItem) => void;
}

function quantityText(item: ClosingItem): string {
  const unit = item.purchaseType === 'pack' ? (item.quantity === 1 ? 'pacote' : 'pacotes') : 'un.';
  return `${item.quantity} ${unit} × ${formatBRL(item.unitCostCents)}`;
}

export function DayItemsList({ items, currentCosts, emptyText, onPressItem }: Props) {
  if (items.length === 0) {
    return (
      <Card>
        <Text style={styles.empty}>{emptyText}</Text>
      </Card>
    );
  }
  return (
    <Card flush>
      {items.map((item, index) => {
        const current = currentCosts[item.productId];
        const customCost = current !== undefined && current !== item.unitCostCents;
        return (
          <Pressable
            key={item.id}
            accessibilityRole={onPressItem ? 'button' : undefined}
            accessibilityHint={onPressItem ? 'Toque para editar quantidade e custo' : undefined}
            disabled={!onPressItem}
            onPress={() => onPressItem?.(item)}
            style={({ pressed }) => [styles.row, index > 0 && styles.rowDivider, pressed && styles.pressed]}
          >
            <View style={styles.rowText}>
              <Text selectable style={styles.name}>
                {item.productName}
              </Text>
              <Text selectable style={styles.detail}>
                {quantityText(item)}
              </Text>
              {customCost ? (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>Custo de hoje, diferente do cadastro</Text>
                </View>
              ) : null}
            </View>
            <Text selectable style={styles.total}>
              {formatBRL(itemTotalCents(item))}
            </Text>
          </Pressable>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: touchTarget + spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.md,
  },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  pressed: { backgroundColor: colors.accentSoft },
  rowText: { flex: 1, gap: 2 },
  name: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  detail: { fontSize: fontSize.small, color: colors.textMuted, fontVariant: ['tabular-nums'] },
  tag: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  tagText: { fontSize: fontSize.caption, fontWeight: '600', color: colors.text },
  total: { fontSize: fontSize.body, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  empty: { fontSize: fontSize.small, color: colors.textMuted, lineHeight: 20 },
});
