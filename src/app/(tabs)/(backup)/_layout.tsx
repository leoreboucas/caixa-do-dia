import { Stack } from 'expo-router';
import { headerOptions } from '@/theme/navigation';

const BackupLayout = () => {
  return (
    <Stack screenOptions={headerOptions}>
      <Stack.Screen name="backup" options={{ title: 'Backup' }} />
    </Stack>
  );
};

export default BackupLayout;
