const BACKUP_FILE_NAME = 'caixa-do-dia-backup.json';
const API_URL = 'https://www.googleapis.com/drive/v3';
const UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3';
const MULTIPART_BOUNDARY = 'caixa-do-dia-boundary';

export class DriveError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const buildMultipartBody = (content: string): string =>
  [
    `--${MULTIPART_BOUNDARY}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify({ name: BACKUP_FILE_NAME, parents: ['appDataFolder'] }),
    `--${MULTIPART_BOUNDARY}`,
    'Content-Type: application/json',
    '',
    content,
    `--${MULTIPART_BOUNDARY}--`,
  ].join('\r\n');

const request = async (
  token: string,
  url: string,
  init: { method?: string; body?: string; contentType?: string },
) => {
  const response = await fetch(url, {
    method: init.method ?? 'GET',
    body: init.body,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.contentType ? { 'Content-Type': init.contentType } : {}),
    },
  });
  if (!response.ok)
    throw new DriveError(response.status, `Falha ao falar com o Google Drive (${response.status}).`);
  return response;
};

const findBackupFile = async (token: string): Promise<string | null> => {
  const query = encodeURIComponent(`name='${BACKUP_FILE_NAME}'`);
  const url = `${API_URL}/files?spaces=appDataFolder&q=${query}&orderBy=modifiedTime%20desc&pageSize=1&fields=files(id)`;
  const response = await request(token, url, {});
  const body = (await response.json()) as { files?: { id: string }[] };
  return body.files?.[0]?.id ?? null;
};

export async function uploadBackup(token: string, content: string): Promise<void> {
  const existingId = await findBackupFile(token);
  if (existingId) {
    await request(token, `${UPLOAD_URL}/files/${existingId}?uploadType=media`, {
      method: 'PATCH',
      body: content,
      contentType: 'application/json',
    });
    return;
  }
  await request(token, `${UPLOAD_URL}/files?uploadType=multipart`, {
    method: 'POST',
    body: buildMultipartBody(content),
    contentType: `multipart/related; boundary=${MULTIPART_BOUNDARY}`,
  });
}

export async function downloadBackup(token: string): Promise<string | null> {
  const fileId = await findBackupFile(token);
  if (!fileId) return null;
  const response = await request(token, `${API_URL}/files/${fileId}?alt=media`, {});
  return response.text();
}
