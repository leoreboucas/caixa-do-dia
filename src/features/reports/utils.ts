import {
  itemTotalCents,
  sumSummaries,
  summarizeClosing,
  type Cents,
  type ClosingItemLike,
  type DateKey,
  type PeriodTotals,
} from '@/features/shared/utils';
import { type ClosingStatus, isClosed } from '@/features/shared/definitions';

export type MonthKey = string;

interface ReportItem extends ClosingItemLike {
  productName: string;
}

export interface ReportClosing {
  date: DateKey;
  status: ClosingStatus;
  openingCashCents: Cents;
  grossSalesCents: Cents | null;
  items: ReportItem[];
}

interface MonthReport {
  month: MonthKey;

  totals: PeriodTotals;

  openDays: number;

  averageNetCents: Cents | null;

  bestDay: { date: DateKey; netCents: Cents } | null;
}

interface ProductExpense {
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

export function formatMonthBR(month: MonthKey): string {
  const [year, monthNumber] = month.split('-');
  return `${MONTHS_BR[Number(monthNumber) - 1]} de ${year}`;
}

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
  const closed = inMonth.filter((c) => isClosed(c.status));
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

export function listMonthReports(closings: readonly ReportClosing[]): MonthReport[] {
  const months = [...new Set(closings.map((c) => monthKeyOf(c.date)))].sort().reverse();
  return months.map((month) => buildMonthReport(month, closings));
}

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

export function expensesByProduct(closings: readonly ReportClosing[]): ProductExpense[] {
  const totals = new Map<string, Cents>();
  for (const closing of closings) {
    if (!isClosed(closing.status)) continue;
    for (const item of closing.items) {
      totals.set(item.productName, (totals.get(item.productName) ?? 0) + itemTotalCents(item));
    }
  }
  return [...totals.entries()]
    .map(([productName, totalCents]) => ({ productName, totalCents }))
    .sort((a, b) => b.totalCents - a.totalCents || a.productName.localeCompare(b.productName));
}
