import { z } from 'zod';
import { isValidDateKey } from './date';
import { MAX_CENTS } from './money';

const cents = z.number().int('Valor inválido').min(0, 'Valor inválido').max(MAX_CENTS, 'Valor muito alto');

export const productFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Informe o nome').max(60, 'Nome muito longo'),
    purchaseType: z.enum(['unit', 'pack']),
    costCents: cents.min(1, 'Informe o custo'),
    unitsPerPack: z
      .number()
      .int('Use um número inteiro')
      .min(1, 'Mínimo 1 unidade')
      .max(100_000, 'Quantidade muito alta')
      .nullish(),
  })
  // Unidades por pacote só existe para pacote; para "unidade" normalizamos para null.
  .transform((v) => ({
    name: v.name,
    purchaseType: v.purchaseType,
    costCents: v.costCents,
    unitsPerPack: v.purchaseType === 'pack' ? (v.unitsPerPack ?? null) : null,
  }));
export type ProductFormInput = z.input<typeof productFormSchema>;
export type ProductFormValues = z.output<typeof productFormSchema>;

export const closingItemFormSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int('Use um número inteiro').min(1, 'Mínimo 1').max(100_000, 'Quantidade muito alta'),
  unitCostCents: cents.min(1, 'Informe o custo'),
});
export type ClosingItemFormValues = z.output<typeof closingItemFormSchema>;

export const openDaySchema = z.object({
  date: z.string().refine(isValidDateKey, 'Data inválida'),
  openingCashCents: cents,
});
export type OpenDayValues = z.output<typeof openDaySchema>;

export const closeDaySchema = z.object({
  grossSalesCents: cents,
  note: z.string().trim().max(200, 'Observação muito longa').nullish(),
});
export type CloseDayValues = z.output<typeof closeDaySchema>;
