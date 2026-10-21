import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { MoneyInput } from '@/components/MoneyInput';
import { SegmentedChoice } from '@/components/SegmentedChoice';
import { LoadingState, StateMessage } from '@/components/StateMessage';
import { formatBRL } from '@/domain/money';
import { unitCostCents } from '@/domain/productCost';
import { productFormSchema } from '@/domain/validation';
import { createProduct, getProduct, setProductArchived, updateProduct } from '@/repositories/products';
import { colors, fontSize, radius, spacing, touchTarget } from '@/theme';

type PurchaseType = 'unit' | 'pack';
const TYPE_OPTIONS = [
  { value: 'unit', label: 'Por unidade' },
  { value: 'pack', label: 'Por pacote' },
] as const;

type Load = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready' };

/** Cadastro e edição de produto. Mudar o preço aqui não altera dias antigos. */
export default function ProdutoScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const productId = id ? Number.parseInt(id, 10) : null;
  const isEditing = productId !== null;

  const [load, setLoad] = useState<Load>(isEditing ? { status: 'loading' } : { status: 'ready' });
  const [name, setName] = useState('');
  const [purchaseType, setPurchaseType] = useState<PurchaseType>('unit');
  const [costCents, setCostCents] = useState(0);
  const [unitsText, setUnitsText] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (productId === null) return;
    getProduct(productId)
      .then((product) => {
        if (!product) {
          setLoad({ status: 'error', message: 'Esse produto não existe mais.' });
          return;
        }
        setName(product.name);
        setPurchaseType(product.purchaseType);
        setCostCents(product.costCents);
        setUnitsText(product.unitsPerPack ? String(product.unitsPerPack) : '');
        setLoad({ status: 'ready' });
      })
      .catch((e: unknown) =>
        setLoad({ status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido' }),
      );
  }, [productId]);

  if (load.status === 'loading') return <LoadingState />;
  if (load.status === 'error') {
    return (
      <StateMessage
        title="Não deu para abrir o produto"
        description={load.message}
        actionLabel="Voltar"
        onAction={() => router.back()}
      />
    );
  }

  const unitsPerPack = unitsText === '' ? null : Number.parseInt(unitsText, 10);
  const each =
    purchaseType === 'pack' && costCents > 0
      ? unitCostCents(costCents, { purchaseType, unitsPerPack })
      : null;

  async function submit() {
    const parsed = productFormSchema.safeParse({ name, purchaseType, costCents, unitsPerPack });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Confira os valores');
      return;
    }
    setError(undefined);
    setSaving(true);
    try {
      if (productId === null) await createProduct(parsed.data);
      else await updateProduct(productId, parsed.data);
      router.back();
    } catch {
      // Mantém o que foi digitado para tentar de novo
      setError('Não deu para salvar. O que você digitou continua aqui; tente de novo.');
      setSaving(false);
    }
  }

  function confirmArchive() {
    if (productId === null) return;
    Alert.alert(
      'Arquivar produto?',
      'Ele some da lista de compras, mas continua aparecendo nos dias em que você o comprou.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Arquivar',
          style: 'destructive',
          onPress: () => {
            setProductArchived(productId, true)
              .then(() => router.back())
              .catch(() => setError('Não deu para arquivar. Tente de novo.'));
          },
        },
      ],
    );
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      style={styles.scroll}
      contentContainerStyle={styles.content}
    >
      <Stack.Screen options={{ title: isEditing ? 'Editar produto' : 'Novo produto' }} />

      <View style={styles.field}>
        <Text style={styles.label}>Nome</Text>
        <TextInput
          value={name}
          onChangeText={(text) => {
            setName(text);
            setError(undefined);
          }}
          placeholder="Coco verde"
          placeholderTextColor={colors.textMuted}
          maxLength={60}
          autoCapitalize="sentences"
          style={styles.input}
          accessibilityLabel="Nome"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Como você compra?</Text>
        <SegmentedChoice options={TYPE_OPTIONS} value={purchaseType} onChange={setPurchaseType} />
      </View>

      <MoneyInput
        label={purchaseType === 'pack' ? 'Custo do pacote' : 'Custo da unidade'}
        valueCents={costCents}
        onChangeCents={(next) => {
          setCostCents(next);
          setError(undefined);
        }}
      />

      {purchaseType === 'pack' ? (
        <View style={styles.field}>
          <Text style={styles.label}>Unidades por pacote (opcional)</Text>
          <TextInput
            value={unitsText}
            onChangeText={(text) => setUnitsText(text.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            inputMode="numeric"
            placeholder="50"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            accessibilityLabel="Unidades por pacote"
          />
          <Text style={styles.hint}>Com isso o app mostra quanto custa cada unidade.</Text>
        </View>
      ) : null}

      {each !== null ? (
        <Card>
          <View style={styles.eachRow}>
            <Text style={styles.eachLabel}>Cada unidade custa</Text>
            <Text selectable style={styles.eachValue}>
              {formatBRL(each)}
            </Text>
          </View>
        </Card>
      ) : null}

      {isEditing ? (
        <Text style={styles.hint}>Mudar o preço aqui não altera os dias que já passaram.</Text>
      ) : null}

      {error ? (
        <Text selectable style={styles.error}>
          {error}
        </Text>
      ) : null}
      <Button label={isEditing ? 'Salvar alterações' : 'Cadastrar produto'} onPress={submit} loading={saving} />
      {isEditing ? <Button label="Arquivar produto" variant="secondary" onPress={confirmArchive} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
  field: { gap: spacing.xs },
  label: { fontSize: fontSize.small, fontWeight: '600', color: colors.textMuted },
  input: {
    minHeight: touchTarget + spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.body,
    color: colors.text,
  },
  hint: { fontSize: fontSize.small, color: colors.textMuted },
  eachRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eachLabel: { fontSize: fontSize.body, color: colors.textMuted },
  eachValue: { fontSize: fontSize.title, fontWeight: '800', color: colors.primaryDark, fontVariant: ['tabular-nums'] },
  error: { fontSize: fontSize.small, color: colors.danger },
});
