import { ScrollView, StyleSheet } from 'react-native';
import { DayHeader, DayView } from '@/components/DayView';
import { OpenDayForm } from '@/components/OpenDayForm';
import { LoadingState, StateMessage } from '@/components/StateMessage';
import { useDay } from '@/hooks/useDay';
import { openDay } from '@/repositories/closings';
import { colors, spacing } from '@/theme';

export default function HojeScreen() {
  const { state, reload, retry } = useDay();

  if (state.status === 'loading') return <LoadingState />;
  if (state.status === 'error') {
    return (
      <StateMessage
        title="Não deu para abrir seus dados"
        description={state.message}
        actionLabel="Tentar de novo"
        onAction={retry}
      />
    );
  }

  const { date, closing, suggestedOpeningCents, currentCosts, laterDays } = state;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      style={styles.scroll}
      contentContainerStyle={styles.content}
    >
      {closing === null ? (
        <>
          <DayHeader date={date} />
          <OpenDayForm
            date={date}
            suggestedCents={suggestedOpeningCents}
            onSubmit={async (values) => {
              await openDay(values);
              await reload();
            }}
          />
        </>
      ) : (
        <DayView date={date} closing={closing} currentCosts={currentCosts} laterDays={laterDays} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
});
