import { describe, expect, it } from 'vitest';
import {
  addMonths,
  buildMonthReport,
  expensesByProduct,
  formatMonthBR,
  listMonthReports,
  sumMonthReports,
  type ReportClosing,
} from './utils';

const day = (
  date: string,
  gross: number | null,
  items: { name: string; quantity: number; cost: number }[] = [],
  status: 'open' | 'closed' = 'closed',
): ReportClosing => ({
  date,
  status,
  openingCashCents: 10000,
  grossSalesCents: gross,
  items: items.map((i) => ({ productName: i.name, quantity: i.quantity, unitCostCents: i.cost })),
});

const closings: ReportClosing[] = [
  day('2026-10-20', 28000, [{ name: 'Coco', quantity: 30, cost: 300 }]),
  day('2026-10-19', 9500, [
    { name: 'Coco', quantity: 20, cost: 300 },
    { name: 'Amendoim', quantity: 2, cost: 1500 },
  ]),
  day('2026-10-21', null, [{ name: 'Coco', quantity: 10, cost: 300 }], 'open'),
  day('2026-09-30', 20000, [{ name: 'Doce', quantity: 1, cost: 5000 }]),
];

describe('formatMonthBR / addMonths', () => {
  it('formata o mês em português', () => {
    expect(formatMonthBR('2026-10')).toBe('Outubro de 2026');
    expect(formatMonthBR('2026-03')).toBe('Março de 2026');
  });

  it('anda entre meses, virando o ano', () => {
    expect(addMonths('2026-10', 1)).toBe('2026-11');
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
  });
});

describe('buildMonthReport', () => {
  it('soma só os dias fechados do mês e conta os em aberto à parte', () => {
    const report = buildMonthReport('2026-10', closings);
    expect(report.totals.days).toBe(2);
    expect(report.totals.grossCents).toBe(37500);
    expect(report.totals.expensesCents).toBe(9000 + 9000);
    expect(report.totals.netCents).toBe(37500 - 18000);
    expect(report.openDays).toBe(1);
  });

  it('calcula média e melhor dia', () => {
    const report = buildMonthReport('2026-10', closings);
    expect(report.averageNetCents).toBe(Math.round(19500 / 2));
    expect(report.bestDay).toEqual({ date: '2026-10-20', netCents: 28000 - 9000 });
  });

  it('mês sem dia fechado não tem média nem melhor dia', () => {
    const report = buildMonthReport('2026-08', closings);
    expect(report.totals.days).toBe(0);
    expect(report.averageNetCents).toBeNull();
    expect(report.bestDay).toBeNull();
  });

  it('prejuízo aparece como líquido negativo', () => {
    const report = buildMonthReport('2026-10', [
      day('2026-10-19', 9500, [{ name: 'Coco', quantity: 40, cost: 300 }]),
    ]);
    expect(report.totals.netCents).toBe(9500 - 12000);
  });
});

describe('listMonthReports / sumMonthReports', () => {
  it('lista os meses do mais recente para o mais antigo', () => {
    expect(listMonthReports(closings).map((r) => r.month)).toEqual(['2026-10', '2026-09']);
  });

  it('soma todos os meses', () => {
    const total = sumMonthReports(listMonthReports(closings));
    expect(total.days).toBe(3);
    expect(total.grossCents).toBe(37500 + 20000);
    expect(total.netCents).toBe(37500 + 20000 - 18000 - 5000);
    expect(total.openDays).toBe(1);
  });
});

describe('expensesByProduct', () => {
  it('soma por produto em dias fechados, do maior gasto para o menor', () => {
    expect(expensesByProduct(closings)).toEqual([
      { productName: 'Coco', totalCents: 15000 },
      { productName: 'Doce', totalCents: 5000 },
      { productName: 'Amendoim', totalCents: 3000 },
    ]);
  });
});
