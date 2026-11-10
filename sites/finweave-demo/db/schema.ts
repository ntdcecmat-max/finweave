import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const demoSessions = sqliteTable('demo_sessions', {
  id: text('id').primaryKey(),
  revision: integer('revision').notNull(),
  payload: text('payload').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  expiresAt: integer('expires_at').notNull(),
}, table => [index('demo_sessions_expiry').on(table.expiresAt)]);
