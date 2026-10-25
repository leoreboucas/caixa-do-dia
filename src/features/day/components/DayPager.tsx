import { Stack } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useDayPager, usePullToClose } from '@/features/day/hooks';
import { Text, type DateKey } from '@/features/shared';
import { colors, fontSize, spacing } from '@/theme';
import { motion } from '@/theme/motion';
import CalculatorButton from './CalculatorButton';
import DayPane from './DayPane';

interface PagerPage {
  date: DateKey;
  index: number;
  maxIndex: number;
  goToIndex: (index: number) => void;
  goToDate: (date: DateKey) => void;
}

interface DayPagerProps {
  pages: DateKey[];
  initialDate: DateKey;
  closeOnPull?: boolean;
  renderPage: (page: PagerPage) => ReactNode;
}

const PRELOAD = 2;
const MAX_SHRINK = 0.05;
const MAX_FADE = 0.25;

const DayPager = ({ pages, initialDate, closeOnPull = false, renderPage }: DayPagerProps) => {
  const { width } = useWindowDimensions();
  const { index, maxIndex, swipe, translateX, swiping, goToIndex, goToDate } = useDayPager(
    initialDate,
    pages,
  );
  const { touch, translateY, scrollY, closing } = usePullToClose(swiping);

  const slideStyle = useAnimatedStyle(() => {
    const pull = interpolate(translateY.get(), [0, motion.dismissTrigger * 2], [0, 1], Extrapolation.CLAMP);
    return {
      opacity: 1 - pull * MAX_FADE,
      transform: [
        { translateX: translateX.get() },
        { translateY: translateY.get() },
        { scale: 1 - pull * MAX_SHRINK },
      ],
    };
  });
  const hintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.get(), [10, motion.dismissTrigger * 0.7], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <View style={styles.clip}>
      <Stack.Screen
        options={{
          animation: closeOnPull && closing ? 'fade' : 'default',
          headerRight: () => <CalculatorButton date={pages[index] ?? initialDate} />,
        }}
      />
      {closeOnPull ? (
        <Animated.View pointerEvents="none" style={[styles.hint, hintStyle]}>
          <Text style={styles.hintText}>Puxe para voltar ao Histórico</Text>
        </Animated.View>
      ) : null}
      <GestureDetector gesture={swipe}>
        <Animated.View style={[styles.fill, slideStyle]}>
          {pages.map((date, pageIndex) =>
            Math.abs(pageIndex - index) <= PRELOAD ? (
              <DayPane
                key={date}
                index={pageIndex}
                width={width}
                isCurrent={pageIndex === index}
                onScrollY={(y) => scrollY.set(y)}
                touch={closeOnPull ? touch : undefined}
              >
                {renderPage({ date, index: pageIndex, maxIndex, goToIndex, goToDate })}
              </DayPane>
            ) : null,
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  clip: { flex: 1, overflow: 'hidden', backgroundColor: colors.background },
  fill: { flex: 1, backgroundColor: colors.background },
  hint: { position: 'absolute', top: spacing.md, left: 0, right: 0, alignItems: 'center' },
  hintText: { fontSize: fontSize.small, fontWeight: '600', color: colors.textMuted },
});

export default DayPager;
