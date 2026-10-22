import { StyleSheet, View } from 'react-native';
import { formatBRL, type Cents } from '@/features/shared/utils';
import { colors, fontSize, radius, spacing } from '@/theme';
import Text from './Text';

const Stat = ({ label, valueCents }: { label: string; valueCents: Cents }) => (
  <View style={styles.stat}>
    <Text style={styles.label}>{label}</Text>
    <Text selectable adjustsFontSizeToFit numberOfLines={1} style={styles.value}>
      {formatBRL(valueCents)}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  stat: {
    flex: 1,
    gap: spacing.xs,
    backgroundColor: colors.heroPanel,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    padding: spacing.md,
  },
  label: { fontSize: fontSize.caption, fontWeight: '600', color: colors.onHeroMuted },
  value: {
    fontSize: fontSize.title,
    fontWeight: '700',
    color: colors.onHero,
    fontVariant: ['tabular-nums'],
  },
});

export default Stat;
