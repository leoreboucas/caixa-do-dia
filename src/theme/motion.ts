import { Easing } from 'react-native-reanimated';

export const motion = {
  slideMs: 260,
  exitMs: 280,
  dismissTrigger: 110,
  spring: { damping: 22, stiffness: 240 },
  easeOut: Easing.bezier(0.23, 1, 0.32, 1),
};
