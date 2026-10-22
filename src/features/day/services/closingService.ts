import { and, asc, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { closingItems, dailyClosings, type ClosingItem, type DailyClosing, type Product } from '@/db/schema';
import { finalCashCents, grossFromFinalCashCents, type DateKey } from '@/features/shared/utils';
import type { CloseDayValues, OpenDayValues } from '@/features/day/validators';
import { ClosingStatus, isClosed } from '@/features/shared/definitions';

export type ClosingWithItems = DailyClosing & { items: ClosingItem[] };

export async function getClosingByDate(date: DateKey): Promise<ClosingWithItems | null> {
  const row = await db.query.dailyClosings.findFirst({
    where: eq(dailyClosings.date, date),
    with: { items: true },
  });
  return row ?? null;
}

async function getClosingById(id: number): Promise<ClosingWithItems | null> {
  const row = await db.query.dailyClosings.findFirst({
    where: eq(dailyClosings.id, id),
    with: { items: true },
  });
  return row ?? null;
}

export async function listClosingsBetween(from: DateKey, to: DateKey): Promise<ClosingWithItems[]> {
  return db.query.dailyClosings.findMany({
    where: and(gte(dailyClosings.date, from), lte(dailyClosings.date, to)),
    with: { items: true },
    orderBy: desc(dailyClosings.date),
  });
}

export async function listClosingDates(): Promise<DateKey[]> {
  const rows = await db
    .select({ date: dailyClosings.date })
    .from(dailyClosings)
    .orderBy(asc(dailyClosings.date));
  return rows.map((row) => row.date);
}

export async function openDay(values: OpenDayValues): Promise<ClosingWithItems> {
  await db
    .insert(dailyClosings)
    .values({ date: values.date, openingCashCents: values.openingCashCents, status: ClosingStatus.OPEN })
    .onConflictDoNothing({ target: dailyClosings.date });
  const closing = await getClosingByDate(values.date);
  if (!closing) throw new Error('Não foi possível abrir o dia');
  return closing;
}

export async function updateOpeningCash(closingId: number, openingCashCents: number): Promise<void> {
  const closing = await getClosingById(closingId);
  if (!closing) throw new Error('Dia não encontrado');

  let grossSalesCents = closing.grossSalesCents;
  if (isClosed(closing.status) && grossSalesCents !== null) {
    const finalCash = finalCashCents(closing.openingCashCents, grossSalesCents);
    grossSalesCents = grossFromFinalCashCents(finalCash, openingCashCents);
    if (grossSalesCents < 0) throw new Error('O caixa inicial não pode ser maior que o caixa final.');
  }

  await db
    .update(dailyClosings)
    .set({ openingCashCents, grossSalesCents })
    .where(eq(dailyClosings.id, closingId));
}

export async function closeDay(closingId: number, values: CloseDayValues): Promise<void> {
  await db
    .update(dailyClosings)
    .set({
      grossSalesCents: values.grossSalesCents,
      note: values.note ?? null,
      status: ClosingStatus.CLOSED,
    })
    .where(eq(dailyClosings.id, closingId));
}

export async function deleteClosing(closingId: number): Promise<void> {
  await db.delete(dailyClosings).where(eq(dailyClosings.id, closingId));
}

export async function addItem(input: {
  closingId: number;
  product: Pick<Product, 'id' | 'name' | 'purchaseType' | 'unitsPerPack' | 'costCents'>;
  quantity: number;

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
