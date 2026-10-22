import { z } from 'zod';
import { centsSchema } from '@/features/shared/validators';
import { PurchaseType, isPack } from '@/features/shared/definitions';

export const productFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Informe o nome').max(60, 'Nome muito longo'),
    purchaseType: z.enum([PurchaseType.UNIT, PurchaseType.PACK]),
    costCents: centsSchema.min(1, 'Informe o custo'),
    unitsPerPack: z
      .number()
      .int('Use um número inteiro')
      .min(1, 'Mínimo 1 unidade')
      .max(100_000, 'Quantidade muito alta')
      .nullish(),
  })

  .transform((v) => ({
    name: v.name,
    purchaseType: v.purchaseType,
    costCents: v.costCents,
    unitsPerPack: isPack(v.purchaseType) ? (v.unitsPerPack ?? null) : null,
  }));
export type ProductFormValues = z.output<typeof productFormSchema>;
