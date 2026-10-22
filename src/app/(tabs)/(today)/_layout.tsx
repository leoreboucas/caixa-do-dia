import { Stack } from 'expo-router';
import { headerOptions } from '@/theme/navigation';

const TodayLayout = () => {
  return (
    <Stack screenOptions={headerOptions}>
      <Stack.Screen name="index" options={{ title: 'Hoje' }} />
    </Stack>
  );
};

export default TodayLayout;
