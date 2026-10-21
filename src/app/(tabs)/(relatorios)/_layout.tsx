import { Stack } from 'expo-router';
import { headerOptions } from '@/theme/navigation';

export default function RelatoriosLayout() {
  return (
    <Stack screenOptions={headerOptions}>
      <Stack.Screen name="relatorios" options={{ title: 'Relatórios' }} />
    </Stack>
  );
}
