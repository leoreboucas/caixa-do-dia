import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StateMessage, LoadingState } from '@/components/StateMessage';
import { db } from '@/db/client';
import migrations from '@/db/migrations/migrations';
import { colors } from '@/theme';
import { modalHeaderOptions } from '@/theme/navigation';

export default function RootLayout() {
  // Cria/atualiza as tabelas do SQLite antes de mostrar qualquer tela
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    return <StateMessage title="Erro ao preparar o banco de dados" description={error.message} />;
  }

  if (!success) {
    return <LoadingState />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ ...modalHeaderOptions, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="dia/[date]" options={{ title: 'Dia' }} />
        <Stack.Screen name="adicionar-compra" options={{ title: 'Adicionar compra', presentation: 'modal' }} />
        <Stack.Screen name="fechar-dia" options={{ title: 'Fechar o dia', presentation: 'modal' }} />
        <Stack.Screen name="editar-item" options={{ title: 'Editar compra', presentation: 'modal' }} />
        <Stack.Screen name="lancar-dia" options={{ title: 'Lançar dia esquecido', presentation: 'modal' }} />
        <Stack.Screen name="produto" options={{ title: 'Produto', presentation: 'modal' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
