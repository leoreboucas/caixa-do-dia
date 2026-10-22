import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { type GestureResponderEvent, useWindowDimensions } from 'react-native';
import { type SharedValue, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { motion } from '@/theme/motion';

const DISMISS_START = 24;
const DISMISS_RESISTANCE = 0.55;
const DISMISS_FLICK_MIN = 60;
const DISMISS_FLICK_SPEED = 1.4;
const SPEED_SAMPLE_MS = 60;
const TOP_TOLERANCE = 1;

const usePullToClose = (swiping: SharedValue<boolean>) => {
  const { height } = useWindowDimensions();
  const [closing, setClosing] = useState(false);
  const translateY = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const drag = useRef({
    startX: 0,
    startY: 0,
    lastY: 0,
    lastTime: 0,
    sampleY: 0,
    sampleTime: 0,
    active: false,
  });

  const touch = useMemo(
    () => ({
      onTouchStart: (event: GestureResponderEvent) => {
        const { pageX, pageY, timestamp } = event.nativeEvent;
        drag.current = {
          startX: pageX,
          startY: pageY,
          lastY: pageY,
          lastTime: timestamp,
          sampleY: pageY,
          sampleTime: timestamp,
          active: false,
        };
      },
      onTouchMove: (event: GestureResponderEvent) => {
        const state = drag.current;
        const { pageX, pageY, timestamp } = event.nativeEvent;
        const dx = pageX - state.startX;
        const dy = pageY - state.startY;
        if (!state.active) {
          const atTop = scrollY.get() <= TOP_TOLERANCE && !swiping.get();
          if (!(atTop && dy > DISMISS_START && Math.abs(dx) < dy)) return;
          state.active = true;
          setClosing(true);
        }
        if (timestamp - state.sampleTime > SPEED_SAMPLE_MS) {
          state.sampleY = state.lastY;
          state.sampleTime = state.lastTime;
        }
        state.lastY = pageY;
        state.lastTime = timestamp;
        translateY.set(Math.max(0, dy - DISMISS_START) * DISMISS_RESISTANCE);
      },
      onTouchEnd: () => {
        const state = drag.current;
        if (!state.active) return;
        state.active = false;
        const moved = translateY.get();
        const speed = (state.lastY - state.sampleY) / Math.max(1, state.lastTime - state.sampleTime);
        const shouldClose =
          moved > motion.dismissTrigger || (moved > DISMISS_FLICK_MIN && speed > DISMISS_FLICK_SPEED);
        if (shouldClose) {
          router.back();
          translateY.set(withTiming(height, { duration: motion.exitMs, easing: motion.easeOut }));
        } else {
          setClosing(false);
          translateY.set(withSpring(0, motion.spring));
        }
      },
    }),
    [height, translateY, scrollY, swiping],
  );

  return { touch, translateY, scrollY, closing };
};

export default usePullToClose;
