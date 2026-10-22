import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from '@/db/schema';

const DATABASE_NAME = 'caixa-do-dia.db';

const expoDb = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });

expoDb.execSync('PRAGMA foreign_keys = ON;');

export const db = drizzle(expoDb, { schema });
