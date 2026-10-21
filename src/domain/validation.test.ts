import { describe, expect, it } from 'vitest';
import {
  closeDaySchema,
  closingItemFormSchema,
  openDaySchema,
  productFormSchema,
} from './validation';

describe('productFormSchema', () => {
  it('aceita pacote com unidades por pacote', () => {
    const r = productFormSchema.safeParse({
      name: '  Doce de banana ',
      purchaseType: 'pack',
      costCents: 2500,
      unitsPerPack: 50,
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data).toEqual({
        name: 'Doce de banana',
        purchaseType: 'pack',
        costCents: 2500,
        unitsPerPack: 50,
      });
    }
  });

  it('pacote pode ficar sem unidades por pacote (opcional)', () => {
    const r = productFormSchema.safeParse({ name: 'Amendoim', purchaseType: 'pack', costCents: 1800 });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.unitsPerPack).toBeNull();
  });

  it('unidade zera unidades por pacote mesmo se vier preenchido', () => {
    const r = productFormSchema.safeParse({
      name: 'Coco',
      purchaseType: 'unit',
      costCents: 300,
      unitsPerPack: 12,
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.unitsPerPack).toBeNull();
  });

  it('rejeita nome vazio, custo zero e unidades por pacote inválidas', () => {
    expect(productFormSchema.safeParse({ name: '  ', purchaseType: 'unit', costCents: 300 }).success).toBe(false);
    expect(productFormSchema.safeParse({ name: 'Coco', purchaseType: 'unit', costCents: 0 }).success).toBe(false);
    expect(
      productFormSchema.safeParse({ name: 'X', purchaseType: 'pack', costCents: 100, unitsPerPack: 0 }).success,
    ).toBe(false);
    expect(
      productFormSchema.safeParse({ name: 'X', purchaseType: 'pack', costCents: 100, unitsPerPack: 2.5 }).success,
    ).toBe(false);
  });
});

describe('closingItemFormSchema', () => {
  it('aceita item válido', () => {
    expect(closingItemFormSchema.safeParse({ productId: 1, quantity: 2, unitCostCents: 2500 }).success).toBe(true);
  });

  it('rejeita quantidade 0 ou fracionária e custo 0', () => {
    expect(closingItemFormSchema.safeParse({ productId: 1, quantity: 0, unitCostCents: 2500 }).success).toBe(false);
    expect(closingItemFormSchema.safeParse({ productId: 1, quantity: 1.5, unitCostCents: 2500 }).success).toBe(false);
    expect(closingItemFormSchema.safeParse({ productId: 1, quantity: 1, unitCostCents: 0 }).success).toBe(false);
  });
});

describe('openDaySchema / closeDaySchema', () => {
  it('abrir dia: data válida e caixa inicial >= 0 (zero é permitido)', () => {
    expect(openDaySchema.safeParse({ date: '2026-10-20', openingCashCents: 0 }).success).toBe(true);
    expect(openDaySchema.safeParse({ date: '2026-02-30', openingCashCents: 0 }).success).toBe(false);
    expect(openDaySchema.safeParse({ date: '2026-10-20', openingCashCents: -1 }).success).toBe(false);
  });

  it('fechar dia: venda >= 0', () => {
    expect(closeDaySchema.safeParse({ grossSalesCents: 30000 }).success).toBe(true);
    expect(closeDaySchema.safeParse({ grossSalesCents: -5 }).success).toBe(false);
  });
});
