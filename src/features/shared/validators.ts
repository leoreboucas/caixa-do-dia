import { z } from 'zod';
import { MAX_CENTS } from './utils';

export const centsSchema = z
  .number()
  .int('Valor inválido')
  .min(0, 'Valor inválido')
  .max(MAX_CENTS, 'Valor muito alto');
