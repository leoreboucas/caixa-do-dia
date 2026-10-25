const OPERATORS = ['+', '−', '×', '÷'] as const;

export type Operator = (typeof OPERATORS)[number];

export const MAX_EXPRESSION_LENGTH = 1500;
const MAX_NUMBER_LENGTH = 12;

export interface Entry {
  operator: Operator | null;
  value: string;
}

export type EntryField = 'value' | 'operator';

export interface CalculatorState {
  entries: Entry[];
  cursor: number;
  field: EntryField;
  replacing: boolean;
}

const isOperator = (char: string | undefined) => !!char && (OPERATORS as readonly string[]).includes(char);

export const emptyState = (): CalculatorState => ({
  entries: [{ operator: null, value: '' }],
  cursor: 0,
  field: 'value',
  replacing: false,
});

export const stateFromEntries = (entries: Entry[]): CalculatorState => ({
  entries,
  cursor: entries.length - 1,
  field: 'value',
  replacing: false,
});

export const isEmpty = (entries: Entry[]) => entries.length === 1 && entries[0]?.value === '';

export const expressionOf = (entries: Entry[]): string =>
  entries.map((entry) => `${entry.operator ?? ''}${entry.value}`).join('');

const evaluableExpressionOf = (entries: Entry[]): string =>
  expressionOf(entries.filter((entry, index) => entry.value !== '' || index === entries.length - 1)).replace(
    /^[+−×÷]/,
    '',
  );

export const evaluate = (expression: string): number | null => {
  const tokens = expression.match(/\d+(?:,\d*)?|[+−×÷]/g) ?? [];
  while (isOperator(tokens[tokens.length - 1])) tokens.pop();
  const first = tokens[0];
  if (first === undefined) return null;

  const values = [Number(first.replace(',', '.'))];
  const sumOperators: string[] = [];
  for (let i = 1; i + 1 < tokens.length; i += 2) {
    const operator = tokens[i];
    const next = Number((tokens[i + 1] as string).replace(',', '.'));
    const last = values.length - 1;
    if (operator === '×') values[last] = (values[last] as number) * next;
    else if (operator === '÷') {
      if (next === 0) return null;
      values[last] = (values[last] as number) / next;
    } else {
      sumOperators.push(operator as string);
      values.push(next);
    }
  }

  return sumOperators.reduce(
    (total, operator, index) =>
      operator === '+' ? total + (values[index + 1] as number) : total - (values[index + 1] as number),
    values[0] as number,
  );
};

export const resultCents = (expression: string): number | null => {
  const value = evaluate(expression);
  if (value === null || !Number.isFinite(value)) return null;
  return Math.round(value * 100);
};

export const resultOf = (entries: Entry[]): number | null => resultCents(evaluableExpressionOf(entries));

export const centsToExpression = (cents: number): string => {
  const sign = cents < 0 ? '−' : '';
  const abs = Math.abs(cents);
  const reais = Math.floor(abs / 100);
  const rest = abs % 100;
  return `${sign}${reais}${rest === 0 ? '' : `,${rest.toString().padStart(2, '0')}`}`;
};

const replaceEntry = (entries: Entry[], index: number, entry: Entry): Entry[] =>
  entries.map((current, i) => (i === index ? entry : current));

const atEnd = (entries: Entry[]): CalculatorState => ({
  entries,
  cursor: entries.length - 1,
  field: 'value',
  replacing: false,
});

const compact = (entries: Entry[], keepIndex: number) => {
  const kept: Entry[] = [];
  let newIndex = 0;
  entries.forEach((entry, i) => {
    const isLast = i === entries.length - 1;
    if (entry.value === '' && !isLast && i !== keepIndex) return;
    if (i === keepIndex) newIndex = kept.length;
    kept.push(entry);
  });
  const [first] = kept;
  if (first && first.operator !== null) kept[0] = { ...first, operator: null };
  return { entries: kept, index: newIndex };
};

const editingValue = (state: CalculatorState) => (state.field === 'operator' ? true : state.replacing);

export const inputDigit = (state: CalculatorState, digit: string): CalculatorState => {
  const entry = state.entries[state.cursor];
  if (!entry) return state;
  const replacing = editingValue(state);
  const base = replacing ? '' : entry.value;
  const expressionLength = expressionOf(state.entries).length - (replacing ? entry.value.length : 0);
  if (expressionLength >= MAX_EXPRESSION_LENGTH) return state;

  let value: string;
  if (base === '0') value = digit;
  else if (base.replace(',', '').length >= MAX_NUMBER_LENGTH) return state;
  else value = base + digit;

  return {
    ...state,
    entries: replaceEntry(state.entries, state.cursor, { ...entry, value }),
    field: 'value',
    replacing: false,
  };
};

export const inputDecimal = (state: CalculatorState): CalculatorState => {
  const entry = state.entries[state.cursor];
  if (!entry) return state;
  const replacing = editingValue(state);
  const base = replacing ? '' : entry.value;
  if (base.includes(',')) return state;
  const expressionLength = expressionOf(state.entries).length - (replacing ? entry.value.length : 0);
  if (expressionLength >= MAX_EXPRESSION_LENGTH - 1) return state;

  const value = base === '' ? '0,' : `${base},`;
  return {
    ...state,
    entries: replaceEntry(state.entries, state.cursor, { ...entry, value }),
    field: 'value',
    replacing: false,
  };
};

export const inputOperator = (state: CalculatorState, operator: Operator): CalculatorState => {
  const selected = state.entries[state.cursor];
  if (state.field === 'operator' && selected) {
    return atEnd(replaceEntry(state.entries, state.cursor, { ...selected, operator }));
  }

  const { entries } = compact(state.entries, state.entries.length - 1);
  const lastIndex = entries.length - 1;
  const last = entries[lastIndex];
  if (!last) return state;

  if (last.value === '') {
    if (entries.length === 1) return atEnd(entries);
    return atEnd(replaceEntry(entries, lastIndex, { ...last, operator }));
  }
  if (expressionOf(entries).length >= MAX_EXPRESSION_LENGTH) return atEnd(entries);

  const trimmed = last.value.endsWith(',') ? last.value.slice(0, -1) : last.value;
  return atEnd([...replaceEntry(entries, lastIndex, { ...last, value: trimmed }), { operator, value: '' }]);
};

export const backspace = (state: CalculatorState): CalculatorState => {
  const entry = state.entries[state.cursor];
  if (!entry || state.field === 'operator') return state;
  if (entry.value !== '') {
    const value = entry.value.slice(0, -1);
    return {
      ...state,
      entries: replaceEntry(state.entries, state.cursor, { ...entry, value }),
      replacing: false,
    };
  }
  const isLast = state.cursor === state.entries.length - 1;
  if (isLast && state.entries.length > 1) return atEnd(state.entries.slice(0, -1));
  return state;
};

export const selectEntry = (state: CalculatorState, index: number, field: EntryField): CalculatorState => {
  if (!state.entries[index]) return state;
  const { entries, index: newIndex } = compact(state.entries, index);
  const selected = entries[newIndex];
  if (!selected) return state;
  if (field === 'operator' && selected.operator !== null) {
    return { entries, cursor: newIndex, field: 'operator', replacing: false };
  }
  return { entries, cursor: newIndex, field: 'value', replacing: selected.value !== '' };
};

export const equals = (state: CalculatorState): CalculatorState => {
  const cents = resultOf(state.entries);
  if (cents === null || cents < 0) return state;
  return stateFromEntries([{ operator: null, value: centsToExpression(cents) }]);
};

export const parseEntries = (raw: string | null): Entry[] | null => {
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    const entries = parsed.map((item) => {
      const { operator, value } = item as Entry;
      const validOperator = operator === null || (OPERATORS as readonly string[]).includes(operator);
      if (!validOperator || typeof value !== 'string' || !/^\d*,?\d*$/.test(value))
        throw new Error('invalid');
      return { operator, value };
    });
    return entries[0]?.operator === null ? entries : null;
  } catch {
    return null;
  }
};
