import { StyleSheet, View } from 'react-native';
import { colors, fontSize, spacing } from '@/theme';
import Button from './Button';
import Text from './Text';

const StateMessage = ({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) => (
  <View style={styles.container}>
    <Text selectable style={styles.title}>
      {title}
    </Text>
    {description ? (
      <Text selectable style={styles.description}>
        {description}
      </Text>
    ) : null}
    {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  title: { fontSize: fontSize.title, fontWeight: '700', color: colors.primaryDark, textAlign: 'center' },
  description: { fontSize: fontSize.body, color: colors.textMuted, textAlign: 'center' },
});

export default StateMessage;
