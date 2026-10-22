import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { DayView } from '@/features/day/components';
import { useDay } from '@/features/day/hooks';
import { LoadingState, StateMessage, type DateKey } from '@/features/shared';

const DayContent = ({ date }: { date: DateKey }) => {
  const { state, retry } = useDay(date);

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
          title="Não foi possível abrir o dia"
          description={state.message}
          actionLabel="Tentar novamente"
          onAction={retry}
        />
      </View>
    );
  }

  const { closing, currentCosts } = state;
  if (!closing) {
    return (
      <View style={styles.state}>
        <StateMessage title="Dia não lançado" description="Este dia não tem caixa lançado." />
      </View>
    );
  }

  return (
    <DayView date={date} closing={closing} currentCosts={currentCosts} onRemoved={() => router.back()} />
  );
};

const styles = StyleSheet.create({
  state: { minHeight: 320 },
});

export default DayContent;
