import { addDatabaseChangeListener } from 'expo-sqlite';
import { useEffect } from 'react';
import {
  backupNow,
  hasPendingBackup,
  isGoogleBackupAvailable,
  markBackupPending,
  restoreGoogleSession,
} from '@/features/backup/services';

const DEBOUNCE_MS = 20_000;
const STARTUP_DELAY_MS = 5_000;

const useAutoBackup = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const attempt = async () => {
      try {
        if (!(await isGoogleBackupAvailable())) return;
        if (!(await restoreGoogleSession())) return;
        await backupNow();
      } catch {
        markBackupPending();
      }
    };

    const schedule = (delay: number) => {
      clearTimeout(timer);
      timer = setTimeout(() => void attempt(), delay);
    };

    if (hasPendingBackup()) schedule(STARTUP_DELAY_MS);
    const subscription = addDatabaseChangeListener(() => schedule(DEBOUNCE_MS));

    return () => {
      subscription.remove();
      clearTimeout(timer);
    };
  }, [enabled]);
};

export default useAutoBackup;
