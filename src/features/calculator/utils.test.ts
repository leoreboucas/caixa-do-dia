import { describe, expect, it } from 'vitest';
import {
  MAX_EXPRESSION_LENGTH,
  backspace,
  centsToExpression,
  emptyState,
  equals,
  evaluate,
  expressionOf,
  inputDecimal,
  inputDigit,
  inputOperator,
  parseEntries,
  resultCents,
  resultOf,
  selectEntry,
  stateFromEntries,
  type CalculatorState,
  type Entry,
} from './utils';

const type = (text: string, from: CalculatorState = emptyState()): CalculatorState =>
  [...text].reduce((state, char) => {
    if (char === ',') return inputDecimal(state);
    if ('+−×÷'.includes(char)) return inputOperator(state, char as '+');
    return inputDigit(state, char);
  }, from);

describe('evaluate', () => {
  it('soma, subtrai, multiplica e divide', () => {
    expect(evaluate('2+3')).toBe(5);
    expect(evaluate('10−4')).toBe(6);
    expect(evaluate('6×7')).toBe(42);
    expect(evaluate('9÷3')).toBe(3);
  });

  it('multiplicação e divisão vêm antes de soma e subtração', () => {
    expect(evaluate('2+3×4')).toBe(14);
    expect(evaluate('20−10÷2+1')).toBe(16);
  });

  it('entende vírgula como separador decimal', () => {
    expect(evaluate('1,5+2,25')).toBeCloseTo(3.75);
  });

  it('ignora operador ou vírgula no fim da conta', () => {
    expect(evaluate('5+')).toBe(5);
    expect(evaluate('5,')).toBe(5);
  });

  it('devolve null para conta vazia e para divisão por zero', () => {
    expect(evaluate('')).toBeNull();
    expect(evaluate('5÷0')).toBeNull();
  });
});

describe('resultCents', () => {
  it('arredonda para centavos sem erro de ponto flutuante', () => {
    expect(resultCents('0,1+0,2')).toBe(30);
    expect(resultCents('10÷3')).toBe(333);
    expect(resultCents('250,5×2')).toBe(50100);
  });

  it('devolve null quando não dá para calcular', () => {
    expect(resultCents('')).toBeNull();
    expect(resultCents('1÷0')).toBeNull();
  });
});

describe('digitação', () => {
  it('monta a conta em lançamentos', () => {
    const state = type('12,5+30×2');
    expect(state.entries).toEqual([
      { operator: null, value: '12,5' },
      { operator: '+', value: '30' },
      { operator: '×', value: '2' },
    ]);
    expect(expressionOf(state.entries)).toBe('12,5+30×2');
  });

  it('não acumula zeros à esquerda', () => {
    expect(type('05').entries[0]?.value).toBe('5');
    expect(type('00').entries[0]?.value).toBe('0');
  });

  it('aceita uma vírgula por número', () => {
    expect(type('12,5,').entries[0]?.value).toBe('12,5');
    expect(type('3+,').entries[1]?.value).toBe('0,');
  });

  it('troca o operador anterior e não começa a conta por operador', () => {
    expect(expressionOf(type('12+×').entries)).toBe('12×');
    expect(expressionOf(type('+').entries)).toBe('');
    expect(expressionOf(type('12,+').entries)).toBe('12+');
  });

  it('apaga um caractere de cada vez e depois o operador', () => {
    let state = type('12+3');
    state = backspace(state);
    expect(expressionOf(state.entries)).toBe('12+');
    state = backspace(state);
    expect(expressionOf(state.entries)).toBe('12');
  });
});

describe('corrigir um número do meio da conta', () => {
  it('o primeiro dígito digitado troca o número tocado, e os seguintes continuam nele', () => {
    const state = selectEntry(type('100+20+3'), 1, 'value');
    expect(state.cursor).toBe(1);
    const edited = type('45', state);
    expect(expressionOf(edited.entries)).toBe('100+45+3');
  });

  it('apagar e redigitar um número do início mantém o resto da conta', () => {
    let state = selectEntry(type('100+20+3'), 0, 'value');
    state = backspace(backspace(backspace(state)));
    expect(state.entries[0]?.value).toBe('');
    state = type('7', state);
    expect(expressionOf(state.entries)).toBe('7+20+3');
    expect(resultOf(state.entries)).toBe(3000);
  });

  it('um operador depois da correção volta a continuar a conta no fim', () => {
    const state = type('+9', inputOperator(selectEntry(type('1+2+3'), 0, 'value'), '+'));
    expect(expressionOf(state.entries)).toBe('1+2+3+9');
  });

  it('um número deixado vazio ao tocar em outro é descartado', () => {
    let state = selectEntry(type('5+6+7'), 1, 'value');
    state = backspace(state);
    state = selectEntry(state, 2, 'value');
    expect(expressionOf(state.entries)).toBe('5+7');
    expect(state.entries[state.cursor]?.value).toBe('7');
  });

  it('descartar o primeiro número faz o seguinte virar o primeiro', () => {
    let state = selectEntry(type('5+6+7'), 0, 'value');
    state = backspace(state);
    state = selectEntry(state, 1, 'value');
    expect(expressionOf(state.entries)).toBe('6+7');
  });
});

describe('corrigir um operador', () => {
  it('tocar no operador e apertar outro troca só aquele operador', () => {
    const state = inputOperator(selectEntry(type('10+5+2'), 1, 'operator'), '−');
    expect(expressionOf(state.entries)).toBe('10−5+2');
    expect(resultOf(state.entries)).toBe(700);
    expect(state.cursor).toBe(2);
  });

  it('a troca vale para multiplicação e divisão e respeita a precedência', () => {
    const state = inputOperator(selectEntry(type('2+3+4'), 1, 'operator'), '×');
    expect(expressionOf(state.entries)).toBe('2×3+4');
    expect(resultOf(state.entries)).toBe(1000);
  });

  it('digitar um número com o operador selecionado troca o número daquele lançamento', () => {
    const state = type('9', selectEntry(type('10+5+2'), 1, 'operator'));
    expect(expressionOf(state.entries)).toBe('10+9+2');
  });

  it('apagar com o operador selecionado não muda a conta', () => {
    const selected = selectEntry(type('10+5'), 1, 'operator');
    expect(backspace(selected)).toBe(selected);
  });

  it('o primeiro lançamento não tem operador para editar', () => {
    const state = selectEntry(type('10+5'), 0, 'operator');
    expect(state.field).toBe('value');
  });

  it('continuar a conta depois de trocar o operador segue pelo fim', () => {
    const state = type('+7', inputOperator(selectEntry(type('1+2'), 1, 'operator'), '×'));
    expect(expressionOf(state.entries)).toBe('1×2+7');
  });
});

describe('resultado', () => {
  it('ignora números vazios no meio da conta', () => {
    const state = backspace(selectEntry(type('5+6+7'), 1, 'value'));
    expect(resultOf(state.entries)).toBe(1200);
  });

  it('= troca a conta pelo resultado e continua dali', () => {
    const state = equals(type('125,5+74,5'));
    expect(expressionOf(state.entries)).toBe('200');
    expect(expressionOf(type('+50', state).entries)).toBe('200+50');
  });

  it('= não faz nada quando a conta está incompleta ou negativa', () => {
    expect(equals(type('5÷0'))).toEqual(type('5÷0'));
    expect(equals(type('3−8'))).toEqual(type('3−8'));
  });
});

describe('limites', () => {
  it('aceita centenas de lançamentos antes de travar', () => {
    const hundreds = type('125,50+'.repeat(200));
    expect(expressionOf(hundreds.entries).length).toBeLessThan(MAX_EXPRESSION_LENGTH);
    expect(hundreds.entries).toHaveLength(201);
  });

  it('para de aceitar dígitos no limite da conta', () => {
    const entries: Entry[] = Array.from({ length: 150 }, (_, i) => ({
      operator: i === 0 ? null : '+',
      value: '123456789',
    }));
    const full = stateFromEntries(entries);
    expect(expressionOf(full.entries).length).toBe(1499);
    expect(inputDigit(full, '1').entries[149]?.value).toBe('1234567891');
    expect(expressionOf(inputDigit(inputDigit(full, '1'), '2').entries).length).toBe(MAX_EXPRESSION_LENGTH);
    const reached = inputDigit(inputDigit(full, '1'), '2');
    expect(inputDigit(reached, '3')).toBe(reached);
  });

  it('limita o tamanho de cada número', () => {
    expect(type('1234567890123').entries[0]?.value).toBe('123456789012');
  });
});

describe('rascunho salvo', () => {
  it('reconhece um rascunho válido', () => {
    const entries = type('1,5+2').entries;
    expect(parseEntries(JSON.stringify(entries))).toEqual(entries);
  });

  it('descarta dados corrompidos ou de formato errado', () => {
    expect(parseEntries(null)).toBeNull();
    expect(parseEntries('não é json')).toBeNull();
    expect(parseEntries('[]')).toBeNull();
    expect(parseEntries('[{"operator":"+","value":"1"}]')).toBeNull();
    expect(parseEntries('[{"operator":null,"value":"1a"}]')).toBeNull();
  });
});

describe('centsToExpression', () => {
  it('escreve o resultado como o usuário digitaria', () => {
    expect(centsToExpression(25000)).toBe('250');
    expect(centsToExpression(25050)).toBe('250,50');
    expect(centsToExpression(5)).toBe('0,05');
  });
});
