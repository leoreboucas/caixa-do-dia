import { Stack, router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { DayView } from '@/components/DayView';
import { LoadingState, StateMessage } from '@/components/StateMessage';
import { weekdayNameBR } from '@/domain/date';
import { useDateParam, useDay } from '@/hooks/useDay';
import { colors, spacing } from '@/theme';

/** Detalhe de um dia antigo: itens, resumo e edição, com aviso se houver dias depois dele. */
export default function DiaScreen() {
  const date = useDateParam();
  const { state, retry } = useDay(date);

  if (state.status === 'loading') return <LoadingState />;
  if (state.status === 'error') {
    return (
      <StateMessage
        title="Não deu para abrir esse dia"
        description={state.message}
        actionLabel="Tentar de novo"
        onAction={retry}
      />
    );
  }

  const { closing, currentCosts, laterDays } = state;
  if (!closing) {
    return (
      <StateMessage
        title="Esse dia ainda não foi lançado"
        description="Informe o caixa inicial para lançar esse dia agora."
        actionLabel="Lançar esse dia"
        onAction={() => router.replace({ pathname: '/lancar-dia', params: { date } })}
      />
    );
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.scroll}
      contentContainerStyle={styles.content}
    >
      <Stack.Screen options={{ title: weekdayNameBR(date) }} />
      <DayView date={date} closing={closing} currentCosts={currentCosts} laterDays={laterDays} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
});
