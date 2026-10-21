import { Stack } from 'expo-router';
import { headerOptions } from '@/theme/navigation';

export default function ProdutosLayout() {
  return (
    <Stack screenOptions={headerOptions}>
      <Stack.Screen name="produtos" options={{ title: 'Produtos' }} />
    </Stack>
  );
}
