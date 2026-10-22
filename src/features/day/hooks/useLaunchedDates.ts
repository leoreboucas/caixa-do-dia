import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { listClosingDates } from '@/features/day/services';
import type { DateKey } from '@/features/shared';

const useLaunchedDates = (initialDate: DateKey): DateKey[] => {
  const [dates, setDates] = useState<DateKey[]>([]);

  useFocusEffect(
    useCallback(() => {
      listClosingDates()
        .then(setDates)
        .catch(() => setDates([]));
    }, []),
  );

  return useMemo(
    () => (dates.includes(initialDate) ? dates : [...dates, initialDate].sort()),
    [dates, initialDate],
  );
};

export default useLaunchedDates;
