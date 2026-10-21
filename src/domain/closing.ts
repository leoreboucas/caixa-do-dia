import type { Cents } from './money';
import type { DateKey } from './date';

/** Qualquer item de compra de um fechamento (compatível com a linha de closing_items). */
export interface ClosingItemLike {
  quantity: number;
  unitCostCents: Cents;
}

export interface ClosingLike {
  date: DateKey;
  status: 'open' | 'closed';
  openingCashCents: Cents;
  grossSalesCents: Cents | null;
  items: ClosingItemLike[];
}

export interface ClosingSummary {
  openingCashCents: Cents;
  /** Valor bruto = venda total do dia */
  grossCents: Cents;
  /** Despesas = soma de (quantidade x custo) de todos os itens comprados */
  expensesCents: Cents;
  /** Líquido = bruto - despesas */
  netCents: Cents;
  /** Caixa final = caixa inicial + bruto - despesas */
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

/** O caixa inicial NÃO é receita: ele só entra na conta do dinheiro em mãos. */
export function finalCashCents(
  openingCashCents: Cents,
  grossCents: Cents,
  expensesCents: Cents,
): Cents {
  return openingCashCents + grossCents - expensesCents;
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
    finalCashCents: finalCashCents(input.openingCashCents, grossCents, expensesCents),
  };
}

/**
 * Sugestão de caixa inicial para `date`: o caixa final do dia FECHADO mais recente
 * anterior a essa data. Retorna null se não houver dia anterior (primeiro uso).
 * É só uma sugestão: a pessoa pode digitar outro valor.
 */
export function suggestOpeningCashCents(
  date: DateKey,
  closings: readonly ClosingLike[],
): Cents | null {
  let previous: ClosingLike | null = null;
  for (const closing of closings) {
    if (closing.status !== 'closed' || closing.date >= date) continue;
    if (previous === null || closing.date > previous.date) {
      previous = closing;
    }
  }
  if (previous === null) return null;
  return summarizeClosing(previous).finalCashCents;
}

export interface PeriodTotals {
  days: number;
  grossCents: Cents;
  expensesCents: Cents;
  netCents: Cents;
}

/** Soma vários dias (para os totais da semana e do mês no histórico). */
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
