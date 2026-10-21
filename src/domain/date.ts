/**
 * Datas do app são strings 'YYYY-MM-DD' no FUSO LOCAL do celular.
 * Nunca use toISOString() para isso: ele converte para UTC e, no Brasil (UTC-3),
 * depois das 21h viraria o dia seguinte.
 */

export type DateKey = string;

const DATE_KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad2 = (n: number): string => n.toString().padStart(2, '0');

export function toDateKey(date: Date): DateKey {
  return `${date.getFullYear().toString().padStart(4, '0')}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function todayKey(now: Date = new Date()): DateKey {
  return toDateKey(now);
}

export function isValidDateKey(key: string): boolean {
  const match = DATE_KEY_RE.exec(key);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1900) return false;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function parseDateKey(key: DateKey): Date {
  if (!isValidDateKey(key)) {
    throw new Error(`Data inválida: ${key}`);
  }
  const [year, month, day] = key.split('-').map(Number) as [number, number, number];
  return new Date(year, month - 1, day);
}

export function addDays(key: DateKey, days: number): DateKey {
  const date = parseDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

/** '2026-10-20' -> '20/10/2026' */
export function formatDateKeyBR(key: DateKey): string {
  const [year, month, day] = key.split('-');
  return `${day}/${month}/${year}`;
}

export function startOfMonthKey(key: DateKey): DateKey {
  const date = parseDateKey(key);
  return toDateKey(new Date(date.getFullYear(), date.getMonth(), 1));
}

export function endOfMonthKey(key: DateKey): DateKey {
  const date = parseDateKey(key);
  // dia 0 do mês seguinte = último dia deste mês
  return toDateKey(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

/** Início da semana. Por padrão a semana começa na segunda (1). Use 0 para domingo. */
export function startOfWeekKey(key: DateKey, weekStartsOn: 0 | 1 = 1): DateKey {
  const date = parseDateKey(key);
  const diff = (date.getDay() - weekStartsOn + 7) % 7;
  date.setDate(date.getDate() - diff);
  return toDateKey(date);
}

export function endOfWeekKey(key: DateKey, weekStartsOn: 0 | 1 = 1): DateKey {
  return addDays(startOfWeekKey(key, weekStartsOn), 6);
}

const WEEKDAYS_BR = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'] as const;

/** '2026-10-20' -> 'Terça' */
export function weekdayNameBR(key: DateKey): string {
  return WEEKDAYS_BR[parseDateKey(key).getDay()] as string;
}
