import { describe, expect, it } from 'vitest';
import {
  addDays,
  endOfMonthKey,
  endOfWeekKey,
  formatDateKeyBR,
  isValidDateKey,
  parseDateKey,
  startOfMonthKey,
  startOfWeekKey,
  toDateKey,
  weekdayNameBR,
} from './date';

describe('toDateKey', () => {
  it('usa o dia LOCAL, mesmo à noite (sem virar o dia por causa do UTC)', () => {
    // 23:59 locais: com toISOString() isso viraria o dia seguinte em UTC-3
    expect(toDateKey(new Date(2026, 9, 20, 23, 59))).toBe('2026-10-20');
    expect(toDateKey(new Date(2026, 0, 1, 0, 0))).toBe('2026-01-01');
  });
});

describe('isValidDateKey', () => {
  it('aceita datas reais', () => {
    expect(isValidDateKey('2026-10-20')).toBe(true);
    expect(isValidDateKey('2028-02-29')).toBe(true);
  });

  it('rejeita formato errado e datas inexistentes', () => {
    expect(isValidDateKey('20/10/2026')).toBe(false);
    expect(isValidDateKey('2026-13-01')).toBe(false);
    expect(isValidDateKey('2026-02-30')).toBe(false);
    expect(isValidDateKey('2027-02-29')).toBe(false);
    expect(isValidDateKey('')).toBe(false);
  });
});

describe('parseDateKey', () => {
  it('faz o caminho de ida e volta', () => {
    expect(toDateKey(parseDateKey('2026-10-20'))).toBe('2026-10-20');
  });

  it('lança erro para data inválida', () => {
    expect(() => parseDateKey('2026-02-30')).toThrow();
  });
});

describe('addDays', () => {
  it('atravessa fim de mês e de ano', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('formatDateKeyBR', () => {
  it('formata dd/mm/aaaa', () => {
    expect(formatDateKeyBR('2026-10-20')).toBe('20/10/2026');
  });
});

describe('períodos', () => {
  it('mês', () => {
    expect(startOfMonthKey('2026-10-20')).toBe('2026-10-01');
    expect(endOfMonthKey('2026-10-20')).toBe('2026-10-31');
    expect(endOfMonthKey('2028-02-10')).toBe('2028-02-29');
    expect(endOfMonthKey('2027-02-10')).toBe('2027-02-28');
  });

  it('semana começando na segunda (20/10/2026 é terça)', () => {
    expect(startOfWeekKey('2026-10-20')).toBe('2026-10-19');
    expect(endOfWeekKey('2026-10-20')).toBe('2026-10-25');
    // segunda e domingo ficam na mesma semana
    expect(startOfWeekKey('2026-10-19')).toBe('2026-10-19');
    expect(startOfWeekKey('2026-10-25')).toBe('2026-10-19');
  });

  it('semana começando no domingo', () => {
    expect(startOfWeekKey('2026-10-20', 0)).toBe('2026-10-18');
    expect(endOfWeekKey('2026-10-20', 0)).toBe('2026-10-24');
  });
});

describe('weekdayNameBR', () => {
  it('devolve o dia da semana em português', () => {
    expect(weekdayNameBR('2026-10-20')).toBe('Terça');
    expect(weekdayNameBR('2026-10-18')).toBe('Domingo');
  });
});
