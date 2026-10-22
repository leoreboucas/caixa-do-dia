import { StepPicker } from '@/features/shared';
import { addMonths, formatMonthBR, type MonthKey } from '@/features/reports/utils';

const MonthPicker = ({
  value,
  onChange,
  max,
  min,
}: {
  value: MonthKey;
  onChange: (month: MonthKey) => void;
  max: MonthKey;
  min: MonthKey;
}) => {
  return (
    <StepPicker
      title={formatMonthBR(value)}
      prevLabel="Mês anterior"
      nextLabel="Próximo mês"
      onPrev={() => onChange(addMonths(value, -1))}
      onNext={() => onChange(addMonths(value, 1))}
      prevDisabled={value <= min}
      nextDisabled={value >= max}
    />
  );
};

export default MonthPicker;
