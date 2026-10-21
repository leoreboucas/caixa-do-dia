import { describe, expect, it } from 'vitest';
import { centsFromDigits, formatBRL, MAX_CENTS, multiplyCents } from './money';

describe('formatBRL', () => {
  it('formata valores simples', () => {
    expect(formatBRL(0)).toBe('R$ 0,00');
    expect(formatBRL(5)).toBe('R$ 0,05');
    expect(formatBRL(2550)).toBe('R$ 25,50');
  });

  it('usa ponto como separador de milhar', () => {
    expect(formatBRL(123456)).toBe('R$ 1.234,56');
    expect(formatBRL(100000000)).toBe('R$ 1.000.000,00');
  });

  it('formata negativos', () => {
    expect(formatBRL(-1500)).toBe('-R$ 15,00');
  });

  it('arredonda custo unitário fracionário só na exibição', () => {
    // pacote de R$ 10,00 com 30 unidades = 33,33 centavos
    expect(formatBRL(1000 / 30)).toBe('R$ 0,33');
    expect(formatBRL(2500 / 50)).toBe('R$ 0,50');
  });

  it('não mostra "-R$ 0,00" para fração negativa minúscula', () => {
    expect(formatBRL(-0.2)).toBe('R$ 0,00');
  });
});

describe('centsFromDigits', () => {
  it('digitou 2500 -> 2500 centavos', () => {
    expect(centsFromDigits('2500')).toBe(2500);
  });

  it('ignora o que não é dígito', () => {
    expect(centsFromDigits('R$ 25,00')).toBe(2500);
    expect(centsFromDigits('abc')).toBe(0);
    expect(centsFromDigits('')).toBe(0);
  });

  it('limita ao valor máximo', () => {
    expect(centsFromDigits('99999999999999')).toBeLessThanOrEqual(MAX_CENTS);
  });
});

describe('multiplyCents', () => {
  it('multiplica quantidade pelo valor unitário', () => {
    expect(multiplyCents(2500, 3)).toBe(7500);
  });
});
