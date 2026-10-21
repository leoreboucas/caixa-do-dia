import type { Cents } from './money';

export type PurchaseType = 'unit' | 'pack';

export interface PackInfo {
  purchaseType: PurchaseType;
  unitsPerPack: number | null;
}

/**
 * Custo de UMA unidade do produto, em centavos (pode ser fracionário, ex.: 33,33).
 *
 * - Comprado por unidade: o custo já é o da unidade.
 * - Comprado por pacote COM unidades por pacote: custo do pacote / unidades.
 * - Comprado por pacote SEM unidades por pacote: não dá para saber -> null
 *   (a tela mostra só o custo do pacote).
 *
 * Não arredondamos aqui. O arredondamento acontece só na exibição (formatBRL).
 */
export function unitCostCents(costCents: Cents, info: PackInfo): number | null {
  if (info.purchaseType === 'unit') {
    return costCents;
  }
  if (info.unitsPerPack !== null && info.unitsPerPack > 0) {
    return costCents / info.unitsPerPack;
  }
  return null;
}
