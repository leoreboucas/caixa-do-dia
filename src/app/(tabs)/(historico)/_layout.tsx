import { Stack } from 'expo-router';
import { headerOptions } from '@/theme/navigation';

export default function HistoricoLayout() {
  return (
    <Stack screenOptions={headerOptions}>
      <Stack.Screen name="historico" options={{ title: 'Histórico' }} />
    </Stack>
  );
}
