import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const jiraSyncLog = pgTable('jira_sync_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  webhookId: text('webhook_id').unique().notNull(),
  issueKey: text('issue_key').notNull(),
  action: text('action', { enum: ['created', 'updated', 'deleted'] }).notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }).notNull().defaultNow(),
});
