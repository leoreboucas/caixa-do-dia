import { type GestureResponderEvent, ScrollView, StyleSheet, View } from 'react-native';
import { DayContent } from '@/features/day/components';
import { StepPicker, formatDateKeyBR, weekdayNameBR, type DateKey } from '@/features/shared';
import { colors, spacing } from '@/theme';

interface DayPaneProps {
  date: DateKey;
  index: number;
  width: number;
  isCurrent: boolean;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onScrollY: (y: number) => void;
  touch: {
    onTouchStart: (event: GestureResponderEvent) => void;
    onTouchMove: (event: GestureResponderEvent) => void;
    onTouchEnd: () => void;
  };
}

const DayPane = ({
  date,
  index,
  width,
  isCurrent,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  onScrollY,
  touch,
}: DayPaneProps) => (
  <View
    pointerEvents={isCurrent ? 'auto' : 'none'}
    style={[styles.pane, { transform: [{ translateX: index * width }] }]}
  >
    <ScrollView
      scrollEventThrottle={16}
      onScroll={(event) => {
        if (isCurrent) onScrollY(event.nativeEvent.contentOffset.y);
      }}
      bounces={false}
      overScrollMode="never"
      onTouchStart={isCurrent ? touch.onTouchStart : undefined}
      onTouchMove={isCurrent ? touch.onTouchMove : undefined}
      onTouchEnd={isCurrent ? touch.onTouchEnd : undefined}
      onTouchCancel={isCurrent ? touch.onTouchEnd : undefined}
      contentInsetAdjustmentBehavior="automatic"
      style={styles.scroll}
      contentContainerStyle={styles.content}
    >
      <StepPicker
        title={formatDateKeyBR(date)}
        subtitle={weekdayNameBR(date)}
        prevLabel="Dia anterior"
        nextLabel="Próximo dia"
        onPrev={onPrevious}
        onNext={onNext}
        prevDisabled={!hasPrevious}
        nextDisabled={!hasNext}
      />
      <DayContent date={date} />
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  pane: { ...StyleSheet.absoluteFill, backgroundColor: colors.background },
  scroll: { backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
});

export default DayPane;
