import { useMemo } from 'react';
import { CashDay, DatePicker, DayPager } from '@/features/day/components';
import { useDefaultCashDate } from '@/features/day/hooks';
import { cashPages } from '@/features/day/utils';
import { LoadingState, todayKey } from '@/features/shared';

const CashScreen = () => {
  const initialDate = useDefaultCashDate();
  const today = todayKey();
  const pages = useMemo(() => cashPages(today), [today]);

  if (!initialDate) return <LoadingState />;

  return (
    <DayPager
      pages={pages}
      initialDate={initialDate}
      renderPage={({ date, goToDate }) => (
        <>
          <DatePicker value={date} onChange={goToDate} min={pages[0]} max={today} />
          <CashDay date={date} />
        </>
      )}
    />
  );
};

export default CashScreen;
