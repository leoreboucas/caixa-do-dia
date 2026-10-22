import { Stack } from 'expo-router';
import { headerOptions } from '@/theme/navigation';

const CashLayout = () => {
  return (
    <Stack screenOptions={headerOptions}>
      <Stack.Screen name="index" options={{ title: 'Caixa' }} />
    </Stack>
  );
};

export default CashLayout;
