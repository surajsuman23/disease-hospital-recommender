import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const requestBudget = sqliteTable('request_budget', {
  key: text('key').primaryKey(),
  window: integer('window').notNull(),
  count: integer('count').notNull(),
});
