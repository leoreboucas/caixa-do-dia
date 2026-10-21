import { relations } from 'drizzle-orm';
import { sqliteTable, integer, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

/**
 * Regras do modelo:
 * - Todo dinheiro é guardado em CENTAVOS (inteiro). Nunca float.
 * - `products` é o cadastro atual. Mudar o preço aqui NÃO altera fechamentos antigos.
 * - `closing_items` guarda o custo "congelado" daquele dia (e um snapshot do produto).
 */

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  // 'unit' = comprado por unidade; 'pack' = comprado por pacote/embalagem
  purchaseType: text('purchase_type', { enum: ['unit', 'pack'] }).notNull(),
  // custo da unidade (unit) ou do pacote (pack), em centavos
  costCents: integer('cost_cents').notNull(),
  // opcional, só faz sentido quando purchaseType = 'pack'
  unitsPerPack: integer('units_per_pack'),
  // arquivado = some da lista de cadastro, mas o histórico continua legível
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
});

export const dailyClosings = sqliteTable('daily_closings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  // 'YYYY-MM-DD' no fuso local. Uma linha por dia.
  date: text('date').notNull().unique(),
  openingCashCents: integer('opening_cash_cents').notNull(),
  // null enquanto o dia está aberto
  grossSalesCents: integer('gross_sales_cents'),
  status: text('status', { enum: ['open', 'closed'] }).notNull().default('open'),
  note: text('note'),
});

export const closingItems = sqliteTable(
  'closing_items',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    closingId: integer('closing_id')
      .notNull()
      .references(() => dailyClosings.id, { onDelete: 'cascade' }),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id),
    // snapshots: o histórico não muda se o cadastro mudar
    productName: text('product_name').notNull(),
    purchaseType: text('purchase_type', { enum: ['unit', 'pack'] }).notNull(),
    unitsPerPack: integer('units_per_pack'),
    quantity: integer('quantity').notNull(),
    // custo de UMA unidade/pacote comprado naquele dia, em centavos
    unitCostCents: integer('unit_cost_cents').notNull(),
  },
  (t) => [uniqueIndex('uniq_closing_product').on(t.closingId, t.productId)],
);

// Relações só existem no Drizzle (para db.query ... with: { items: true }); não geram SQL.
export const dailyClosingsRelations = relations(dailyClosings, ({ many }) => ({
  items: many(closingItems),
}));

export const closingItemsRelations = relations(closingItems, ({ one }) => ({
  closing: one(dailyClosings, {
    fields: [closingItems.closingId],
    references: [dailyClosings.id],
  }),
  product: one(products, {
    fields: [closingItems.productId],
    references: [products.id],
  }),
}));

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type DailyClosing = typeof dailyClosings.$inferSelect;
export type NewDailyClosing = typeof dailyClosings.$inferInsert;
export type ClosingItem = typeof closingItems.$inferSelect;
export type NewClosingItem = typeof closingItems.$inferInsert;
