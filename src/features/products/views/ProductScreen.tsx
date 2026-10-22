import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  LoadingState,
  MoneyInput,
  PurchaseType,
  SegmentedChoice,
  StateMessage,
  Text,
  TextInput,
  formatBRL,
  isPack,
  purchaseTypeOptions,
} from '@/features/shared';
import { unitCostCents } from '@/features/products/utils';
import { productFormSchema } from '@/features/products/validators';
import { createProduct, getProduct, setProductArchived, updateProduct } from '@/features/products/services';
import { colors, fontSize, radius, spacing, touchTarget } from '@/theme';

type Load = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready' };

const ProductScreen = () => {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const productId = id ? Number.parseInt(id, 10) : null;
  const isEditing = productId !== null;

  const [load, setLoad] = useState<Load>(isEditing ? { status: 'loading' } : { status: 'ready' });
  const [name, setName] = useState('');
  const [purchaseType, setPurchaseType] = useState<PurchaseType>(PurchaseType.UNIT);
  const [costCents, setCostCents] = useState(0);
  const [unitsText, setUnitsText] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (productId === null) return;
    getProduct(productId)
      .then((product) => {
        if (!product) {
          setLoad({ status: 'error', message: 'Produto não encontrado.' });
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
        title="Não foi possível abrir o produto"
        description={load.message}
        actionLabel="Voltar"
        onAction={() => router.back()}
      />
    );
  }

  const unitsPerPack = unitsText === '' ? null : Number.parseInt(unitsText, 10);
  const each =
    isPack(purchaseType) && costCents > 0 ? unitCostCents(costCents, { purchaseType, unitsPerPack }) : null;

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
      setError('Não foi possível salvar. Tente novamente.');
      setSaving(false);
    }
  }

  function confirmArchive() {
    if (productId === null) return;
    Alert.alert(
      'Arquivar produto?',
      'O produto sai da lista de compras, mas continua nos dias em que foi comprado.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Arquivar',
          style: 'destructive',
          onPress: () => {
            setProductArchived(productId, true)
              .then(() => router.back())
              .catch(() => setError('Não foi possível arquivar. Tente novamente.'));
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
        <Text style={styles.label}>Tipo de compra</Text>
        <SegmentedChoice options={purchaseTypeOptions} value={purchaseType} onChange={setPurchaseType} />
      </View>

      <MoneyInput
        label={isPack(purchaseType) ? 'Custo do pacote' : 'Custo da unidade'}
        valueCents={costCents}
        onChangeCents={(next) => {
          setCostCents(next);
          setError(undefined);
        }}
      />

      {isPack(purchaseType) ? (
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
          <Text style={styles.hint}>Permite calcular o custo por unidade.</Text>
        </View>
      ) : null}

      {each !== null ? (
        <Card>
          <View style={styles.eachRow}>
            <Text style={styles.eachLabel}>Custo por unidade</Text>
            <Text selectable style={styles.eachValue}>
              {formatBRL(each)}
            </Text>
          </View>
        </Card>
      ) : null}

      {isEditing ? <Text style={styles.hint}>Alterar o custo não muda os dias anteriores.</Text> : null}

      {error ? (
        <Text selectable style={styles.error}>
          {error}
        </Text>
      ) : null}
      <Button
        label={isEditing ? 'Salvar alterações' : 'Cadastrar produto'}
        onPress={submit}
        loading={saving}
      />
      {isEditing ? <Button label="Arquivar produto" variant="secondary" onPress={confirmArchive} /> : null}
    </ScrollView>
  );
};

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
  eachRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.xs,
  },
  eachLabel: { fontSize: fontSize.body, color: colors.textMuted },
  eachValue: {
    fontSize: fontSize.title,
    fontWeight: '800',
    color: colors.primaryDark,
    fontVariant: ['tabular-nums'],
  },
  error: { fontSize: fontSize.small, color: colors.danger },
});

export default ProductScreen;
