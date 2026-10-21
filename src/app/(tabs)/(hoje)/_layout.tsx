import { Stack } from 'expo-router';
import { headerOptions } from '@/theme/navigation';

export default function HojeLayout() {
  return (
    <Stack screenOptions={headerOptions}>
      <Stack.Screen name="index" options={{ title: 'Hoje' }} />
    </Stack>
  );
}
