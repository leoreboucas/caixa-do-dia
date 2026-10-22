import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLargeText } from '@/features/shared/hooks';
import { formatBRL, type Cents } from '@/features/shared/utils';
import { colors, fontSize, maxHeroFontScale, radius, shadow, spacing } from '@/theme';
import Text from './Text';

const SummaryCard = ({
  label,
  valueCents,
  description,
  children,
}: {
  label: string;
  valueCents: Cents;
  description?: string;
  children?: ReactNode;
}) => {
  const largeText = useLargeText();

  return (
    <View style={styles.card}>
      <View style={styles.sun} />
      <Text style={styles.label}>{label}</Text>
      <Text
        selectable
        adjustsFontSizeToFit
        numberOfLines={1}
        maxFontSizeMultiplier={maxHeroFontScale}
        style={styles.value}
      >
        {formatBRL(valueCents)}
      </Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {children ? <View style={[styles.stats, largeText && styles.statsStacked]}>{children}</View> : null}
    </View>
  );
};

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
  statsStacked: { flexDirection: 'column' },
});

export default SummaryCard;
