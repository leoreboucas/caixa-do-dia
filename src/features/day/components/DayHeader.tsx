import { StyleSheet, View } from 'react-native';
import { ClosingStatus, closingStatusLabels, type DateKey, formatDateKeyBR, Text } from '@/features/shared';
import { colors, fontSize, radius, spacing } from '@/theme';

const DayHeader = ({ date, status }: { date: DateKey; status?: ClosingStatus }) => (
  <View style={styles.row}>
    <Text style={styles.date}>{formatDateKeyBR(date)}</Text>
    {status ? (
      <View style={styles.status}>
        <View style={[styles.dot, status === ClosingStatus.OPEN && styles.dotOpen]} />
        <Text style={styles.statusText}>{closingStatusLabels[status]}</Text>
      </View>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  date: {
    fontSize: fontSize.small,
    fontWeight: '600',
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  dot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: colors.textMuted },
  dotOpen: { backgroundColor: colors.accent },
  statusText: { fontSize: fontSize.caption, fontWeight: '700', color: colors.text },
});

export default DayHeader;
