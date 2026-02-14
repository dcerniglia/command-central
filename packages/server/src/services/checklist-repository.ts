import { injectable, inject } from 'inversify';
import { eq, asc } from 'drizzle-orm';
import { SYMBOLS } from '../di/symbols.js';
import { taskChecklist } from '../db/schema/tasks.js';
import type { Database } from '../db/drizzle.js';

@injectable()
export class ChecklistRepository {
  constructor(@inject(SYMBOLS.Database) private db: Database) {}

  async listByTask(taskId: string) {
    return this.db.select().from(taskChecklist).where(eq(taskChecklist.taskId, taskId)).orderBy(asc(taskChecklist.sortOrder));
  }

  async create(data: typeof taskChecklist.$inferInsert) {
    const [item] = await this.db.insert(taskChecklist).values(data).returning();
    return item;
  }

  async update(id: string, data: Partial<typeof taskChecklist.$inferInsert>) {
    const [item] = await this.db.update(taskChecklist).set(data).where(eq(taskChecklist.id, id)).returning();
    return item;
  }

  async delete(id: string) {
    await this.db.delete(taskChecklist).where(eq(taskChecklist.id, id));
  }
}
