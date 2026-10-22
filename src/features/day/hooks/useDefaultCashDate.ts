import { useEffect, useState } from 'react';
import { listClosingDates } from '@/features/day/services';
import { defaultCashDate } from '@/features/day/utils';
import { addDays, todayKey, type DateKey } from '@/features/shared';

const useDefaultCashDate = (): DateKey | null => {
  const [date, setDate] = useState<DateKey | null>(null);

  useEffect(() => {
    const today = todayKey();
    listClosingDates()
      .then((dates) => setDate(defaultCashDate(today, dates[dates.length - 1])))
      .catch(() => setDate(addDays(today, -1)));
  }, []);

  return date;
};

export default useDefaultCashDate;
