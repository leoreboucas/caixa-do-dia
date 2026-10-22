import { describe, expect, it } from 'vitest';
import { cashPages, defaultCashDate } from './utils';

describe('defaultCashDate', () => {
  it('sugere ontem para quem fecha o caixa no dia seguinte', () => {
    expect(defaultCashDate('2026-10-22', undefined)).toBe('2026-10-21');
    expect(defaultCashDate('2026-10-22', '2026-10-20')).toBe('2026-10-21');
  });

  it('continua em ontem depois de lançar ontem', () => {
    expect(defaultCashDate('2026-10-22', '2026-10-21')).toBe('2026-10-21');
  });

  it('fica em hoje quando o último caixa lançado é de hoje', () => {
    expect(defaultCashDate('2026-10-22', '2026-10-22')).toBe('2026-10-22');
  });

  it('vira o mês e o ano corretamente', () => {
    expect(defaultCashDate('2026-11-01', undefined)).toBe('2026-10-31');
    expect(defaultCashDate('2027-01-01', undefined)).toBe('2026-12-31');
  });
});

describe('cashPages', () => {
  it('lista dias seguidos, do mais antigo até hoje', () => {
    expect(cashPages('2026-10-22', 3)).toEqual(['2026-10-20', '2026-10-21', '2026-10-22']);
  });

  it('termina em hoje e tem o tamanho pedido', () => {
    const pages = cashPages('2026-10-22');
    expect(pages).toHaveLength(400);
    expect(pages[pages.length - 1]).toBe('2026-10-22');
  });
});
