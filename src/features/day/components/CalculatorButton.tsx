import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable } from 'react-native';
import type { DateKey } from '@/features/shared';
import { colors } from '@/theme';

const CalculatorButton = ({ date }: { date: DateKey }) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel="Calculadora"
    hitSlop={12}
    onPress={() => router.push({ pathname: '/calculator', params: { date } })}
  >
    <Ionicons name="calculator-outline" size={26} color={colors.primaryDark} />
  </Pressable>
);

export default CalculatorButton;
