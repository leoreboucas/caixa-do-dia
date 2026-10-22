import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, shadow, spacing } from '@/theme';

const Card = ({
  children,
  flush = false,
  style,
}: {
  children: ReactNode;
  flush?: boolean;
  style?: StyleProp<ViewStyle>;
}) => {
  return <View style={[styles.card, flush ? null : styles.padded, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: shadow.card,
    overflow: 'hidden',
  },
  padded: { padding: spacing.md, gap: spacing.sm },
});

export default Card;
