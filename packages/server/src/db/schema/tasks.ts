import { pgTable, text, timestamp, uuid, integer, boolean, date, time, primaryKey } from 'drizzle-orm/pg-core';

export const taskAreas = pgTable('task_areas', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  icon: text('icon'),
  color: text('color'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const taskLists = pgTable('task_lists', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  areaId: uuid('area_id').references(() => taskAreas.id, { onDelete: 'set null' }),
  icon: text('icon'),
  color: text('color'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const taskTags = pgTable('task_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  color: text('color'),
});

export const taskItems = pgTable('task_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  notes: text('notes'),
  listId: uuid('list_id').references(() => taskLists.id, { onDelete: 'set null' }),
  areaId: uuid('area_id').references(() => taskAreas.id, { onDelete: 'set null' }),
  status: text('status', { enum: ['todo', 'done', 'cancelled'] }).notNull().default('todo'),
  priority: integer('priority').notNull().default(0),
  dueDate: date('due_date'),
  dueTime: time('due_time'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  sortOrder: integer('sort_order').notNull().default(0),
  recurrenceRule: text('recurrence_rule'),
  recurrenceParentId: uuid('recurrence_parent_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const taskItemTags = pgTable('task_item_tags', {
  taskId: uuid('task_id').notNull().references(() => taskItems.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => taskTags.id, { onDelete: 'cascade' }),
}, (t) => [
  primaryKey({ columns: [t.taskId, t.tagId] }),
]);

export const taskChecklist = pgTable('task_checklist', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull().references(() => taskItems.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  done: boolean('done').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
});
