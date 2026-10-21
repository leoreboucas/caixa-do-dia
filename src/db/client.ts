import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

export const DATABASE_NAME = 'caixa-do-dia.db';

// enableChangeListener permite usar useLiveQuery do Drizzle nas telas
const expoDb = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });

// Chaves estrangeiras (ON DELETE CASCADE) só funcionam com isso ligado no SQLite
expoDb.execSync('PRAGMA foreign_keys = ON;');

export const db = drizzle(expoDb, { schema });
export type Db = typeof db;
