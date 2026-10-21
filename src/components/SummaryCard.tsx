import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatBRL, type Cents } from '@/domain/money';
import { colors, fontSize, radius, shadow, spacing } from '@/theme';

interface Props {
  label: string;
  valueCents: Cents;
  /** Frase curta que explica o número em linguagem do dia a dia. */
  description?: string;
  children?: ReactNode;
}

/** O número mais importante da tela, grande e logo de cara, no cartão verde da identidade. */
export function SummaryCard({ label, valueCents, description, children }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.sun} />
      <Text style={styles.label}>{label}</Text>
      <Text selectable adjustsFontSizeToFit numberOfLines={1} style={styles.value}>
        {formatBRL(valueCents)}
      </Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {children ? <View style={styles.stats}>{children}</View> : null}
    </View>
  );
}

export function Stat({ label, valueCents }: { label: string; valueCents: Cents }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text selectable adjustsFontSizeToFit numberOfLines={1} style={styles.statValue}>
        {formatBRL(valueCents)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.hero,
    borderRadius: radius.xl,
    borderCurve: 'continuous',
    boxShadow: shadow.hero,
    padding: spacing.lg,
    gap: spacing.xs,
    overflow: 'hidden',
  },
  /** Sol decorativo no canto, a única pincelada de amarelo do cartão */
  sun: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 110,
    height: 110,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    opacity: 0.9,
  },
  label: { fontSize: fontSize.small, fontWeight: '600', color: colors.onHeroMuted },
  value: {
    fontSize: fontSize.hero,
    fontWeight: '800',
    color: colors.onHero,
    fontVariant: ['tabular-nums'],
  },
  description: { fontSize: fontSize.small, color: colors.onHeroMuted, lineHeight: 20 },
  stats: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  stat: {
    flex: 1,
    gap: spacing.xs,
    backgroundColor: colors.heroPanel,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    padding: spacing.md,
  },
  statLabel: { fontSize: fontSize.caption, fontWeight: '600', color: colors.onHeroMuted },
  statValue: {
    fontSize: fontSize.title,
    fontWeight: '700',
    color: colors.onHero,
    fontVariant: ['tabular-nums'],
  },
});
