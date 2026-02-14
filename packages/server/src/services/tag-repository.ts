import { injectable, inject } from 'inversify';
import { eq, asc } from 'drizzle-orm';
import { SYMBOLS } from '../di/symbols.js';
import { taskTags } from '../db/schema/tasks.js';
import type { Database } from '../db/drizzle.js';

@injectable()
export class TagRepository {
  constructor(@inject(SYMBOLS.Database) private db: Database) {}

  async list() {
    return this.db.select().from(taskTags).orderBy(asc(taskTags.name));
  }

  async create(data: typeof taskTags.$inferInsert) {
    const [item] = await this.db.insert(taskTags).values(data).returning();
    return item;
  }

  async delete(id: string) {
    await this.db.delete(taskTags).where(eq(taskTags.id, id));
  }
}
