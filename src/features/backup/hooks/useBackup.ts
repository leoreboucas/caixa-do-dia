import { useEffect, useState } from 'react';
import {
  backupNow,
  getLastBackupAt,
  isGoogleBackupAvailable,
  restoreFromDrive,
  restoreGoogleSession,
  signInWithGoogle,
  signOutOfGoogle,
} from '@/features/backup/services';

type Availability = 'checking' | 'unavailable' | 'ready';
type BackupAction = 'connect' | 'backup' | 'restore' | 'disconnect';
type BackupMessage = { kind: 'success' | 'error'; text: string };

const useBackup = () => {
  const [availability, setAvailability] = useState<Availability>('checking');
  const [email, setEmail] = useState<string | null>(null);
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(getLastBackupAt);
  const [busy, setBusy] = useState<BackupAction | null>(null);
  const [message, setMessage] = useState<BackupMessage | null>(null);

  useEffect(() => {
    isGoogleBackupAvailable()
      .then((available) => {
        setAvailability(available ? 'ready' : 'unavailable');
        return available ? restoreGoogleSession() : null;
      })
      .then(setEmail)
      .catch(() => undefined);
  }, []);

  const run = async (action: BackupAction, task: () => Promise<string | null>) => {
    setBusy(action);
    setMessage(null);
    try {
      const text = await task();
      if (text) setMessage({ kind: 'success', text });
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Algo deu errado. Tente novamente.';
      setMessage({ kind: 'error', text });
    } finally {
      setBusy(null);
    }
  };

  return {
    availability,
    email,
    lastBackupAt,
    busy,
    message,
    connect: () =>
      run('connect', async () => {
        const address = await signInWithGoogle();
        if (!address) return null;
        setEmail(address);
        setLastBackupAt(await backupNow());
        return 'Conta conectada e backup feito.';
      }),
    backup: () =>
      run('backup', async () => {
        setLastBackupAt(await backupNow());
        return 'Backup feito.';
      }),
    restore: () =>
      run('restore', async () => {
        await restoreFromDrive();
        return 'Dados restaurados do Google Drive.';
      }),
    disconnect: () =>
      run('disconnect', async () => {
        await signOutOfGoogle();
        setEmail(null);
        return 'Conta desconectada.';
      }),
  };
};

export default useBackup;
