import { asc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { products, type Product } from '@/db/schema';
import type { ProductFormValues } from '@/features/products/validators';

export async function listActiveProducts(): Promise<Product[]> {
  return db.select().from(products).where(eq(products.archived, false)).orderBy(asc(products.name));
}

export async function getProduct(id: number): Promise<Product | null> {
  const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createProduct(values: ProductFormValues): Promise<Product> {
  const rows = await db.insert(products).values(values).returning();
  const created = rows[0];
  if (!created) throw new Error('Não foi possível criar o produto');
  return created;
}

export async function updateProduct(id: number, values: ProductFormValues): Promise<void> {
  await db.update(products).set(values).where(eq(products.id, id));
}

export async function setProductArchived(id: number, archived: boolean): Promise<void> {
  await db.update(products).set({ archived }).where(eq(products.id, id));
}
