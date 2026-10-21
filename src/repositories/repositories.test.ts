/**
 * Testa os repositórios contra um SQLite REAL em memória (node:sqlite), aplicando as
 * mesmas migrations .sql que o app usa. Só o "driver" muda (no app é expo-sqlite).
 * Requer Node >= 22.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/db/client', async () => {
  const { DatabaseSync } = await import('node:sqlite');
  const { drizzle } = await import('drizzle-orm/sqlite-proxy');
  const schema = await import('@/db/schema');

  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON;');

  const migrationsDir = join(process.cwd(), 'src/db/migrations');
  for (const file of readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()) {
    for (const statement of readFileSync(join(migrationsDir, file), 'utf8').split('--> statement-breakpoint')) {
      if (statement.trim()) sqlite.exec(statement);
    }
  }

  const clean = (params: unknown[]) =>
    params.map((p) => (typeof p === 'boolean' ? Number(p) : p)) as (string | number | null)[];

  const db = drizzle(
    async (query, params, method) => {
      const stmt = sqlite.prepare(query);
      if (method === 'run') {
        stmt.run(...clean(params));
        return { rows: [] };
      }
      if (method === 'get') {
        const row = stmt.get(...clean(params)) as Record<string, unknown> | undefined;
        return { rows: row ? Object.values(row) : undefined } as { rows: unknown[] };
      }
      const rows = stmt.all(...clean(params)) as Record<string, unknown>[];
      return { rows: rows.map((r) => Object.values(r)) };
    },
    { schema },
  );

  return { db, __sqlite: sqlite };
});

import * as clientModule from '@/db/client';
import * as closings from './closings';
import * as productsRepo from './products';
import { summarizeClosing } from '@/domain/closing';

const sqlite = (clientModule as unknown as { __sqlite: import('node:sqlite').DatabaseSync }).__sqlite;

beforeEach(() => {
  sqlite.exec('DELETE FROM closing_items; DELETE FROM daily_closings; DELETE FROM products;');
});

const doce = { name: 'Doce de banana', purchaseType: 'pack', costCents: 2500, unitsPerPack: 50 } as const;
const coco = { name: 'Coco', purchaseType: 'unit', costCents: 300, unitsPerPack: null } as const;

describe('produtos', () => {
  it('cria, lista em ordem alfabética e esconde os arquivados', async () => {
    const d = await productsRepo.createProduct(doce);
    await productsRepo.createProduct(coco);
    await productsRepo.createProduct({ name: 'Amendoim', purchaseType: 'pack', costCents: 1800, unitsPerPack: null });

    expect((await productsRepo.listActiveProducts()).map((p) => p.name)).toEqual(['Amendoim', 'Coco', 'Doce de banana']);

    await productsRepo.setProductArchived(d.id, true);
    expect((await productsRepo.listActiveProducts()).map((p) => p.name)).toEqual(['Amendoim', 'Coco']);
    // arquivado continua existindo (histórico)
    expect((await productsRepo.getProduct(d.id))?.archived).toBe(true);
  });
});

describe('fechamento do dia', () => {
  it('abrir o mesmo dia duas vezes não duplica nem sobrescreve o caixa inicial', async () => {
    const first = await closings.openDay({ date: '2026-10-20', openingCashCents: 5000 });
    const second = await closings.openDay({ date: '2026-10-20', openingCashCents: 99999 });
    expect(second.id).toBe(first.id);
    expect(second.openingCashCents).toBe(5000);
    expect(second.status).toBe('open');
  });

  it('adicionar item congela snapshot e custo; repetir o produto soma a quantidade', async () => {
    const product = await productsRepo.createProduct(doce);
    const day = await closings.openDay({ date: '2026-10-20', openingCashCents: 5000 });

    await closings.addItem({ closingId: day.id, product, quantity: 2 });
    await closings.addItem({ closingId: day.id, product, quantity: 1, unitCostCents: 9999 });

    const items = await closings.listItems(day.id);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      productName: 'Doce de banana',
      purchaseType: 'pack',
      unitsPerPack: 50,
      quantity: 3, // 2 + 1
      unitCostCents: 2500, // mantém o custo do dia (o 9999 do 2º add é ignorado)
    });
  });

  it('mudar o preço do cadastro NÃO altera o fechamento antigo', async () => {
    const product = await productsRepo.createProduct(doce);
    const day = await closings.openDay({ date: '2026-10-20', openingCashCents: 0 });
    await closings.addItem({ closingId: day.id, product, quantity: 2 });

    await productsRepo.updateProduct(product.id, { ...doce, name: 'Doce de banana (novo)', costCents: 3000 });

    const [item] = await closings.listItems(day.id);
    expect(item?.unitCostCents).toBe(2500);
    expect(item?.productName).toBe('Doce de banana');
  });

  it('corrigir o custo dentro do fechamento NÃO altera o cadastro do produto', async () => {
    const product = await productsRepo.createProduct(doce);
    const day = await closings.openDay({ date: '2026-10-20', openingCashCents: 0 });
    await closings.addItem({ closingId: day.id, product, quantity: 2 });
    const [item] = await closings.listItems(day.id);

    await closings.updateItem(item!.id, { quantity: 4, unitCostCents: 2800 });

    const [after] = await closings.listItems(day.id);
    expect(after).toMatchObject({ quantity: 4, unitCostCents: 2800 });
    expect((await productsRepo.getProduct(product.id))?.costCents).toBe(2500);
  });

  it('fecha o dia e o resumo bate com o cenário (bruto 300, despesas 140, líquido 160)', async () => {
    const d = await productsRepo.createProduct(doce);
    const c = await productsRepo.createProduct(coco);
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
      finalCashCents: 21000,
    });
  });

  it('remove item e apagar o dia apaga os itens junto (cascade)', async () => {
    const product = await productsRepo.createProduct(doce);
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
    const product = (await productsRepo.listActiveProducts())[0] ?? (await productsRepo.createProduct(doce));
    const day = await closings.openDay({ date, openingCashCents: opening });
    await closings.addItem({ closingId: day.id, product, quantity: 1 }); // despesa 2500
    if (close) await closings.closeDay(day.id, { grossSalesCents: gross ?? 0 });
    return day;
  }

  it('sugere o caixa final do último dia fechado anterior', async () => {
    await seedDay('2026-10-18', 5000, 20000, true); // final = 5000 + 20000 - 2500 = 22500
    await seedDay('2026-10-19', 22500, 30000, true); // final = 22500 + 30000 - 2500 = 50000
    await seedDay('2026-10-20', 50000, null, false); // aberto: ignorado

    expect(await closings.getSuggestedOpeningCash('2026-10-21')).toBe(50000);
    expect(await closings.getSuggestedOpeningCash('2026-10-19')).toBe(22500);
    expect(await closings.getSuggestedOpeningCash('2026-10-18')).toBeNull();
  });

  it('lista por período (mais recente primeiro) já com os itens', async () => {
    await seedDay('2026-10-18', 0, 1000, true);
    await seedDay('2026-10-19', 0, 1000, true);
    await seedDay('2026-11-02', 0, 1000, true);

    const october = await closings.listClosingsBetween('2026-10-01', '2026-10-31');
    expect(october.map((c) => c.date)).toEqual(['2026-10-19', '2026-10-18']);
    expect(october[0]?.items).toHaveLength(1);
  });

  it('conta dias posteriores (aviso de caixa defasado ao editar dia antigo)', async () => {
    await seedDay('2026-10-18', 0, 1000, true);
    await seedDay('2026-10-19', 0, 1000, true);
    await seedDay('2026-10-20', 0, 1000, true);
    expect(await closings.countClosingsAfter('2026-10-18')).toBe(2);
    expect(await closings.countClosingsAfter('2026-10-20')).toBe(0);
  });
});
