import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/features/shared';
import { colors, fontSize, radius, spacing } from '@/theme';
import EditChip from './EditChip';

interface StepRowProps {
  title: string;
  detail: string;
  value?: string;
  done?: boolean;
  divider?: boolean;
  onEdit?: () => void;
}

const StepRow = ({ title, detail, value, done = false, divider = false, onEdit }: StepRowProps) => (
  <Pressable
    accessibilityRole={onEdit ? 'button' : undefined}
    accessibilityHint={onEdit ? 'Toque para editar' : undefined}
    disabled={!onEdit}
    onPress={onEdit}
    style={({ pressed }) => [styles.step, divider && styles.divider, pressed && styles.pressed]}
  >
    <View style={[styles.check, done && styles.checkDone]}>
      <Text style={styles.checkMark}>{done ? '✓' : ''}</Text>
    </View>
    <View style={styles.text}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.detail}>{detail}</Text>
    </View>
    <View style={styles.right}>
      {value ? (
        <Text selectable style={styles.value}>
          {value}
        </Text>
      ) : null}
      {onEdit ? <EditChip /> : null}
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  step: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  pressed: { backgroundColor: colors.accentSoft },
  check: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkMark: { fontSize: fontSize.small, fontWeight: '800', color: colors.onPrimary },
  text: { flex: 1, gap: 2 },
  title: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  detail: { fontSize: fontSize.small, color: colors.textMuted },
  right: { alignItems: 'flex-end', gap: spacing.xs, flexShrink: 0 },
  value: { fontSize: fontSize.body, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
});

export default StepRow;
