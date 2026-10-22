import { DayContent, DayPager } from '@/features/day/components';
import { useDateParam, useLaunchedDates } from '@/features/day/hooks';
import { StepPicker, formatDateKeyBR, weekdayNameBR } from '@/features/shared';

const DayScreen = () => {
  const initialDate = useDateParam();
  const pages = useLaunchedDates(initialDate);

  return (
    <DayPager
      pages={pages}
      initialDate={initialDate}
      closeOnPull
      renderPage={({ date, index, maxIndex, goToIndex }) => (
        <>
          <StepPicker
            title={formatDateKeyBR(date)}
            subtitle={weekdayNameBR(date)}
            prevLabel="Dia anterior"
            nextLabel="Próximo dia"
            onPrev={() => goToIndex(index - 1)}
            onNext={() => goToIndex(index + 1)}
            prevDisabled={index === 0}
            nextDisabled={index === maxIndex}
          />
          <DayContent date={date} />
        </>
      )}
    />
  );
};

export default DayScreen;
