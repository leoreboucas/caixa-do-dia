import { describe, expect, it } from 'vitest';
import { buildMultipartBody } from './driveService';

describe('buildMultipartBody', () => {
  it('monta o corpo multipart com os metadados na pasta privada do app e o conteúdo', () => {
    const body = buildMultipartBody('{"a":1}');
    const parts = body.split('\r\n');

    expect(parts[0]).toBe('--caixa-do-dia-boundary');
    expect(JSON.parse(parts[3] as string)).toEqual({
      name: 'caixa-do-dia-backup.json',
      parents: ['appDataFolder'],
    });
    expect(body).toContain('\r\n{"a":1}\r\n');
    expect(body.endsWith('--caixa-do-dia-boundary--')).toBe(true);
  });
});
