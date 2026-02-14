import { z } from 'zod';

// Enums
export const TaskStatus = z.enum(['todo', 'done', 'cancelled']);
export type TaskStatus = z.infer<typeof TaskStatus>;

export const TaskPriority = z.number().int().min(0).max(3);
export type TaskPriority = z.infer<typeof TaskPriority>;

// Entities
export const TaskArea = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  icon: z.string().nullish(),
  color: z.string().nullish(),
  sortOrder: z.number().int().default(0),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type TaskArea = z.infer<typeof TaskArea>;

export const TaskList = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  areaId: z.string().uuid().nullish(),
  icon: z.string().nullish(),
  color: z.string().nullish(),
  sortOrder: z.number().int().default(0),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type TaskList = z.infer<typeof TaskList>;

export const TaskTag = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  color: z.string().nullish(),
});
export type TaskTag = z.infer<typeof TaskTag>;

export const TaskChecklist = z.object({
  id: z.string().uuid(),
  taskId: z.string().uuid(),
  title: z.string().min(1),
  done: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});
export type TaskChecklist = z.infer<typeof TaskChecklist>;

export const TaskItem = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  notes: z.string().nullish(),
  listId: z.string().uuid().nullish(),
  areaId: z.string().uuid().nullish(),
  status: TaskStatus.default('todo'),
  priority: TaskPriority.default(0),
  dueDate: z.coerce.date().nullish(),
  dueTime: z.string().nullish(), // HH:mm format
  completedAt: z.coerce.date().nullish(),
  sortOrder: z.number().int().default(0),
  recurrenceRule: z.string().nullish(), // iCal RRULE
  recurrenceParentId: z.string().uuid().nullish(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type TaskItem = z.infer<typeof TaskItem>;

// Smart view filter
export const TaskView = z.enum(['inbox', 'today', 'upcoming', 'all']);
export type TaskView = z.infer<typeof TaskView>;

// Inputs
export const CreateTaskInput = z.object({
  title: z.string().min(1),
  notes: z.string().nullish(),
  listId: z.string().uuid().nullish(),
  areaId: z.string().uuid().nullish(),
  priority: TaskPriority.default(0),
  dueDate: z.coerce.date().nullish(),
  dueTime: z.string().nullish(),
  recurrenceRule: z.string().nullish(),
  tagIds: z.array(z.string().uuid()).default([]),
});
export type CreateTaskInput = z.infer<typeof CreateTaskInput>;

export const UpdateTaskInput = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).optional(),
  notes: z.string().nullish(),
  listId: z.string().uuid().nullish(),
  areaId: z.string().uuid().nullish(),
  status: TaskStatus.optional(),
  priority: TaskPriority.optional(),
  dueDate: z.coerce.date().nullish(),
  dueTime: z.string().nullish(),
  recurrenceRule: z.string().nullish(),
  tagIds: z.array(z.string().uuid()).optional(),
});
export type UpdateTaskInput = z.infer<typeof UpdateTaskInput>;

export const TaskFilter = z.object({
  view: TaskView.optional(),
  listId: z.string().uuid().optional(),
  areaId: z.string().uuid().optional(),
  status: TaskStatus.optional(),
});
export type TaskFilter = z.infer<typeof TaskFilter>;

export const ReorderInput = z.object({
  items: z.array(z.object({
    id: z.string().uuid(),
    sortOrder: z.number().int(),
  })),
});
export type ReorderInput = z.infer<typeof ReorderInput>;

// List/Area inputs
export const CreateAreaInput = z.object({
  name: z.string().min(1),
  icon: z.string().nullish(),
  color: z.string().nullish(),
});
export type CreateAreaInput = z.infer<typeof CreateAreaInput>;

export const UpdateAreaInput = CreateAreaInput.partial().extend({
  id: z.string().uuid(),
});
export type UpdateAreaInput = z.infer<typeof UpdateAreaInput>;

export const CreateListInput = z.object({
  name: z.string().min(1),
  areaId: z.string().uuid().nullish(),
  icon: z.string().nullish(),
  color: z.string().nullish(),
});
export type CreateListInput = z.infer<typeof CreateListInput>;

export const UpdateListInput = CreateListInput.partial().extend({
  id: z.string().uuid(),
});
export type UpdateListInput = z.infer<typeof UpdateListInput>;

export const CreateTagInput = z.object({
  name: z.string().min(1),
  color: z.string().nullish(),
});
export type CreateTagInput = z.infer<typeof CreateTagInput>;

export const CreateChecklistInput = z.object({
  taskId: z.string().uuid(),
  title: z.string().min(1),
});
export type CreateChecklistInput = z.infer<typeof CreateChecklistInput>;

export const UpdateChecklistInput = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).optional(),
  done: z.boolean().optional(),
});
export type UpdateChecklistInput = z.infer<typeof UpdateChecklistInput>;
