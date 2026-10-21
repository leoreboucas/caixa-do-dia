/**
 * Todo dinheiro no app é um número INTEIRO de centavos.
 * R$ 25,50 = 2550. Isso evita erros de ponto flutuante (0.1 + 0.2).
 */

export type Cents = number;

/** Maior valor aceito nos campos de dinheiro: R$ 9.999.999,99 */
export const MAX_DIGITS = 9;
export const MAX_CENTS = 10 ** MAX_DIGITS - 1;

/**
 * Formata centavos como "R$ 1.234,56".
 * Aceita valores fracionários (ex.: custo unitário 33,33 centavos) e arredonda só aqui, na exibição.
 * Implementação manual (sem Intl) para dar o mesmo resultado em qualquer celular.
 */
export function formatBRL(cents: Cents): string {
  const abs = Math.round(Math.abs(cents));
  const sign = cents < 0 && abs > 0 ? '-' : '';
  const reais = Math.floor(abs / 100);
  const resto = abs % 100;
  const reaisComPontos = reais.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}R$ ${reaisComPontos},${resto.toString().padStart(2, '0')}`;
}

/**
 * Converte o que o usuário digitou no teclado numérico em centavos (padrão "maquininha"):
 * digitou 2500 -> 2500 centavos -> R$ 25,00. Ignora tudo que não for dígito.
 */
export function centsFromDigits(input: string): Cents {
  const digits = input.replace(/\D/g, '').slice(0, MAX_DIGITS);
  return digits === '' ? 0 : Number.parseInt(digits, 10);
}

/** Total de uma linha: quantidade x valor unitário. */
export function multiplyCents(unitCents: Cents, quantity: number): Cents {
  return unitCents * quantity;
}
