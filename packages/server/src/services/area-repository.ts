import { injectable, inject } from 'inversify';
import { eq, asc } from 'drizzle-orm';
import { SYMBOLS } from '../di/symbols.js';
import { taskAreas } from '../db/schema/tasks.js';
import type { Database } from '../db/drizzle.js';

@injectable()
export class AreaRepository {
  constructor(@inject(SYMBOLS.Database) private db: Database) {}

  async list() {
    return this.db.select().from(taskAreas).orderBy(asc(taskAreas.sortOrder));
  }

  async getById(id: string) {
    const [item] = await this.db.select().from(taskAreas).where(eq(taskAreas.id, id));
    return item ?? null;
  }

  async create(data: typeof taskAreas.$inferInsert) {
    const [item] = await this.db.insert(taskAreas).values(data).returning();
    return item;
  }

  async update(id: string, data: Partial<typeof taskAreas.$inferInsert>) {
    const [item] = await this.db
      .update(taskAreas)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(taskAreas.id, id))
      .returning();
    return item;
  }

  async delete(id: string) {
    await this.db.delete(taskAreas).where(eq(taskAreas.id, id));
  }
}
