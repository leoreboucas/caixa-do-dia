import type { Cents } from '@/features/shared/utils';
import { PurchaseType } from '@/features/shared/definitions';

interface PackInfo {
  purchaseType: PurchaseType;
  unitsPerPack: number | null;
}

export function unitCostCents(costCents: Cents, info: PackInfo): number | null {
  if (info.purchaseType === PurchaseType.UNIT) {
    return costCents;
  }
  if (info.unitsPerPack !== null && info.unitsPerPack > 0) {
    return costCents / info.unitsPerPack;
  }
  return null;
}
