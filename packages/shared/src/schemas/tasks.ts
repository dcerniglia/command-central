import { z } from 'zod';

// Enums
export const TaskStatus = z.enum(['todo', 'in_progress', 'blocked', 'waiting', 'done', 'cancelled']);
export type TaskStatus = z.infer<typeof TaskStatus>;

export const ProjectStatus = z.enum(['active', 'completed', 'on_hold', 'archived']);
export type ProjectStatus = z.infer<typeof ProjectStatus>;

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

export const TaskTag = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  color: z.string().nullish(),
});
export type TaskTag = z.infer<typeof TaskTag>;

export const TaskProject = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().nullish(),
  areaId: z.string().uuid().nullish(),
  status: ProjectStatus.default('active'),
  icon: z.string().nullish(),
  color: z.string().nullish(),
  startDate: z.string().nullish(),
  dueDate: z.string().nullish(),
  sortOrder: z.number().int().default(0),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type TaskProject = z.infer<typeof TaskProject>;

export const TaskSource = z.enum(['local', 'jira']);
export type TaskSource = z.infer<typeof TaskSource>;

export const TaskItem = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  notes: z.string().nullish(),
  projectId: z.string().uuid().nullish(),
  status: TaskStatus.default('todo'),
  priority: TaskPriority.default(0),
  startDate: z.coerce.date().nullish(),
  dueDate: z.coerce.date().nullish(),
  dueTime: z.string().nullish(), // HH:mm format
  estimateMinutes: z.number().int().nullish(),
  timeSpentMinutes: z.number().int().nullish(),
  completedAt: z.coerce.date().nullish(),
  sortOrder: z.number().int().default(0),
  recurrenceRule: z.string().nullish(), // iCal RRULE
  recurrenceParentId: z.string().uuid().nullish(),
  processed: z.boolean().default(false),
  source: TaskSource.default('local'),
  externalKey: z.string().nullish(),
  externalUrl: z.string().nullish(),
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
  projectId: z.string().uuid().nullish(),
  priority: TaskPriority.default(0),
  startDate: z.coerce.date().nullish(),
  dueDate: z.coerce.date().nullish(),
  dueTime: z.string().nullish(),
  estimateMinutes: z.number().int().nullish(),
  recurrenceRule: z.string().nullish(),
  tagIds: z.array(z.string().uuid()).default([]),
  processed: z.boolean().default(false),
});
export type CreateTaskInput = z.infer<typeof CreateTaskInput>;

// Natural language parsing
export const ParseTaskInput = z.object({
  text: z.string().min(1),
});
export type ParseTaskInput = z.infer<typeof ParseTaskInput>;

export const ParsedTaskPreview = z.object({
  title: z.string(),
  notes: z.string().nullish(),
  projectId: z.string().uuid().nullish(),
  projectName: z.string().nullish(),
  tagIds: z.array(z.string().uuid()).default([]),
  tagNames: z.array(z.string()).default([]),
  priority: TaskPriority.default(0),
  dueDate: z.string().nullish(),
  startDate: z.string().nullish(),
  dueTime: z.string().nullish(),
  estimateMinutes: z.number().int().nullish(),
});
export type ParsedTaskPreview = z.infer<typeof ParsedTaskPreview>;

export const UpdateTaskInput = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).optional(),
  notes: z.string().nullish(),
  projectId: z.string().uuid().nullish(),
  status: TaskStatus.optional(),
  priority: TaskPriority.optional(),
  startDate: z.coerce.date().nullish(),
  dueDate: z.coerce.date().nullish(),
  dueTime: z.string().nullish(),
  estimateMinutes: z.number().int().nullish(),
  timeSpentMinutes: z.number().int().nullish(),
  recurrenceRule: z.string().nullish(),
  tagIds: z.array(z.string().uuid()).optional(),
});
export type UpdateTaskInput = z.infer<typeof UpdateTaskInput>;

export const TaskFilter = z.object({
  view: TaskView.optional(),
  projectId: z.string().uuid().optional(),
  areaId: z.string().uuid().optional(),
  status: TaskStatus.optional(),
  focusAreaId: z.string().uuid().optional(),
  noProject: z.boolean().optional(),
});
export type TaskFilter = z.infer<typeof TaskFilter>;

export const ReorderInput = z.object({
  items: z.array(z.object({
    id: z.string().uuid(),
    sortOrder: z.number().int(),
  })),
});
export type ReorderInput = z.infer<typeof ReorderInput>;

// Area inputs
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

export const CreateTagInput = z.object({
  name: z.string().min(1),
  color: z.string().nullish(),
});
export type CreateTagInput = z.infer<typeof CreateTagInput>;

export const CreateProjectInput = z.object({
  name: z.string().min(1),
  description: z.string().nullish(),
  areaId: z.string().uuid().nullish(),
  icon: z.string().nullish(),
  color: z.string().nullish(),
  startDate: z.string().nullish(),
  dueDate: z.string().nullish(),
});
export type CreateProjectInput = z.infer<typeof CreateProjectInput>;

export const UpdateProjectInput = CreateProjectInput.partial().extend({
  id: z.string().uuid(),
  status: ProjectStatus.optional(),
});
export type UpdateProjectInput = z.infer<typeof UpdateProjectInput>;

