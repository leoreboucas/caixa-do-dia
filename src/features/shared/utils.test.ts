import { describe, expect, it } from 'vitest';
import {
  addDays,
  centsFromDigits,
  finalCashCents,
  formatBRL,
  formatDateKeyBR,
  grossFromFinalCashCents,
  isValidDateKey,
  itemTotalCents,
  MAX_CENTS,
  multiplyCents,
  netCents,
  parseDateKey,
  startOfMonthKey,
  startOfWeekKey,
  summarizeClosing,
  sumSummaries,
  toDateKey,
  totalExpensesCents,
  weekdayNameBR,
} from './utils';

describe('toDateKey', () => {
  it('usa o dia LOCAL, mesmo à noite (sem virar o dia por causa do UTC)', () => {
    expect(toDateKey(new Date(2026, 9, 20, 23, 59))).toBe('2026-10-20');
    expect(toDateKey(new Date(2026, 0, 1, 0, 0))).toBe('2026-01-01');
  });
});

describe('isValidDateKey', () => {
  it('aceita datas reais', () => {
    expect(isValidDateKey('2026-10-20')).toBe(true);
    expect(isValidDateKey('2028-02-29')).toBe(true);
  });

  it('rejeita formato errado e datas inexistentes', () => {
    expect(isValidDateKey('20/10/2026')).toBe(false);
    expect(isValidDateKey('2026-13-01')).toBe(false);
    expect(isValidDateKey('2026-02-30')).toBe(false);
    expect(isValidDateKey('2027-02-29')).toBe(false);
    expect(isValidDateKey('')).toBe(false);
  });
});

describe('parseDateKey', () => {
  it('faz o caminho de ida e volta', () => {
    expect(toDateKey(parseDateKey('2026-10-20'))).toBe('2026-10-20');
  });

  it('lança erro para data inválida', () => {
    expect(() => parseDateKey('2026-02-30')).toThrow();
  });
});

describe('addDays', () => {
  it('atravessa fim de mês e de ano', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('formatDateKeyBR', () => {
  it('formata dd/mm/aaaa', () => {
    expect(formatDateKeyBR('2026-10-20')).toBe('20/10/2026');
  });
});

describe('períodos', () => {
  it('mês', () => {
    expect(startOfMonthKey('2026-10-20')).toBe('2026-10-01');
  });

  it('semana começando na segunda (20/10/2026 é terça)', () => {
    expect(startOfWeekKey('2026-10-20')).toBe('2026-10-19');

    expect(startOfWeekKey('2026-10-19')).toBe('2026-10-19');
    expect(startOfWeekKey('2026-10-25')).toBe('2026-10-19');
  });

  it('semana começando no domingo', () => {
    expect(startOfWeekKey('2026-10-20', 0)).toBe('2026-10-18');
  });
});

describe('weekdayNameBR', () => {
  it('devolve o dia da semana em português', () => {
    expect(weekdayNameBR('2026-10-20')).toBe('Terça');
    expect(weekdayNameBR('2026-10-18')).toBe('Domingo');
  });
});

describe('formatBRL', () => {
  it('formata valores simples', () => {
    expect(formatBRL(0)).toBe('R$ 0,00');
    expect(formatBRL(5)).toBe('R$ 0,05');
    expect(formatBRL(2550)).toBe('R$ 25,50');
  });

  it('usa ponto como separador de milhar', () => {
    expect(formatBRL(123456)).toBe('R$ 1.234,56');
    expect(formatBRL(100000000)).toBe('R$ 1.000.000,00');
  });

  it('formata negativos', () => {
    expect(formatBRL(-1500)).toBe('-R$ 15,00');
  });

  it('arredonda custo unitário fracionário só na exibição', () => {
    expect(formatBRL(1000 / 30)).toBe('R$ 0,33');
    expect(formatBRL(2500 / 50)).toBe('R$ 0,50');
  });

  it('não mostra "-R$ 0,00" para fração negativa minúscula', () => {
    expect(formatBRL(-0.2)).toBe('R$ 0,00');
  });
});

describe('centsFromDigits', () => {
  it('digitou 2500 -> 2500 centavos', () => {
    expect(centsFromDigits('2500')).toBe(2500);
  });

  it('ignora o que não é dígito', () => {
    expect(centsFromDigits('R$ 25,00')).toBe(2500);
    expect(centsFromDigits('abc')).toBe(0);
    expect(centsFromDigits('')).toBe(0);
  });

  it('limita ao valor máximo', () => {
    expect(centsFromDigits('99999999999999')).toBeLessThanOrEqual(MAX_CENTS);
  });
});

describe('multiplyCents', () => {
  it('multiplica quantidade pelo valor unitário', () => {
    expect(multiplyCents(2500, 3)).toBe(7500);
  });
});

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

  it('caixa final = caixa inicial + bruto (as compras não saem desta conta)', () => {
    expect(finalCashCents(5000, 30000)).toBe(35000);
  });

  it('bruto = caixa final contado - caixa inicial', () => {
    expect(grossFromFinalCashCents(35000, 5000)).toBe(30000);
    expect(grossFromFinalCashCents(5000, 5000)).toBe(0);
  });

  it('do caixa contado ao líquido: (caixa final - caixa inicial) - despesas', () => {
    const gross = grossFromFinalCashCents(35000, 5000);
    expect(netCents(gross, totalExpensesCents(items))).toBe(35000 - 5000 - 14000);
  });

  it('summarizeClosing junta tudo', () => {
    expect(summarizeClosing({ openingCashCents: 5000, grossSalesCents: 30000, items })).toEqual({
      openingCashCents: 5000,
      grossCents: 30000,
      expensesCents: 14000,
      netCents: 16000,
      finalCashCents: 35000,
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
