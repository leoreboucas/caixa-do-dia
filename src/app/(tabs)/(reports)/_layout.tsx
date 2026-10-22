import { Stack } from 'expo-router';
import { headerOptions } from '@/theme/navigation';

const ReportsLayout = () => {
  return (
    <Stack screenOptions={headerOptions}>
      <Stack.Screen name="reports" options={{ title: 'Relatórios' }} />
    </Stack>
  );
};

export default ReportsLayout;
