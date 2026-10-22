import { relations } from 'drizzle-orm';
import { sqliteTable, integer, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),

  purchaseType: text('purchase_type', { enum: ['unit', 'pack'] }).notNull(),

  costCents: integer('cost_cents').notNull(),

  unitsPerPack: integer('units_per_pack'),

  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
});

export const dailyClosings = sqliteTable('daily_closings', {
  id: integer('id').primaryKey({ autoIncrement: true }),

  date: text('date').notNull().unique(),
  openingCashCents: integer('opening_cash_cents').notNull(),

  grossSalesCents: integer('gross_sales_cents'),
  status: text('status', { enum: ['open', 'closed'] })
    .notNull()
    .default('open'),
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

    productName: text('product_name').notNull(),
    purchaseType: text('purchase_type', { enum: ['unit', 'pack'] }).notNull(),
    unitsPerPack: integer('units_per_pack'),
    quantity: integer('quantity').notNull(),

    unitCostCents: integer('unit_cost_cents').notNull(),
  },
  (t) => [uniqueIndex('uniq_closing_product').on(t.closingId, t.productId)],
);

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
export type DailyClosing = typeof dailyClosings.$inferSelect;
export type ClosingItem = typeof closingItems.$inferSelect;
