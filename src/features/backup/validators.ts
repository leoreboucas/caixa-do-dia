import { z } from 'zod';

export const BACKUP_VERSION = 1;

const purchaseType = z.enum(['unit', 'pack']);

const productRow = z.object({
  id: z.number().int(),
  name: z.string(),
  purchaseType,
  costCents: z.number().int(),
  unitsPerPack: z.number().int().nullable(),
  archived: z.boolean(),
});

const closingRow = z.object({
  id: z.number().int(),
  date: z.string(),
  openingCashCents: z.number().int(),
  grossSalesCents: z.number().int().nullable(),
  status: z.enum(['open', 'closed']),
  note: z.string().nullable(),
});

const itemRow = z.object({
  id: z.number().int(),
  closingId: z.number().int(),
  productId: z.number().int(),
  productName: z.string(),
  purchaseType,
  unitsPerPack: z.number().int().nullable(),
  quantity: z.number().int(),
  unitCostCents: z.number().int(),
});

export const backupSchema = z
  .object({
    version: z.literal(BACKUP_VERSION),
    exportedAt: z.string(),
    products: z.array(productRow),
    closings: z.array(closingRow),
    items: z.array(itemRow),
  })
  .refine(
    (data) => {
      const closingIds = new Set(data.closings.map((closing) => closing.id));
      const productIds = new Set(data.products.map((product) => product.id));
      return data.items.every((item) => closingIds.has(item.closingId) && productIds.has(item.productId));
    },
    { message: 'O arquivo de backup tem compras ligadas a dias ou produtos que não existem.' },
  );

export type BackupData = z.output<typeof backupSchema>;
