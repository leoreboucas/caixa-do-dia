import type { DatabaseSync } from 'node:sqlite';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as clientModule from '@/db/client';
import * as productService from './productService';

vi.mock('@/db/client', async () => (await import('@/db/testClient')).createTestClient());

const sqlite = (clientModule as unknown as { __sqlite: DatabaseSync }).__sqlite;

beforeEach(() => {
  sqlite.exec('DELETE FROM closing_items; DELETE FROM daily_closings; DELETE FROM products;');
});

const doce = { name: 'Doce de banana', purchaseType: 'pack', costCents: 2500, unitsPerPack: 50 } as const;
const coco = { name: 'Coco', purchaseType: 'unit', costCents: 300, unitsPerPack: null } as const;

describe('produtos', () => {
  it('cria, lista em ordem alfabética e esconde os arquivados', async () => {
    const d = await productService.createProduct(doce);
    await productService.createProduct(coco);
    await productService.createProduct({
      name: 'Amendoim',
      purchaseType: 'pack',
      costCents: 1800,
      unitsPerPack: null,
    });

    expect((await productService.listActiveProducts()).map((p) => p.name)).toEqual([
      'Amendoim',
      'Coco',
      'Doce de banana',
    ]);

    await productService.setProductArchived(d.id, true);
    expect((await productService.listActiveProducts()).map((p) => p.name)).toEqual(['Amendoim', 'Coco']);

    expect((await productService.getProduct(d.id))?.archived).toBe(true);
  });
});
