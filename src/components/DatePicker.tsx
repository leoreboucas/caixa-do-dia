import { StepPicker } from '@/components/StepPicker';
import { addDays, formatDateKeyBR, weekdayNameBR, type DateKey } from '@/domain/date';

interface Props {
  value: DateKey;
  onChange: (date: DateKey) => void;
  /** Última data permitida (normalmente hoje). Não dá para lançar dias que ainda não aconteceram. */
  max: DateKey;
}

/** Seletor de data simples para poucos toques: anda um dia para trás ou para frente. */
export function DatePicker({ value, onChange, max }: Props) {
  return (
    <StepPicker
      title={formatDateKeyBR(value)}
      subtitle={weekdayNameBR(value)}
      prevLabel="Dia anterior"
      nextLabel="Próximo dia"
      onPrev={() => onChange(addDays(value, -1))}
      onNext={() => onChange(addDays(value, 1))}
      nextDisabled={value >= max}
    />
  );
}
