export const colors = {
  background: '#FFF8EC',
  surface: '#FFFFFF',
  text: '#2B2A26',
  textMuted: '#5E5A4F',
  border: '#E8DEC9',
  primary: '#1F6B45',
  primaryDark: '#154A30',
  onPrimary: '#FFFFFF',
  accent: '#F2A93B',
  accentSoft: '#FCEBC8',

  danger: '#B83A2B',

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

  hero: 46,
} as const;

export const shadow = {
  card: '0 2px 10px rgba(21, 74, 48, 0.08)',
  hero: '0 8px 24px rgba(21, 74, 48, 0.25)',
} as const;

export const maxFontScale = 1.6;

export const maxHeroFontScale = 1.25;

export const largeTextScale = 1.3;

export const touchTarget = 52;
