import { injectable, inject } from 'inversify';
import { eq, asc } from 'drizzle-orm';
import { SYMBOLS } from '../di/symbols.js';
import { taskLists } from '../db/schema/tasks.js';
import type { Database } from '../db/drizzle.js';

@injectable()
export class ListRepository {
  constructor(@inject(SYMBOLS.Database) private db: Database) {}

  async list() {
    return this.db.select().from(taskLists).orderBy(asc(taskLists.sortOrder));
  }

  async getById(id: string) {
    const [item] = await this.db.select().from(taskLists).where(eq(taskLists.id, id));
    return item ?? null;
  }

  async create(data: typeof taskLists.$inferInsert) {
    const [item] = await this.db.insert(taskLists).values(data).returning();
    return item;
  }

  async update(id: string, data: Partial<typeof taskLists.$inferInsert>) {
    const [item] = await this.db
      .update(taskLists)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(taskLists.id, id))
      .returning();
    return item;
  }

  async delete(id: string) {
    await this.db.delete(taskLists).where(eq(taskLists.id, id));
  }
}
