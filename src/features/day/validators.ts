import { z } from 'zod';
import { centsSchema } from '@/features/shared/validators';
import { isValidDateKey } from '@/features/shared/utils';

export const closingItemFormSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int('Use um número inteiro').min(1, 'Mínimo 1').max(100_000, 'Quantidade muito alta'),
  unitCostCents: centsSchema.min(1, 'Informe o custo'),
});

export const openDaySchema = z.object({
  date: z.string().refine(isValidDateKey, 'Data inválida'),
  openingCashCents: centsSchema,
});
export type OpenDayValues = z.output<typeof openDaySchema>;

export const closeDaySchema = z.object({
  grossSalesCents: centsSchema,
  note: z.string().trim().max(200, 'Observação muito longa').nullish(),
});
export type CloseDayValues = z.output<typeof closeDaySchema>;
