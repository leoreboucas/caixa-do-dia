import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Card,
  StepPicker,
  addDays,
  formatDateKeyBR,
  parseDateKey,
  toDateKey,
  type DateKey,
  weekdayNameBR,
} from '@/features/shared';
import { colors, spacing } from '@/theme';

const DatePicker = ({
  value,
  onChange,
  max,
  min,
}: {
  value: DateKey;
  onChange: (date: DateKey) => void;
  max: DateKey;
  min?: DateKey;
}) => {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const isIOS = process.env.EXPO_OS === 'ios';

  const maxDate = parseDateKey(max);
  maxDate.setHours(23, 59, 59, 0);

  function pick(date: Date) {
    const key = toDateKey(date);
    const clamped = key > max ? max : key;
    onChange(min && clamped < min ? min : clamped);
    setCalendarOpen(false);
  }

  return (
    <>
      <StepPicker
        title={formatDateKeyBR(value)}
        subtitle={weekdayNameBR(value)}
        prevLabel="Dia anterior"
        nextLabel="Próximo dia"
        onPrev={() => onChange(addDays(value, -1))}
        onNext={() => onChange(addDays(value, 1))}
        prevDisabled={!!min && value <= min}
        nextDisabled={value >= max}
        onPressCenter={() => setCalendarOpen((open) => !open)}
        centerHint="Toque para escolher a data no calendário"
      />

      {calendarOpen && isIOS ? (
        <Card>
          <View style={styles.calendar}>
            <DateTimePicker
              value={parseDateKey(value)}
              mode="date"
              display="inline"
              maximumDate={maxDate}
              minimumDate={min ? parseDateKey(min) : undefined}
              accentColor={colors.primary}
              locale="pt_BR"
              themeVariant="light"
              onValueChange={(_event, date) => pick(date)}
            />
          </View>
        </Card>
      ) : null}

      {calendarOpen && !isIOS ? (
        <DateTimePicker
          value={parseDateKey(value)}
          mode="date"
          presentation="dialog"
          maximumDate={maxDate}
          minimumDate={min ? parseDateKey(min) : undefined}
          accentColor={colors.primary}
          onValueChange={(_event, date) => pick(date)}
          onDismiss={() => setCalendarOpen(false)}
        />
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  calendar: { padding: spacing.xs },
});

export default DatePicker;
