import { injectable, inject } from 'inversify';
import { eq, and, isNull, lte, gte, sql, asc } from 'drizzle-orm';
import { SYMBOLS } from '../di/symbols.js';
import { taskItems, taskItemTags } from '../db/schema/tasks.js';
import type { Database } from '../db/drizzle.js';
import type { TaskFilter } from '@cc/shared';

@injectable()
export class TaskRepository {
  constructor(@inject(SYMBOLS.Database) private db: Database) {}

  async list(filter: TaskFilter) {
    const conditions = []; // drizzle conditions

    if (filter.status) {
      conditions.push(eq(taskItems.status, filter.status));
    } else {
      // Default: only show active tasks
      conditions.push(eq(taskItems.status, 'todo'));
    }

    if (filter.listId) {
      conditions.push(eq(taskItems.listId, filter.listId));
    }

    if (filter.areaId) {
      conditions.push(eq(taskItems.areaId, filter.areaId));
    }

    if (filter.view === 'inbox') {
      conditions.push(isNull(taskItems.listId));
      conditions.push(isNull(taskItems.areaId));
    } else if (filter.view === 'today') {
      const today = new Date().toISOString().split('T')[0];
      conditions.push(lte(taskItems.dueDate, today));
    } else if (filter.view === 'upcoming') {
      const today = new Date().toISOString().split('T')[0];
      const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      conditions.push(gte(taskItems.dueDate, today));
      conditions.push(lte(taskItems.dueDate, weekFromNow));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    return this.db
      .select()
      .from(taskItems)
      .where(where)
      .orderBy(asc(taskItems.sortOrder), asc(taskItems.createdAt));
  }

  async getById(id: string) {
    const [item] = await this.db.select().from(taskItems).where(eq(taskItems.id, id));
    return item ?? null;
  }

  async create(data: typeof taskItems.$inferInsert) {
    const [item] = await this.db.insert(taskItems).values(data).returning();
    return item;
  }

  async update(id: string, data: Partial<typeof taskItems.$inferInsert>) {
    const [item] = await this.db
      .update(taskItems)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(taskItems.id, id))
      .returning();
    return item;
  }

  async delete(id: string) {
    await this.db.delete(taskItems).where(eq(taskItems.id, id));
  }

  async getTagIds(taskId: string) {
    const rows = await this.db.select().from(taskItemTags).where(eq(taskItemTags.taskId, taskId));
    return rows.map(r => r.tagId);
  }

  async setTags(taskId: string, tagIds: string[]) {
    await this.db.delete(taskItemTags).where(eq(taskItemTags.taskId, taskId));
    if (tagIds.length > 0) {
      await this.db.insert(taskItemTags).values(tagIds.map(tagId => ({ taskId, tagId })));
    }
  }

  async getMaxSortOrder(listId?: string | null, areaId?: string | null) {
    const conditions = [];
    if (listId) conditions.push(eq(taskItems.listId, listId));
    if (areaId) conditions.push(eq(taskItems.areaId, areaId));

    const [result] = await this.db
      .select({ max: sql<number>`coalesce(max(${taskItems.sortOrder}), 0)` })
      .from(taskItems)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return result?.max ?? 0;
  }

  async updateSortOrders(items: { id: string; sortOrder: number }[]) {
    for (const item of items) {
      await this.db.update(taskItems).set({ sortOrder: item.sortOrder }).where(eq(taskItems.id, item.id));
    }
  }
}
