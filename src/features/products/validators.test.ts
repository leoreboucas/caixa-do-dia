import { describe, expect, it } from 'vitest';
import { productFormSchema } from './validators';

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
    expect(productFormSchema.safeParse({ name: '  ', purchaseType: 'unit', costCents: 300 }).success).toBe(
      false,
    );
    expect(productFormSchema.safeParse({ name: 'Coco', purchaseType: 'unit', costCents: 0 }).success).toBe(
      false,
    );
    expect(
      productFormSchema.safeParse({ name: 'X', purchaseType: 'pack', costCents: 100, unitsPerPack: 0 })
        .success,
    ).toBe(false);
    expect(
      productFormSchema.safeParse({ name: 'X', purchaseType: 'pack', costCents: 100, unitsPerPack: 2.5 })
        .success,
    ).toBe(false);
  });
});
