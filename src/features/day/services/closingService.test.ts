import type { DatabaseSync } from 'node:sqlite';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as clientModule from '@/db/client';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { products, type Product } from '@/db/schema';
import { summarizeClosing } from '@/features/shared/utils';
import * as closings from './closingService';

vi.mock('@/db/client', async () => (await import('@/db/testClient')).createTestClient());

const createProduct = async (values: Omit<Product, 'id' | 'archived'>) =>
  (await db.insert(products).values(values).returning())[0] as Product;
const updateProduct = (id: number, values: Partial<Product>) =>
  db.update(products).set(values).where(eq(products.id, id));
const getProduct = async (id: number) => (await db.select().from(products).where(eq(products.id, id)))[0];
const listActiveProducts = () => db.select().from(products).where(eq(products.archived, false));

const sqlite = (clientModule as unknown as { __sqlite: DatabaseSync }).__sqlite;

beforeEach(() => {
  sqlite.exec('DELETE FROM closing_items; DELETE FROM daily_closings; DELETE FROM products;');
});

const doce = { name: 'Doce de banana', purchaseType: 'pack', costCents: 2500, unitsPerPack: 50 } as const;
const coco = { name: 'Coco', purchaseType: 'unit', costCents: 300, unitsPerPack: null } as const;

describe('fechamento do dia', () => {
  it('abrir o mesmo dia duas vezes não duplica nem sobrescreve o caixa inicial', async () => {
    const first = await closings.openDay({ date: '2026-10-20', openingCashCents: 5000 });
    const second = await closings.openDay({ date: '2026-10-20', openingCashCents: 99999 });
    expect(second.id).toBe(first.id);
    expect(second.openingCashCents).toBe(5000);
    expect(second.status).toBe('open');
  });

  it('adicionar item congela snapshot e custo; repetir o produto soma a quantidade', async () => {
    const product = await createProduct(doce);
    const day = await closings.openDay({ date: '2026-10-20', openingCashCents: 5000 });

    await closings.addItem({ closingId: day.id, product, quantity: 2 });
    await closings.addItem({ closingId: day.id, product, quantity: 1, unitCostCents: 9999 });

    const items = await closings.listItems(day.id);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      productName: 'Doce de banana',
      purchaseType: 'pack',
      unitsPerPack: 50,
      quantity: 3,
      unitCostCents: 2500,
    });
  });

  it('mudar o preço do cadastro NÃO altera o fechamento antigo', async () => {
    const product = await createProduct(doce);
    const day = await closings.openDay({ date: '2026-10-20', openingCashCents: 0 });
    await closings.addItem({ closingId: day.id, product, quantity: 2 });

    await updateProduct(product.id, { ...doce, name: 'Doce de banana (novo)', costCents: 3000 });

    const [item] = await closings.listItems(day.id);
    expect(item?.unitCostCents).toBe(2500);
    expect(item?.productName).toBe('Doce de banana');
  });

  it('corrigir o custo dentro do fechamento NÃO altera o cadastro do produto', async () => {
    const product = await createProduct(doce);
    const day = await closings.openDay({ date: '2026-10-20', openingCashCents: 0 });
    await closings.addItem({ closingId: day.id, product, quantity: 2 });
    const [item] = await closings.listItems(day.id);

    await closings.updateItem(item!.id, { quantity: 4, unitCostCents: 2800 });

    const [after] = await closings.listItems(day.id);
    expect(after).toMatchObject({ quantity: 4, unitCostCents: 2800 });
    expect((await getProduct(product.id))?.costCents).toBe(2500);
  });

  it('fecha o dia e o resumo bate com o cenário (bruto 300, despesas 140, líquido 160)', async () => {
    const d = await createProduct(doce);
    const c = await createProduct(coco);
    const day = await closings.openDay({ date: '2026-10-20', openingCashCents: 5000 });
    await closings.addItem({ closingId: day.id, product: d, quantity: 2 });
    await closings.addItem({ closingId: day.id, product: c, quantity: 30 });
    await closings.closeDay(day.id, { grossSalesCents: 30000, note: 'Dia de sol' });

    const saved = await closings.getClosingByDate('2026-10-20');
    expect(saved).toMatchObject({ status: 'closed', grossSalesCents: 30000, note: 'Dia de sol' });
    expect(summarizeClosing(saved!)).toMatchObject({
      grossCents: 30000,
      expensesCents: 14000,
      netCents: 16000,
      finalCashCents: 35000,
    });
  });

  it('corrigir o caixa inicial de um dia aberto só troca o caixa inicial', async () => {
    const day = await closings.openDay({ date: '2026-10-20', openingCashCents: 2000 });
    await closings.updateOpeningCash(day.id, 8000);
    expect(await closings.getClosingByDate('2026-10-20')).toMatchObject({
      openingCashCents: 8000,
      grossSalesCents: null,
    });
  });

  it('corrigir o caixa inicial de um dia fechado mantém o caixa final contado', async () => {
    const day = await closings.openDay({ date: '2026-10-20', openingCashCents: 2000 });
    await closings.closeDay(day.id, { grossSalesCents: 38000 });

    await closings.updateOpeningCash(day.id, 8000);

    const saved = await closings.getClosingByDate('2026-10-20');
    expect(saved).toMatchObject({ openingCashCents: 8000, grossSalesCents: 32000 });
    expect(summarizeClosing(saved!).finalCashCents).toBe(40000);
  });

  it('não deixa o caixa inicial passar do caixa final contado', async () => {
    const day = await closings.openDay({ date: '2026-10-20', openingCashCents: 2000 });
    await closings.closeDay(day.id, { grossSalesCents: 3000 });

    await expect(closings.updateOpeningCash(day.id, 9000)).rejects.toThrow();
    expect(await closings.getClosingByDate('2026-10-20')).toMatchObject({ openingCashCents: 2000 });
  });

  it('remove item e apagar o dia apaga os itens junto (cascade)', async () => {
    const product = await createProduct(doce);
    const day = await closings.openDay({ date: '2026-10-20', openingCashCents: 0 });
    await closings.addItem({ closingId: day.id, product, quantity: 1 });
    const [item] = await closings.listItems(day.id);

    await closings.removeItem(item!.id);
    expect(await closings.listItems(day.id)).toHaveLength(0);

    await closings.addItem({ closingId: day.id, product, quantity: 1 });
    await closings.deleteClosing(day.id);
    const orphans = sqlite.prepare('SELECT COUNT(*) AS n FROM closing_items').get() as { n: number };
    expect(orphans.n).toBe(0);
  });
});

describe('histórico e sugestão de caixa', () => {
  async function seedDay(date: string, opening: number, gross: number | null, close: boolean) {
    const product = (await listActiveProducts())[0] ?? (await createProduct(doce));
    const day = await closings.openDay({ date, openingCashCents: opening });
    await closings.addItem({ closingId: day.id, product, quantity: 1 });
    if (close) await closings.closeDay(day.id, { grossSalesCents: gross ?? 0 });
    return day;
  }

  it('lista por período (mais recente primeiro) já com os itens', async () => {
    await seedDay('2026-10-18', 0, 1000, true);
    await seedDay('2026-10-19', 0, 1000, true);
    await seedDay('2026-11-02', 0, 1000, true);

    const october = await closings.listClosingsBetween('2026-10-01', '2026-10-31');
    expect(october.map((c) => c.date)).toEqual(['2026-10-19', '2026-10-18']);
    expect(october[0]?.items).toHaveLength(1);
  });
});
