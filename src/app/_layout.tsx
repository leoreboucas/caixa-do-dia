import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAutoBackup } from '@/features/backup';
import { LoadingState, StateMessage } from '@/features/shared';
import { db } from '@/db/client';
import migrations from '@/db/migrations/migrations';
import { colors } from '@/theme';
import { modalHeaderOptions } from '@/theme/navigation';

const RootLayout = () => {
  const { success, error } = useMigrations(db, migrations);
  useAutoBackup(success);

  if (error) {
    return <StateMessage title="Erro ao preparar o banco de dados" description={error.message} />;
  }

  if (!success) {
    return <LoadingState />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{ ...modalHeaderOptions, contentStyle: { backgroundColor: colors.background } }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="day/[date]" options={{ title: 'Dia' }} />
          <Stack.Screen name="add-purchase" options={{ title: 'Adicionar compra', presentation: 'modal' }} />
          <Stack.Screen name="close-day" options={{ title: 'Fechar o dia', presentation: 'modal' }} />
          <Stack.Screen
            name="edit-opening-cash"
            options={{ title: 'Caixa Inicial', presentation: 'modal' }}
          />
          <Stack.Screen name="edit-item" options={{ title: 'Editar compra', presentation: 'modal' }} />
          <Stack.Screen name="calculator" options={{ title: 'Calculadora', presentation: 'modal' }} />
          <Stack.Screen name="product" options={{ title: 'Produto', presentation: 'modal' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
});

export default RootLayout;
