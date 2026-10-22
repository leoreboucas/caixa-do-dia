import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export async function createTestClient() {
  const { DatabaseSync } = await import('node:sqlite');
  const { drizzle } = await import('drizzle-orm/sqlite-proxy');
  const schema = await import('@/db/schema');

  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON;');

  const migrationsDir = join(process.cwd(), 'src/db/migrations');
  for (const file of readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()) {
    for (const statement of readFileSync(join(migrationsDir, file), 'utf8').split(
      '--> statement-breakpoint',
    )) {
      if (statement.trim()) sqlite.exec(statement);
    }
  }

  const clean = (params: unknown[]) =>
    params.map((p) => (typeof p === 'boolean' ? Number(p) : p)) as (string | number | null)[];

  const db = drizzle(
    async (query, params, method) => {
      const stmt = sqlite.prepare(query);
      if (method === 'run') {
        stmt.run(...clean(params));
        return { rows: [] };
      }
      if (method === 'get') {
        const row = stmt.get(...clean(params)) as Record<string, unknown> | undefined;
        return { rows: row ? Object.values(row) : undefined } as { rows: unknown[] };
      }
      const rows = stmt.all(...clean(params)) as Record<string, unknown>[];
      return { rows: rows.map((r) => Object.values(r)) };
    },
    { schema },
  );

  return { db, __sqlite: sqlite };
}
