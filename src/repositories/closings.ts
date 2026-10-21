import { and, asc, desc, eq, gt, gte, lt, lte, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  closingItems,
  dailyClosings,
  type ClosingItem,
  type DailyClosing,
  type Product,
} from '@/db/schema';
import { suggestOpeningCashCents } from '@/domain/closing';
import type { DateKey } from '@/domain/date';
import type { CloseDayValues, OpenDayValues } from '@/domain/validation';

export type ClosingWithItems = DailyClosing & { items: ClosingItem[] };

export async function getClosingByDate(date: DateKey): Promise<ClosingWithItems | null> {
  const row = await db.query.dailyClosings.findFirst({
    where: eq(dailyClosings.date, date),
    with: { items: true },
  });
  return row ?? null;
}

export async function getClosingById(id: number): Promise<ClosingWithItems | null> {
  const row = await db.query.dailyClosings.findFirst({
    where: eq(dailyClosings.id, id),
    with: { items: true },
  });
  return row ?? null;
}

/** Fechamentos entre duas datas (inclusive), do mais recente para o mais antigo. Usado no histórico. */
export async function listClosingsBetween(from: DateKey, to: DateKey): Promise<ClosingWithItems[]> {
  return db.query.dailyClosings.findMany({
    where: and(gte(dailyClosings.date, from), lte(dailyClosings.date, to)),
    with: { items: true },
    orderBy: desc(dailyClosings.date),
  });
}

/**
 * Caixa inicial sugerido para `date`: caixa final do dia fechado mais recente anterior.
 * null no primeiro uso do app.
 */
export async function getSuggestedOpeningCash(date: DateKey): Promise<number | null> {
  const previous = await db.query.dailyClosings.findFirst({
    where: and(eq(dailyClosings.status, 'closed'), lt(dailyClosings.date, date)),
    orderBy: desc(dailyClosings.date),
    with: { items: true },
  });
  if (!previous) return null;
  return suggestOpeningCashCents(date, [previous]);
}

/** Quantos dias posteriores existem. Se > 0, editar este dia pode deixar o caixa deles defasado. */
export async function countClosingsAfter(date: DateKey): Promise<number> {
  const rows = await db
    .select({ total: sql<number>`count(*)` })
    .from(dailyClosings)
    .where(gt(dailyClosings.date, date));
  return rows[0]?.total ?? 0;
}

/** Abre o dia. Se já existir fechamento nessa data, devolve o existente sem alterar nada. */
export async function openDay(values: OpenDayValues): Promise<ClosingWithItems> {
  await db
    .insert(dailyClosings)
    .values({ date: values.date, openingCashCents: values.openingCashCents, status: 'open' })
    .onConflictDoNothing({ target: dailyClosings.date });
  const closing = await getClosingByDate(values.date);
  if (!closing) throw new Error('Não foi possível abrir o dia');
  return closing;
}

export async function updateOpeningCash(closingId: number, openingCashCents: number): Promise<void> {
  await db.update(dailyClosings).set({ openingCashCents }).where(eq(dailyClosings.id, closingId));
}

/** Registra a venda total do dia e fecha. Também serve para corrigir um dia já fechado. */
export async function closeDay(closingId: number, values: CloseDayValues): Promise<void> {
  await db
    .update(dailyClosings)
    .set({
      grossSalesCents: values.grossSalesCents,
      note: values.note ?? null,
      status: 'closed',
    })
    .where(eq(dailyClosings.id, closingId));
}

export async function deleteClosing(closingId: number): Promise<void> {
  // closing_items some junto (ON DELETE CASCADE)
  await db.delete(dailyClosings).where(eq(dailyClosings.id, closingId));
}

/**
 * Adiciona um produto ao fechamento, congelando nome, tipo, unidades por pacote e custo.
 * Se o produto já está no dia, soma a quantidade e mantém o custo daquele dia.
 */
export async function addItem(input: {
  closingId: number;
  product: Pick<Product, 'id' | 'name' | 'purchaseType' | 'unitsPerPack' | 'costCents'>;
  quantity: number;
  /** Se omitido, usa o custo atual do cadastro. Editar aqui NÃO altera o produto. */
  unitCostCents?: number;
}): Promise<void> {
  const { closingId, product, quantity } = input;
  await db
    .insert(closingItems)
    .values({
      closingId,
      productId: product.id,
      productName: product.name,
      purchaseType: product.purchaseType,
      unitsPerPack: product.unitsPerPack,
      quantity,
      unitCostCents: input.unitCostCents ?? product.costCents,
    })
    .onConflictDoUpdate({
      target: [closingItems.closingId, closingItems.productId],
      set: { quantity: sql`${closingItems.quantity} + ${quantity}` },
    });
}

/** Corrige quantidade e/ou custo de UM item de UM dia. O cadastro do produto não é tocado. */
export async function updateItem(
  itemId: number,
  values: { quantity: number; unitCostCents: number },
): Promise<void> {
  await db
    .update(closingItems)
    .set({ quantity: values.quantity, unitCostCents: values.unitCostCents })
    .where(eq(closingItems.id, itemId));
}

export async function removeItem(itemId: number): Promise<void> {
  await db.delete(closingItems).where(eq(closingItems.id, itemId));
}

export async function listItems(closingId: number): Promise<ClosingItem[]> {
  return db
    .select()
    .from(closingItems)
    .where(eq(closingItems.closingId, closingId))
    .orderBy(asc(closingItems.productName));
}
