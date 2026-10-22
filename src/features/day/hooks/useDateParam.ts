import { useLocalSearchParams } from 'expo-router';
import { isValidDateKey, todayKey, type DateKey } from '@/features/shared';

const useDateParam = (): DateKey => {
  const { date } = useLocalSearchParams<{ date?: string }>();
  return date && isValidDateKey(date) ? date : todayKey();
};

export default useDateParam;
