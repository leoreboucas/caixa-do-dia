import { addDays, type DateKey } from '@/features/shared/utils';

export const defaultCashDate = (today: DateKey, lastLaunched: DateKey | undefined): DateKey =>
  lastLaunched === today ? today : addDays(today, -1);

export const cashPages = (today: DateKey, days = 400): DateKey[] =>
  Array.from({ length: days }, (_, offset) => addDays(today, offset - (days - 1)));
