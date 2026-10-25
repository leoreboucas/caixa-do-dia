import { useEffect, useState } from 'react';
import { loadDraft, saveDraft } from '@/features/calculator/services';
import {
  backspace,
  emptyState,
  equals,
  inputDecimal,
  inputDigit,
  inputOperator,
  resultOf,
  selectEntry,
  stateFromEntries,
  type CalculatorState,
  type EntryField,
  type Operator,
} from '@/features/calculator/utils';
import type { DateKey } from '@/features/shared';

const useCalculator = (date: DateKey) => {
  const [state, setState] = useState<CalculatorState>(() => {
    const draft = loadDraft(date);
    return draft ? stateFromEntries(draft) : emptyState();
  });

  useEffect(() => {
    saveDraft(date, state.entries);
  }, [date, state.entries]);

  return {
    entries: state.entries,
    cursor: state.cursor,
    field: state.field,
    result: resultOf(state.entries),
    pressDigit: (digit: string) => setState((current) => inputDigit(current, digit)),
    pressDecimal: () => setState(inputDecimal),
    pressOperator: (operator: string) => setState((current) => inputOperator(current, operator as Operator)),
    pressBackspace: () => setState(backspace),
    pressClear: () => setState(emptyState()),
    pressEquals: () => setState(equals),
    selectEntry: (index: number, field: EntryField) =>
      setState((current) => selectEntry(current, index, field)),
  };
};

export default useCalculator;
