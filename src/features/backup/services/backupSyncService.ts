import Storage from 'expo-sqlite/kv-store';
import { createBackup, restoreBackup } from './backupService';
import { DriveError, downloadBackup, uploadBackup } from './driveService';
import { discardAccessToken, getAccessToken } from './googleAuthService';

const LAST_BACKUP_KEY = 'backup-last-at';
const PENDING_KEY = 'backup-pending';
const UNAUTHORIZED = 401;

const withAccessToken = async <Result>(action: (token: string) => Promise<Result>): Promise<Result> => {
  const token = await getAccessToken();
  try {
    return await action(token);
  } catch (error) {
    if (!(error instanceof DriveError) || error.status !== UNAUTHORIZED) throw error;
    await discardAccessToken(token);
    return action(await getAccessToken());
  }
};

export const getLastBackupAt = (): string | null => Storage.getItemSync(LAST_BACKUP_KEY);

export const hasPendingBackup = (): boolean => Storage.getItemSync(PENDING_KEY) === '1';

export const markBackupPending = (): void => Storage.setItemSync(PENDING_KEY, '1');

export async function backupNow(): Promise<string> {
  const content = JSON.stringify(await createBackup());
  await withAccessToken((token) => uploadBackup(token, content));
  const now = new Date().toISOString();
  Storage.setItemSync(LAST_BACKUP_KEY, now);
  Storage.removeItemSync(PENDING_KEY);
  return now;
}

export async function restoreFromDrive(): Promise<void> {
  const content = await withAccessToken((token) => downloadBackup(token));
  if (content === null) throw new Error('Não há backup salvo nesta conta do Google.');
  await restoreBackup(JSON.parse(content));
}
