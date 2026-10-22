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
}: {
  value: DateKey;
  onChange: (date: DateKey) => void;
  max: DateKey;
}) => {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const isIOS = process.env.EXPO_OS === 'ios';

  const maxDate = parseDateKey(max);
  maxDate.setHours(23, 59, 59, 0);

  function pick(date: Date) {
    const key = toDateKey(date);
    onChange(key > max ? max : key);
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
