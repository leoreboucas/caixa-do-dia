import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import type { ClosingWithItems } from '@/features/day';
import { listClosingsBetween } from '@/features/day';
import { AllMonthsView, MonthReportView } from '@/features/reports/components';
import { monthKeyOf, type MonthKey } from '@/features/reports/utils';
import { LoadingState, SegmentedChoice, StateMessage, todayKey } from '@/features/shared';
import { colors, spacing } from '@/theme';

type Mode = 'month' | 'all';
const MODE_OPTIONS = [
  { value: 'month', label: 'Por mês' },
  { value: 'all', label: 'Todos os meses' },
] as const;

type Load =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; closings: ClosingWithItems[] };

const ReportsScreen = () => {
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [mode, setMode] = useState<Mode>('month');
  const currentMonth = monthKeyOf(todayKey());
  const [month, setMonth] = useState<MonthKey>(currentMonth);
  const hasData = useRef(false);

  const refresh = useCallback(() => {
    listClosingsBetween('1900-01-01', '9999-12-31')
      .then((closings) => {
        hasData.current = true;
        setLoad({ status: 'ready', closings });
      })
      .catch((e: unknown) => {
        if (hasData.current) return;
        setLoad({ status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido' });
      });
  }, []);

  useFocusEffect(refresh);

  if (load.status === 'loading') return <LoadingState />;
  if (load.status === 'error') {
    return (
      <StateMessage
        title="Não foi possível carregar os relatórios"
        description={load.message}
        actionLabel="Tentar novamente"
        onAction={() => {
          setLoad({ status: 'loading' });
          refresh();
        }}
      />
    );
  }

  const { closings } = load;
  if (closings.length === 0) {
    return (
      <StateMessage
        title="Sem dados"
        description="Os relatórios aparecem após o fechamento do primeiro dia."
      />
    );
  }

  const firstMonth = monthKeyOf((closings[closings.length - 1] as ClosingWithItems).date);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.scroll}
      contentContainerStyle={styles.content}
    >
      <SegmentedChoice options={MODE_OPTIONS} value={mode} onChange={setMode} />

      {mode === 'month' ? (
        <MonthReportView
          closings={closings}
          month={month}
          onChangeMonth={setMonth}
          min={firstMonth < currentMonth ? firstMonth : currentMonth}
          max={currentMonth}
        />
      ) : (
        <AllMonthsView
          closings={closings}
          onOpenMonth={(next) => {
            setMonth(next);
            setMode('month');
          }}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
});

export default ReportsScreen;
