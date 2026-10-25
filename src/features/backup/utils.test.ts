import { describe, expect, it } from 'vitest';
import { formatDateTimeBR } from './utils';

describe('formatDateTimeBR', () => {
  it('escreve a data e a hora locais como dd/mm/aaaa às HH:MM', () => {
    const iso = new Date(2026, 9, 5, 8, 7).toISOString();
    expect(formatDateTimeBR(iso)).toBe('05/10/2026 às 08:07');
  });
});
