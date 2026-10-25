import type { DatabaseSync } from 'node:sqlite';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as clientModule from '@/db/client';
import { db } from '@/db/client';
import { closingItems, dailyClosings, products } from '@/db/schema';
import * as backup from './backupService';

vi.mock('@/db/client', async () => (await import('@/db/testClient')).createTestClient());

const sqlite = (clientModule as unknown as { __sqlite: DatabaseSync }).__sqlite;

beforeEach(() => {
  sqlite.exec('DELETE FROM closing_items; DELETE FROM daily_closings; DELETE FROM products;');
});

const seed = async () => {
  await db.insert(products).values([
    { id: 1, name: 'Coco', purchaseType: 'unit', costCents: 300, unitsPerPack: null, archived: false },
    {
      id: 2,
      name: 'Doce de banana',
      purchaseType: 'pack',
      costCents: 2500,
      unitsPerPack: 50,
      archived: true,
    },
  ]);
  await db.insert(dailyClosings).values([
    {
      id: 10,
      date: '2026-10-20',
      openingCashCents: 8000,
      grossSalesCents: 32000,
      status: 'closed',
      note: 'Sol',
    },
    { id: 11, date: '2026-10-21', openingCashCents: 9000, grossSalesCents: null, status: 'open', note: null },
  ]);
  await db.insert(closingItems).values([
    {
      id: 100,
      closingId: 10,
      productId: 1,
      productName: 'Coco',
      purchaseType: 'unit',
      unitsPerPack: null,
      quantity: 30,
      unitCostCents: 300,
    },
    {
      id: 101,
      closingId: 11,
      productId: 2,
      productName: 'Doce de banana',
      purchaseType: 'pack',
      unitsPerPack: 50,
      quantity: 2,
      unitCostCents: 2500,
    },
  ]);
};

describe('createBackup', () => {
  it('reúne produtos, dias e compras', async () => {
    await seed();

    const data = await backup.createBackup();

    expect(data.version).toBe(1);
    expect(data.products).toHaveLength(2);
    expect(data.closings).toHaveLength(2);
    expect(data.items).toHaveLength(2);
    expect(data.products[1]).toMatchObject({ name: 'Doce de banana', archived: true });
  });

  it('funciona com o banco vazio', async () => {
    const data = await backup.createBackup();

    expect(data).toMatchObject({ products: [], closings: [], items: [] });
  });
});

describe('restoreBackup', () => {
  it('devolve exatamente os dados do backup, mesmo depois de tudo ser apagado', async () => {
    await seed();
    const data = await backup.createBackup();
    sqlite.exec('DELETE FROM closing_items; DELETE FROM daily_closings; DELETE FROM products;');

    await backup.restoreBackup(JSON.parse(JSON.stringify(data)));

    expect(await backup.createBackup()).toEqual({ ...data, exportedAt: expect.any(String) });
  });

  it('troca os dados atuais pelos do backup', async () => {
    await seed();
    const data = await backup.createBackup();
    await db.insert(products).values({
      id: 3,
      name: 'Amendoim',
      purchaseType: 'pack',
      costCents: 1800,
      unitsPerPack: null,
      archived: false,
    });

    await backup.restoreBackup(JSON.parse(JSON.stringify(data)));

    const names = (await db.select().from(products)).map((product) => product.name);
    expect(names).toEqual(['Coco', 'Doce de banana']);
  });

  it('aceita muitas compras de uma vez', async () => {
    await seed();
    const data = await backup.createBackup();
    const manyClosings = Array.from({ length: 350 }, (_, index) => ({
      ...data.closings[0]!,
      id: 1000 + index,
      date: `2027-day-${index}`,
    }));
    const manyItems = manyClosings.map((closing, index) => ({
      ...data.items[0]!,
      id: 5000 + index,
      closingId: closing.id,
    }));

    await backup.restoreBackup({ ...data, closings: manyClosings, items: manyItems });

    expect(await db.select().from(closingItems)).toHaveLength(350);
  });

  it('recusa um arquivo inválido sem mexer nos dados', async () => {
    await seed();

    await expect(backup.restoreBackup({ version: 1 })).rejects.toThrow();
    await expect(backup.restoreBackup('texto qualquer')).rejects.toThrow();

    expect(await db.select().from(products)).toHaveLength(2);
  });

  it('recusa um arquivo com compras ligadas a dias que não existem', async () => {
    await seed();
    const data = await backup.createBackup();
    const broken = { ...data, items: [{ ...data.items[0]!, closingId: 999 }] };

    await expect(backup.restoreBackup(broken)).rejects.toThrow('não existem');

    expect(await db.select().from(dailyClosings)).toHaveLength(2);
  });

  it('recusa uma versão de backup desconhecida', async () => {
    const data = await backup.createBackup();

    await expect(backup.restoreBackup({ ...data, version: 2 })).rejects.toThrow();
  });
});
