import { itemTotalCents, summarizeClosing, sumSummaries, type ClosingItemLike, type PeriodTotals } from './closing';
import type { Cents } from './money';
import type { DateKey } from './date';

/** 'YYYY-MM' */
export type MonthKey = string;

export interface ReportItem extends ClosingItemLike {
  productName: string;
}

export interface ReportClosing {
  date: DateKey;
  status: 'open' | 'closed';
  openingCashCents: Cents;
  grossSalesCents: Cents | null;
  items: ReportItem[];
}

export interface MonthReport {
  month: MonthKey;
  /** Só dias FECHADOS entram nos totais */
  totals: PeriodTotals;
  /** Dias lançados que ainda faltam fechar (não entram nos totais) */
  openDays: number;
  /** Líquido médio por dia fechado; null se não houver dia fechado */
  averageNetCents: Cents | null;
  /** Dia fechado com maior líquido; null se não houver dia fechado */
  bestDay: { date: DateKey; netCents: Cents } | null;
}

export interface ProductExpense {
  productName: string;
  totalCents: Cents;
}

const MONTHS_BR = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const;

export function monthKeyOf(date: DateKey): MonthKey {
  return date.slice(0, 7);
}

/** '2026-10' -> 'Outubro de 2026' */
export function formatMonthBR(month: MonthKey): string {
  const [year, monthNumber] = month.split('-');
  return `${MONTHS_BR[Number(monthNumber) - 1]} de ${year}`;
}

/** '2026-10' -> 'Outubro' */
export function monthNameBR(month: MonthKey): string {
  return MONTHS_BR[Number(month.split('-')[1]) - 1] as string;
}

export function addMonths(month: MonthKey, delta: number): MonthKey {
  const [year, monthNumber] = month.split('-').map(Number) as [number, number];
  const index = year * 12 + (monthNumber - 1) + delta;
  const newYear = Math.floor(index / 12);
  const newMonth = (index % 12) + 1;
  return `${newYear.toString().padStart(4, '0')}-${newMonth.toString().padStart(2, '0')}`;
}

export function buildMonthReport(month: MonthKey, closings: readonly ReportClosing[]): MonthReport {
  const inMonth = closings.filter((c) => monthKeyOf(c.date) === month);
  const closed = inMonth.filter((c) => c.status === 'closed');
  const summaries = closed.map((c) => summarizeClosing(c));
  const totals = sumSummaries(summaries);

  let bestDay: MonthReport['bestDay'] = null;
  closed.forEach((closing, index) => {
    const netCents = (summaries[index] as { netCents: Cents }).netCents;
    if (bestDay === null || netCents > bestDay.netCents) bestDay = { date: closing.date, netCents };
  });

  return {
    month,
    totals,
    openDays: inMonth.length - closed.length,
    averageNetCents: totals.days > 0 ? Math.round(totals.netCents / totals.days) : null,
    bestDay,
  };
}

/** Um relatório por mês que tenha algum dia lançado, do mais recente para o mais antigo. */
export function listMonthReports(closings: readonly ReportClosing[]): MonthReport[] {
  const months = [...new Set(closings.map((c) => monthKeyOf(c.date)))].sort().reverse();
  return months.map((month) => buildMonthReport(month, closings));
}

/** Soma geral de vários meses (para "todos os meses"). */
export function sumMonthReports(reports: readonly MonthReport[]): PeriodTotals & { openDays: number } {
  let days = 0;
  let grossCents = 0;
  let expensesCents = 0;
  let openDays = 0;
  for (const report of reports) {
    days += report.totals.days;
    grossCents += report.totals.grossCents;
    expensesCents += report.totals.expensesCents;
    openDays += report.openDays;
  }
  return { days, grossCents, expensesCents, netCents: grossCents - expensesCents, openDays };
}

/** Quanto foi gasto em cada produto nos dias FECHADOS informados, do maior gasto para o menor. */
export function expensesByProduct(closings: readonly ReportClosing[]): ProductExpense[] {
  const totals = new Map<string, Cents>();
  for (const closing of closings) {
    if (closing.status !== 'closed') continue;
    for (const item of closing.items) {
      totals.set(item.productName, (totals.get(item.productName) ?? 0) + itemTotalCents(item));
    }
  }
  return [...totals.entries()]
    .map(([productName, totalCents]) => ({ productName, totalCents }))
    .sort((a, b) => b.totalCents - a.totalCents || a.productName.localeCompare(b.productName));
}
