import { StyleSheet, View } from 'react-native';
import { useDay } from '@/features/day/hooks';
import { openDay } from '@/features/day/services';
import { LoadingState, StateMessage, type DateKey } from '@/features/shared';
import DayView from './DayView';
import OpenDayForm from './OpenDayForm';

const CashDay = ({ date }: { date: DateKey }) => {
  const { state, reload, retry } = useDay(date);

  if (state.status === 'loading') {
    return (
      <View style={styles.state}>
        <LoadingState />
      </View>
    );
  }
  if (state.status === 'error') {
    return (
      <View style={styles.state}>
        <StateMessage
          title="Não foi possível carregar os dados"
          description={state.message}
          actionLabel="Tentar novamente"
          onAction={retry}
        />
      </View>
    );
  }

  const { closing, currentCosts } = state;
  if (closing === null) {
    return (
      <OpenDayForm
        date={date}
        onSubmit={async (values) => {
          await openDay(values);
          await reload();
        }}
      />
    );
  }

  return <DayView date={date} closing={closing} currentCosts={currentCosts} onRemoved={reload} />;
};

const styles = StyleSheet.create({
  state: { minHeight: 320 },
});

export default CashDay;
