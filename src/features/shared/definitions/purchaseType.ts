export const PurchaseType = {
  UNIT: 'unit',
  PACK: 'pack',
} as const;

export type PurchaseType = (typeof PurchaseType)[keyof typeof PurchaseType];

export const purchaseTypeLabels: Record<PurchaseType, string> = {
  [PurchaseType.UNIT]: 'Por unidade',
  [PurchaseType.PACK]: 'Por pacote',
};

export const purchaseTypeSingular: Record<PurchaseType, string> = {
  [PurchaseType.UNIT]: 'unidade',
  [PurchaseType.PACK]: 'pacote',
};

export const purchaseTypePlural: Record<PurchaseType, string> = {
  [PurchaseType.UNIT]: 'unidades',
  [PurchaseType.PACK]: 'pacotes',
};

export const purchaseTypeOptions = Object.values(PurchaseType).map((type) => ({
  value: type,
  label: purchaseTypeLabels[type],
}));

export const isPack = (type: PurchaseType) => type === PurchaseType.PACK;
