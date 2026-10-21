import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { colors, fontSize, spacing } from '@/theme';

interface Props {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Estado vazio ou de erro: explica o que houve e oferece o próximo passo. */
export function StateMessage({ title, description, actionLabel, onAction }: Props) {
  return (
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
}

export function LoadingState() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

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
