import type { ReactNode } from 'react';
import { type GestureResponderEvent, ScrollView, StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/theme';

interface DayPaneProps {
  index: number;
  width: number;
  isCurrent: boolean;
  children: ReactNode;
  onScrollY: (y: number) => void;
  touch?: {
    onTouchStart: (event: GestureResponderEvent) => void;
    onTouchMove: (event: GestureResponderEvent) => void;
    onTouchEnd: () => void;
  };
}

const DayPane = ({ index, width, isCurrent, children, onScrollY, touch }: DayPaneProps) => {
  const touchEnabled = isCurrent && touch;

  return (
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
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        onTouchStart={touchEnabled ? touch.onTouchStart : undefined}
        onTouchMove={touchEnabled ? touch.onTouchMove : undefined}
        onTouchEnd={touchEnabled ? touch.onTouchEnd : undefined}
        onTouchCancel={touchEnabled ? touch.onTouchEnd : undefined}
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scroll}
        contentContainerStyle={styles.content}
      >
        {children}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  pane: { ...StyleSheet.absoluteFill, backgroundColor: colors.background },
  scroll: { backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
});

export default DayPane;
