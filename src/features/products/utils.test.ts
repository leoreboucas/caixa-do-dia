import { describe, expect, it } from 'vitest';
import { unitCostCents } from './utils';

describe('unitCostCents', () => {
  it('unidade: o custo já é o da unidade (coco)', () => {
    expect(unitCostCents(300, { purchaseType: 'unit', unitsPerPack: null })).toBe(300);
  });

  it('pacote com unidades por pacote: divide (doce de banana, R$ 25 / 50 = R$ 0,50)', () => {
    expect(unitCostCents(2500, { purchaseType: 'pack', unitsPerPack: 50 })).toBe(50);
  });

  it('não arredonda: guarda a fração', () => {
    const cost = unitCostCents(1000, { purchaseType: 'pack', unitsPerPack: 30 });
    expect(cost).toBeCloseTo(33.333, 3);
  });

  it('pacote sem unidades por pacote: sem custo unitário', () => {
    expect(unitCostCents(2500, { purchaseType: 'pack', unitsPerPack: null })).toBeNull();
  });

  it('ignora unidades por pacote inválido (0)', () => {
    expect(unitCostCents(2500, { purchaseType: 'pack', unitsPerPack: 0 })).toBeNull();
  });
});
