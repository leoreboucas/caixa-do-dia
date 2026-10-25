import Storage from 'expo-sqlite/kv-store';
import { isEmpty, parseEntries, type Entry } from '@/features/calculator/utils';
import type { DateKey } from '@/features/shared/utils';

const draftKey = (date: DateKey) => `calculator-draft:${date}`;

export const loadDraft = (date: DateKey): Entry[] | null => parseEntries(Storage.getItemSync(draftKey(date)));

export const clearDraft = (date: DateKey): void => {
  Storage.removeItemSync(draftKey(date));
};

export const saveDraft = (date: DateKey, entries: Entry[]): void => {
  if (isEmpty(entries)) clearDraft(date);
  else Storage.setItemSync(draftKey(date), JSON.stringify(entries));
};
