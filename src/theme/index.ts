/**
 * Identidade visual "carrinho de coco": areia clara de fundo, verde-palmeira como cor principal
 * e amarelo-sol só como toque de destaque. Tema claro apenas, pensado para ler ao sol.
 * Tudo que for visual usa estes tokens, para trocar a cara do app em um só lugar.
 */
export const colors = {
  background: '#FFF8EC', // areia
  surface: '#FFFFFF',
  text: '#2B2A26',
  textMuted: '#5E5A4F',
  border: '#E8DEC9',
  primary: '#1F6B45', // verde palmeira
  primaryDark: '#154A30',
  onPrimary: '#FFFFFF',
  accent: '#F2A93B', // amarelo sol
  accentSoft: '#FCEBC8',
  /** Só para mensagens de erro do app. Prejuízo do dia NÃO usa esta cor. */
  danger: '#B83A2B',
  /** Cartão de resumo (verde escuro) e o que vai sobre ele */
  hero: '#154A30',
  onHero: '#FFFFFF',
  onHeroMuted: 'rgba(255, 255, 255, 0.8)',
  heroPanel: 'rgba(255, 255, 255, 0.14)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  md: 14,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

export const fontSize = {
  caption: 13,
  small: 14,
  body: 17,
  title: 22,
  /** Números grandes do resumo (bruto, despesas, líquido) */
  hero: 46,
} as const;

/** Sombra suave dos cartões (boxShadow, nunca elevation). */
export const shadow = {
  card: '0 2px 10px rgba(21, 74, 48, 0.08)',
  hero: '0 8px 24px rgba(21, 74, 48, 0.25)',
} as const;

/** Tamanho mínimo de área de toque confortável para dedos e mãos ocupadas. */
export const touchTarget = 52;
