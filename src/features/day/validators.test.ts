import { describe, expect, it } from 'vitest';
import { closeDaySchema, closingItemFormSchema, openDaySchema } from './validators';

describe('closingItemFormSchema', () => {
  it('aceita item válido', () => {
    expect(closingItemFormSchema.safeParse({ productId: 1, quantity: 2, unitCostCents: 2500 }).success).toBe(
      true,
    );
  });

  it('rejeita quantidade 0 ou fracionária e custo 0', () => {
    expect(closingItemFormSchema.safeParse({ productId: 1, quantity: 0, unitCostCents: 2500 }).success).toBe(
      false,
    );
    expect(
      closingItemFormSchema.safeParse({ productId: 1, quantity: 1.5, unitCostCents: 2500 }).success,
    ).toBe(false);
    expect(closingItemFormSchema.safeParse({ productId: 1, quantity: 1, unitCostCents: 0 }).success).toBe(
      false,
    );
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
