import { Alert, ScrollView, StyleSheet } from 'react-native';
import { useBackup } from '@/features/backup/hooks';
import { formatDateTimeBR } from '@/features/backup/utils';
import { Button, Card, LoadingState, StateMessage, Text } from '@/features/shared';
import { colors, fontSize, spacing } from '@/theme';

const BackupScreen = () => {
  const backup = useBackup();

  if (backup.availability === 'checking') return <LoadingState />;
  if (backup.availability === 'unavailable') {
    return (
      <StateMessage
        title="Backup indisponível"
        description="O backup no Google Drive funciona no aplicativo instalado no Android, com a conta Google do aparelho."
      />
    );
  }

  const confirmRestore = () => {
    Alert.alert(
      'Restaurar do Google Drive?',
      'Os dados deste aparelho serão substituídos pelos do último backup. Essa ação não pode ser desfeita.',
      [
        { text: 'Voltar', style: 'cancel' },
        { text: 'Restaurar', style: 'destructive', onPress: backup.restore },
      ],
    );
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.scroll}
      contentContainerStyle={styles.content}
    >
      {backup.email === null ? (
        <>
          <Card>
            <Text style={styles.title}>Guarde seus caixas no Google Drive</Text>
            <Text style={styles.description}>
              Entre com a sua conta Google para salvar um backup automático. Se você trocar de celular, é só
              entrar de novo e restaurar.
            </Text>
          </Card>
          <Button label="Entrar com o Google" onPress={backup.connect} loading={backup.busy === 'connect'} />
        </>
      ) : (
        <>
          <Card>
            <Text style={styles.label}>Conta conectada</Text>
            <Text selectable style={styles.value}>
              {backup.email}
            </Text>
            <Text style={styles.label}>Último backup</Text>
            <Text style={styles.value}>
              {backup.lastBackupAt ? formatDateTimeBR(backup.lastBackupAt) : 'Ainda não feito'}
            </Text>
            <Text style={styles.description}>
              O backup é feito sozinho sempre que você lança, edita ou apaga um caixa.
            </Text>
          </Card>
          <Button label="Fazer backup agora" onPress={backup.backup} loading={backup.busy === 'backup'} />
          <Button
            label="Restaurar do Google Drive"
            variant="secondary"
            onPress={confirmRestore}
            loading={backup.busy === 'restore'}
          />
          <Button
            label="Desconectar a conta"
            variant="text"
            onPress={backup.disconnect}
            loading={backup.busy === 'disconnect'}
          />
        </>
      )}

      {backup.message ? (
        <Text selectable style={backup.message.kind === 'error' ? styles.error : styles.success}>
          {backup.message.text}
        </Text>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
  title: { fontSize: fontSize.title, fontWeight: '700', color: colors.primaryDark },
  description: { fontSize: fontSize.small, color: colors.textMuted, lineHeight: 20 },
  label: { fontSize: fontSize.small, fontWeight: '600', color: colors.textMuted },
  value: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  error: { fontSize: fontSize.small, color: colors.danger },
  success: { fontSize: fontSize.small, fontWeight: '600', color: colors.primary },
});

export default BackupScreen;
