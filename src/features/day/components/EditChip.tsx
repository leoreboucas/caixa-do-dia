import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/features/shared';
import { colors, fontSize, radius, spacing } from '@/theme';

const EditChip = () => {
  return (
    <View style={styles.chip}>
      <Ionicons name="pencil" size={14} color={colors.primary} />
      <Text style={styles.label}>Editar</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  label: { fontSize: fontSize.caption, fontWeight: '700', color: colors.primary },
});

export default EditChip;
