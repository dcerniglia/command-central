import { injectable, inject } from 'inversify';
import { SYMBOLS } from '../di/symbols.js';
import { TaskRepository } from './task-repository.js';
import type { CreateTaskInput, UpdateTaskInput, TaskFilter } from '@cc/shared';

@injectable()
export class TaskService {
  constructor(
    @inject(SYMBOLS.TaskRepository) private taskRepo: TaskRepository,
  ) {}

  async list(filter: TaskFilter) {
    return this.taskRepo.list(filter);
  }

  async get(id: string) {
    const task = await this.taskRepo.getById(id);
    if (!task) throw new Error('Task not found');
    const tagIds = await this.taskRepo.getTagIds(id);
    return { ...task, tagIds };
  }

  async create(input: CreateTaskInput) {
    const { tagIds, dueDate, startDate, processed, ...rest } = input;
    const sortOrder = await this.taskRepo.getMaxSortOrder(rest.projectId) + 1;
    const task = await this.taskRepo.create({
      ...rest,
      sortOrder,
      processed: processed ?? false,
      startDate: startDate ? startDate.toISOString().split('T')[0] : null,
      dueDate: dueDate ? dueDate.toISOString().split('T')[0] : null,
    });
    if (tagIds.length > 0) {
      await this.taskRepo.setTags(task.id, tagIds);
    }
    return task;
  }

  async update(input: UpdateTaskInput) {
    const { id, tagIds, dueDate, startDate, ...rest } = input;
    const data: Record<string, any> = { ...rest };
    if (startDate !== undefined) {
      data.startDate = startDate ? startDate.toISOString().split('T')[0] : null;
    }
    if (dueDate !== undefined) {
      data.dueDate = dueDate ? dueDate.toISOString().split('T')[0] : null;
    }
    const task = await this.taskRepo.update(id, data);
    if (tagIds !== undefined) {
      await this.taskRepo.setTags(id, tagIds);
    }
    return task;
  }

  async complete(id: string) {
    const task = await this.taskRepo.getById(id);
    if (!task) throw new Error('Task not found');

    // Toggle: if already done, reopen to todo
    if (task.status === 'done') {
      return this.taskRepo.update(id, {
        status: 'todo',
        completedAt: null,
      });
    }

    const completed = await this.taskRepo.update(id, {
      status: 'done',
      completedAt: new Date(),
    });

    // Handle recurrence — spawn next occurrence
    if (task.recurrenceRule && task.dueDate) {
      const nextDate = computeNextOccurrence(task.dueDate, task.recurrenceRule);
      if (nextDate) {
        await this.taskRepo.create({
          title: task.title,
          notes: task.notes,
          projectId: task.projectId,
          priority: task.priority,
          dueDate: nextDate,
          dueTime: task.dueTime,
          recurrenceRule: task.recurrenceRule,
          recurrenceParentId: task.recurrenceParentId ?? task.id,
          sortOrder: task.sortOrder,
        });
      }
    }

    return completed;
  }

  async delete(id: string) {
    await this.taskRepo.delete(id);
  }

  async reorder(items: { id: string; sortOrder: number }[]) {
    await this.taskRepo.updateSortOrders(items);
  }

}

/** Compute the next occurrence date from a due date and RRULE string. */
export function computeNextOccurrence(currentDueDate: string, rrule: string): string | null {
  // Simple RRULE parsing for DAILY, WEEKLY, MONTHLY
  const current = new Date(currentDueDate + 'T00:00:00');

  if (rrule.includes('FREQ=DAILY')) {
    current.setDate(current.getDate() + 1);
  } else if (rrule.includes('FREQ=WEEKLY')) {
    current.setDate(current.getDate() + 7);
  } else if (rrule.includes('FREQ=MONTHLY')) {
    current.setMonth(current.getMonth() + 1);
  } else {
    return null;
  }

  return current.toISOString().split('T')[0];
}
