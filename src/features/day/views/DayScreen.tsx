import { Stack } from 'expo-router';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { DayPane } from '@/features/day/components';
import { useDateParam, useDayPager, usePullToClose } from '@/features/day/hooks';
import { motion } from '@/theme/motion';
import { Text } from '@/features/shared';
import { colors, fontSize, spacing } from '@/theme';

const PRELOAD = 2;
const MAX_SHRINK = 0.05;
const MAX_FADE = 0.25;

const DayScreen = () => {
  const initialDate = useDateParam();
  const { width } = useWindowDimensions();
  const { pages, index, maxIndex, swipe, translateX, swiping, goToIndex } = useDayPager(initialDate);
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
      <Stack.Screen options={{ animation: closing ? 'fade' : 'default' }} />
      <Animated.View pointerEvents="none" style={[styles.hint, hintStyle]}>
        <Text style={styles.hintText}>Puxe para voltar ao Histórico</Text>
      </Animated.View>
      <GestureDetector gesture={swipe}>
        <Animated.View style={[styles.fill, slideStyle]}>
          {pages.map((pageDate, pageIndex) =>
            Math.abs(pageIndex - index) <= PRELOAD ? (
              <DayPane
                key={pageDate}
                date={pageDate}
                index={pageIndex}
                width={width}
                isCurrent={pageIndex === index}
                hasPrevious={pageIndex > 0}
                hasNext={pageIndex < maxIndex}
                onPrevious={() => goToIndex(pageIndex - 1)}
                onNext={() => goToIndex(pageIndex + 1)}
                onScrollY={(y) => scrollY.set(y)}
                touch={touch}
              />
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

export default DayScreen;
