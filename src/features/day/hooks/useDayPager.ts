import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import { useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { listClosingDates } from '@/features/day/services';
import type { DateKey } from '@/features/shared';
import { motion } from '@/theme/motion';

const SWIPE_START = 16;
const SWIPE_RESISTANCE = 0.8;
const SWIPE_DISTANCE_RATIO = 0.25;
const SWIPE_VELOCITY = 1000;
const EDGE_RESISTANCE = 0.3;
const MIN_SWIPE_DISTANCE = 40;

const useDayPager = (initialDate: DateKey) => {
  const { width } = useWindowDimensions();
  const [date, setDate] = useState<DateKey>(initialDate);
  const dateRef = useRef<DateKey>(initialDate);
  const [pages, setPages] = useState<DateKey[]>([initialDate]);
  const translateX = useSharedValue(0);
  const swiping = useSharedValue(false);
  const swipeStart = useSharedValue(0);
  const targetIndex = useSharedValue(0);

  const index = Math.max(0, pages.indexOf(date));
  const maxIndex = pages.length - 1;

  useFocusEffect(
    useCallback(() => {
      listClosingDates()
        .then((list) => {
          const merged = list.includes(initialDate) ? list : [...list, initialDate].sort();
          setPages(merged);
          const at = Math.max(0, merged.indexOf(dateRef.current));
          targetIndex.set(at);
          translateX.set(-at * width);
        })
        .catch(() => undefined);
    }, [initialDate, translateX, targetIndex, width]),
  );

  useEffect(() => {
    dateRef.current = date;
  }, [date]);

  const goToIndex = useCallback(
    (target: number) => {
      const clamped = Math.min(Math.max(target, 0), maxIndex);
      const targetDate = pages[clamped];
      if (!targetDate) return;
      setDate(targetDate);
      targetIndex.set(clamped);
      translateX.set(withTiming(-clamped * width, { duration: motion.slideMs, easing: motion.easeOut }));
    },
    [pages, maxIndex, width, translateX, targetIndex],
  );

  const swipe = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-SWIPE_START, SWIPE_START])
        .failOffsetY([-SWIPE_START, SWIPE_START])
        .onStart(() => {
          swiping.set(true);
          swipeStart.set(translateX.get());
        })
        .onUpdate((event) => {
          const dragged =
            Math.sign(event.translationX) *
            Math.max(0, Math.abs(event.translationX) - SWIPE_START) *
            SWIPE_RESISTANCE;
          const raw = swipeStart.get() + dragged;
          const min = -maxIndex * width;
          if (raw > 0) translateX.set(raw * EDGE_RESISTANCE);
          else if (raw < min) translateX.set(min + (raw - min) * EDGE_RESISTANCE);
          else translateX.set(raw);
        })
        .onEnd((event, success) => {
          const startIndex = targetIndex.get();
          const moved = translateX.get() - swipeStart.get();
          const distance = width * SWIPE_DISTANCE_RATIO;
          let target = startIndex;
          if (
            success &&
            (moved > distance || (moved > MIN_SWIPE_DISTANCE && event.velocityX > SWIPE_VELOCITY))
          ) {
            target = startIndex - 1;
          } else if (
            success &&
            (moved < -distance || (moved < -MIN_SWIPE_DISTANCE && event.velocityX < -SWIPE_VELOCITY))
          ) {
            target = startIndex + 1;
          }
          target = Math.min(Math.max(target, 0), maxIndex);
          targetIndex.set(target);

          const targetDate = pages[target];
          if (targetDate) scheduleOnRN(setDate, targetDate);
          if (target === startIndex) translateX.set(withSpring(-target * width, motion.spring));
          else
            translateX.set(withTiming(-target * width, { duration: motion.slideMs, easing: motion.easeOut }));
        })
        .onFinalize(() => {
          swiping.set(false);
        }),
    [pages, maxIndex, width, translateX, swiping, swipeStart, targetIndex],
  );

  return { pages, index, maxIndex, swipe, translateX, swiping, goToIndex };
};

export default useDayPager;
