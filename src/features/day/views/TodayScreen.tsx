import { ScrollView, StyleSheet } from 'react-native';
import { DayHeader, DayView, OpenDayForm } from '@/features/day/components';
import { LoadingState, StateMessage } from '@/features/shared';
import { useDay } from '@/features/day/hooks';
import { openDay } from '@/features/day/services';
import { colors, spacing } from '@/theme';

const TodayScreen = () => {
  const { state, reload, retry } = useDay();

  if (state.status === 'loading') return <LoadingState />;
  if (state.status === 'error') {
    return (
      <StateMessage
        title="Não foi possível carregar os dados"
        description={state.message}
        actionLabel="Tentar novamente"
        onAction={retry}
      />
    );
  }

  const { date, closing, currentCosts } = state;

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
            onSubmit={async (values) => {
              await openDay(values);
              await reload();
            }}
          />
        </>
      ) : (
        <DayView date={date} closing={closing} currentCosts={currentCosts} onCancelled={reload} />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
});

export default TodayScreen;
