import { injectable, inject } from 'inversify';
import { eq, asc } from 'drizzle-orm';
import { SYMBOLS } from '../di/symbols.js';
import { taskProjects } from '../db/schema/tasks.js';
import type { Database } from '../db/drizzle.js';

@injectable()
export class ProjectRepository {
  constructor(@inject(SYMBOLS.Database) private db: Database) {}

  async list() {
    return this.db.select().from(taskProjects).orderBy(asc(taskProjects.sortOrder));
  }

  async getById(id: string) {
    const [item] = await this.db.select().from(taskProjects).where(eq(taskProjects.id, id));
    return item ?? null;
  }

  async create(data: typeof taskProjects.$inferInsert) {
    const [item] = await this.db.insert(taskProjects).values(data).returning();
    return item;
  }

  async update(id: string, data: Partial<typeof taskProjects.$inferInsert>) {
    const [item] = await this.db
      .update(taskProjects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(taskProjects.id, id))
      .returning();
    return item;
  }

  async delete(id: string) {
    await this.db.delete(taskProjects).where(eq(taskProjects.id, id));
  }
}
