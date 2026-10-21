import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '@/theme';

/** Tela provisória: serve só para validar navegação e tema até desenharmos as telas reais. */
export function ScreenPlaceholder({ description }: { description: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  description: { fontSize: fontSize.body, color: colors.textMuted, textAlign: 'center' },
});
