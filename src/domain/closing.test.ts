import { describe, expect, it } from 'vitest';
import {
  finalCashCents,
  itemTotalCents,
  netCents,
  sumSummaries,
  suggestOpeningCashCents,
  summarizeClosing,
  totalExpensesCents,
  type ClosingLike,
} from './closing';

// Cenário: caixa inicial R$ 50, vendeu R$ 300,
// comprou 2 pacotes de doce de banana (R$ 25 cada) e 30 cocos (R$ 3 cada).
const items = [
  { quantity: 2, unitCostCents: 2500 },
  { quantity: 30, unitCostCents: 300 },
];

describe('cálculos do fechamento', () => {
  it('total de um item = quantidade x custo', () => {
    expect(itemTotalCents({ quantity: 2, unitCostCents: 2500 })).toBe(5000);
  });

  it('despesas = soma dos itens', () => {
    expect(totalExpensesCents(items)).toBe(5000 + 9000);
    expect(totalExpensesCents([])).toBe(0);
  });

  it('líquido = bruto - despesas (pode ser negativo)', () => {
    expect(netCents(30000, 14000)).toBe(16000);
    expect(netCents(5000, 14000)).toBe(-9000);
  });

  it('caixa final = caixa inicial + bruto - despesas (caixa inicial não é receita)', () => {
    expect(finalCashCents(5000, 30000, 14000)).toBe(21000);
  });

  it('summarizeClosing junta tudo', () => {
    expect(
      summarizeClosing({ openingCashCents: 5000, grossSalesCents: 30000, items }),
    ).toEqual({
      openingCashCents: 5000,
      grossCents: 30000,
      expensesCents: 14000,
      netCents: 16000,
      finalCashCents: 21000,
    });
  });

  it('dia aberto (venda ainda null) conta bruto como 0', () => {
    const s = summarizeClosing({ openingCashCents: 5000, grossSalesCents: null, items });
    expect(s.grossCents).toBe(0);
    expect(s.netCents).toBe(-14000);
  });

  it('o líquido não depende do caixa inicial', () => {
    const a = summarizeClosing({ openingCashCents: 0, grossSalesCents: 30000, items });
    const b = summarizeClosing({ openingCashCents: 99900, grossSalesCents: 30000, items });
    expect(a.netCents).toBe(b.netCents);
  });
});

describe('suggestOpeningCashCents', () => {
  const day = (
    date: string,
    status: 'open' | 'closed',
    opening: number,
    gross: number | null,
    itemList = [{ quantity: 1, unitCostCents: 1000 }],
  ): ClosingLike => ({
    date,
    status,
    openingCashCents: opening,
    grossSalesCents: gross,
    items: itemList,
  });

  const closings = [
    day('2026-10-18', 'closed', 5000, 20000), // final = 5000 + 20000 - 1000 = 24000
    day('2026-10-19', 'closed', 24000, 30000), // final = 24000 + 30000 - 1000 = 53000
    day('2026-10-20', 'open', 53000, null),
  ];

  it('usa o caixa final do dia fechado mais recente anterior à data', () => {
    expect(suggestOpeningCashCents('2026-10-21', closings)).toBe(53000);
  });

  it('ignora dias abertos e a própria data', () => {
    expect(suggestOpeningCashCents('2026-10-20', closings)).toBe(53000);
  });

  it('funciona ao lançar um dia passado (pega o anterior a ele)', () => {
    expect(suggestOpeningCashCents('2026-10-19', closings)).toBe(24000);
  });

  it('não depende da ordem da lista', () => {
    expect(suggestOpeningCashCents('2026-10-21', [...closings].reverse())).toBe(53000);
  });

  it('retorna null se não existir dia anterior (primeiro uso)', () => {
    expect(suggestOpeningCashCents('2026-10-18', closings)).toBeNull();
    expect(suggestOpeningCashCents('2026-10-18', [])).toBeNull();
  });
});

describe('sumSummaries', () => {
  it('soma o período', () => {
    const a = summarizeClosing({ openingCashCents: 0, grossSalesCents: 30000, items });
    const b = summarizeClosing({ openingCashCents: 0, grossSalesCents: 10000, items: [] });
    expect(sumSummaries([a, b])).toEqual({
      days: 2,
      grossCents: 40000,
      expensesCents: 14000,
      netCents: 26000,
    });
  });

  it('período vazio', () => {
    expect(sumSummaries([])).toEqual({ days: 0, grossCents: 0, expensesCents: 0, netCents: 0 });
  });
});
