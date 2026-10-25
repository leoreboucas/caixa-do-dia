import { useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { isEmpty, type Entry, type EntryField } from '@/features/calculator/utils';
import { Text } from '@/features/shared';
import { colors, fontSize, radius, spacing } from '@/theme';

interface CalculationHistoryProps {
  entries: Entry[];
  cursor: number;
  field: EntryField;
  onSelectNumber: (index: number) => void;
  onSelectOperator: (index: number) => void;
}

const CalculationHistory = ({
  entries,
  cursor,
  field,
  onSelectNumber,
  onSelectOperator,
}: CalculationHistoryProps) => {
  const scrollRef = useRef<ScrollViewInstance>(null);
  const lastIndex = entries.length - 1;
  const hasSeveral = entries.length > 1;

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      onContentSizeChange={() => {
        if (cursor === lastIndex) scrollRef.current?.scrollToEnd({ animated: false });
      }}
      style={styles.scroll}
      contentContainerStyle={styles.content}
    >
      {isEmpty(entries) ? <Text style={styles.number}>0</Text> : null}
      {isEmpty(entries)
        ? null
        : entries.map((entry, index) => {
            const isCurrent = hasSeveral && index === cursor;
            const isDraftTail = index === lastIndex && entry.value === '';
            return (
              <View key={index} style={styles.entry}>
                {entry.operator ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Trocar o operador ${entry.operator}`}
                    hitSlop={{ top: 12, bottom: 12, left: 4, right: 4 }}
                    onPress={() => onSelectOperator(index)}
                    style={[styles.operatorButton, isCurrent && field === 'operator' && styles.selected]}
                  >
                    <Text style={styles.operator}>{entry.operator}</Text>
                  </Pressable>
                ) : null}
                {isDraftTail ? null : (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Corrigir ${entry.value === '' ? 'número em branco' : entry.value}`}
                    hitSlop={{ top: 12, bottom: 12, left: 4, right: 4 }}
                    onPress={() => onSelectNumber(index)}
                    style={[styles.numberButton, isCurrent && field === 'value' && styles.selected]}
                  >
                    <Text style={styles.number}>{entry.value === '' ? '_' : entry.value}</Text>
                  </Pressable>
                )}
              </View>
            );
          })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { alignSelf: 'stretch', flexGrow: 0 },
  content: { flexGrow: 1, justifyContent: 'flex-end', alignItems: 'center' },
  entry: { flexDirection: 'row', alignItems: 'center' },
  operatorButton: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.md },
  operator: { fontSize: fontSize.title, color: colors.primary, fontWeight: '800' },
  numberButton: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.md },
  selected: { backgroundColor: colors.accentSoft },
  number: { fontSize: fontSize.title, color: colors.textMuted, fontVariant: ['tabular-nums'] },
});

export default CalculationHistory;
