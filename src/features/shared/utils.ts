export type DateKey = string;

const DATE_KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad2 = (n: number): string => n.toString().padStart(2, '0');

export function toDateKey(date: Date): DateKey {
  return `${date.getFullYear().toString().padStart(4, '0')}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function todayKey(now: Date = new Date()): DateKey {
  return toDateKey(now);
}

export function isValidDateKey(key: string): boolean {
  const match = DATE_KEY_RE.exec(key);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1900) return false;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function parseDateKey(key: DateKey): Date {
  if (!isValidDateKey(key)) {
    throw new Error(`Data inválida: ${key}`);
  }
  const [year, month, day] = key.split('-').map(Number) as [number, number, number];
  return new Date(year, month - 1, day);
}

export function addDays(key: DateKey, days: number): DateKey {
  const date = parseDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

export function formatDateKeyBR(key: DateKey): string {
  const [year, month, day] = key.split('-');
  return `${day}/${month}/${year}`;
}

export function startOfMonthKey(key: DateKey): DateKey {
  const date = parseDateKey(key);
  return toDateKey(new Date(date.getFullYear(), date.getMonth(), 1));
}

export function startOfWeekKey(key: DateKey, weekStartsOn: 0 | 1 = 1): DateKey {
  const date = parseDateKey(key);
  const diff = (date.getDay() - weekStartsOn + 7) % 7;
  date.setDate(date.getDate() - diff);
  return toDateKey(date);
}

const WEEKDAYS_BR = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'] as const;

export function weekdayNameBR(key: DateKey): string {
  return WEEKDAYS_BR[parseDateKey(key).getDay()] as string;
}

export type Cents = number;

const MAX_DIGITS = 9;
export const MAX_CENTS = 10 ** MAX_DIGITS - 1;

export function formatBRL(cents: Cents): string {
  const abs = Math.round(Math.abs(cents));
  const sign = cents < 0 && abs > 0 ? '-' : '';
  const reais = Math.floor(abs / 100);
  const resto = abs % 100;
  const reaisComPontos = reais.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}R$ ${reaisComPontos},${resto.toString().padStart(2, '0')}`;
}

export function centsFromDigits(input: string): Cents {
  const digits = input.replace(/\D/g, '').slice(0, MAX_DIGITS);
  return digits === '' ? 0 : Number.parseInt(digits, 10);
}

export function multiplyCents(unitCents: Cents, quantity: number): Cents {
  return unitCents * quantity;
}

export interface ClosingItemLike {
  quantity: number;
  unitCostCents: Cents;
}

interface ClosingSummary {
  openingCashCents: Cents;

  grossCents: Cents;

  expensesCents: Cents;

  netCents: Cents;

  finalCashCents: Cents;
}

export function itemTotalCents(item: ClosingItemLike): Cents {
  return item.quantity * item.unitCostCents;
}

export function totalExpensesCents(items: readonly ClosingItemLike[]): Cents {
  return items.reduce((sum, item) => sum + itemTotalCents(item), 0);
}

export function netCents(grossCents: Cents, expensesCents: Cents): Cents {
  return grossCents - expensesCents;
}

export function finalCashCents(openingCashCents: Cents, grossCents: Cents): Cents {
  return openingCashCents + grossCents;
}

export function grossFromFinalCashCents(finalCash: Cents, openingCashCents: Cents): Cents {
  return finalCash - openingCashCents;
}

export function summarizeClosing(input: {
  openingCashCents: Cents;
  grossSalesCents: Cents | null;
  items: readonly ClosingItemLike[];
}): ClosingSummary {
  const grossCents = input.grossSalesCents ?? 0;
  const expensesCents = totalExpensesCents(input.items);
  return {
    openingCashCents: input.openingCashCents,
    grossCents,
    expensesCents,
    netCents: netCents(grossCents, expensesCents),
    finalCashCents: finalCashCents(input.openingCashCents, grossCents),
  };
}

export interface PeriodTotals {
  days: number;
  grossCents: Cents;
  expensesCents: Cents;
  netCents: Cents;
}

export function sumSummaries(summaries: readonly ClosingSummary[]): PeriodTotals {
  let grossCents = 0;
  let expensesCents = 0;
  for (const s of summaries) {
    grossCents += s.grossCents;
    expensesCents += s.expensesCents;
  }
  return {
    days: summaries.length,
    grossCents,
    expensesCents,
    netCents: netCents(grossCents, expensesCents),
  };
}

export const pluralize = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;
