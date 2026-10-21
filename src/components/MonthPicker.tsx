import { StepPicker } from '@/components/StepPicker';
import { addMonths, formatMonthBR, type MonthKey } from '@/domain/report';

interface Props {
  value: MonthKey;
  onChange: (month: MonthKey) => void;
  /** Último mês permitido (normalmente o mês atual) */
  max: MonthKey;
  /** Primeiro mês com dados; antes dele não há o que mostrar */
  min: MonthKey;
}

/** Seletor de mês: anda um mês para trás ou para frente. */
export function MonthPicker({ value, onChange, max, min }: Props) {
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
}
