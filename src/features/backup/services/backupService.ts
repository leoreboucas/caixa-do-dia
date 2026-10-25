import { db } from '@/db/client';
import { closingItems, dailyClosings, products } from '@/db/schema';
import { BACKUP_VERSION, backupSchema, type BackupData } from '@/features/backup/validators';

const INSERT_CHUNK_SIZE = 100;

export async function createBackup(): Promise<BackupData> {
  const [productRows, closingRows, itemRows] = await Promise.all([
    db.select().from(products),
    db.select().from(dailyClosings),
    db.select().from(closingItems),
  ]);

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    products: productRows,
    closings: closingRows,
    items: itemRows,
  };
}

const insertInChunks = async <Row>(rows: Row[], insert: (chunk: Row[]) => Promise<unknown>) => {
  for (let start = 0; start < rows.length; start += INSERT_CHUNK_SIZE) {
    await insert(rows.slice(start, start + INSERT_CHUNK_SIZE));
  }
};

const replaceAllData = async (data: BackupData) => {
  await db.delete(closingItems);
  await db.delete(dailyClosings);
  await db.delete(products);
  await insertInChunks(data.products, (chunk) => db.insert(products).values(chunk));
  await insertInChunks(data.closings, (chunk) => db.insert(dailyClosings).values(chunk));
  await insertInChunks(data.items, (chunk) => db.insert(closingItems).values(chunk));
};

export async function restoreBackup(raw: unknown): Promise<void> {
  const parsed = backupSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'O arquivo de backup é inválido.');
  }

  const previous = await createBackup();
  try {
    await replaceAllData(parsed.data);
  } catch (error) {
    await replaceAllData(previous);
    throw error;
  }
}
