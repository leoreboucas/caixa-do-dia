import { Stack } from 'expo-router';
import { headerOptions } from '@/theme/navigation';

const HistoryLayout = () => {
  return (
    <Stack screenOptions={headerOptions}>
      <Stack.Screen name="history" options={{ title: 'Histórico' }} />
    </Stack>
  );
};

export default HistoryLayout;
