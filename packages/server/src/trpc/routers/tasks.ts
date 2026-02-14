import { z } from 'zod';
import { router, protectedProcedure } from '../trpc.js';
import { SYMBOLS } from '../../di/symbols.js';
import { TaskService } from '../../services/task-service.js';
import { ListRepository } from '../../services/list-repository.js';
import { AreaRepository } from '../../services/area-repository.js';
import { TagRepository } from '../../services/tag-repository.js';
import { ChecklistRepository } from '../../services/checklist-repository.js';
import {
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilter,
  ReorderInput,
  CreateListInput,
  UpdateListInput,
  CreateAreaInput,
  UpdateAreaInput,
  CreateTagInput,
  CreateChecklistInput,
  UpdateChecklistInput,
} from '@cc/shared';

export const tasksRouter = router({
  list: protectedProcedure.input(TaskFilter).query(async ({ ctx, input }) => {
    const service = ctx.container.get<TaskService>(SYMBOLS.TaskService);
    return service.list(input);
  }),

  get: protectedProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
    const service = ctx.container.get<TaskService>(SYMBOLS.TaskService);
    return service.get(input.id);
  }),

  create: protectedProcedure.input(CreateTaskInput).mutation(async ({ ctx, input }) => {
    const service = ctx.container.get<TaskService>(SYMBOLS.TaskService);
    return service.create(input);
  }),

  update: protectedProcedure.input(UpdateTaskInput).mutation(async ({ ctx, input }) => {
    const service = ctx.container.get<TaskService>(SYMBOLS.TaskService);
    return service.update(input);
  }),

  complete: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    const service = ctx.container.get<TaskService>(SYMBOLS.TaskService);
    return service.complete(input.id);
  }),

  delete: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    const service = ctx.container.get<TaskService>(SYMBOLS.TaskService);
    return service.delete(input.id);
  }),

  reorder: protectedProcedure.input(ReorderInput).mutation(async ({ ctx, input }) => {
    const service = ctx.container.get<TaskService>(SYMBOLS.TaskService);
    return service.reorder(input.items);
  }),

  // Lists
  lists: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const repo = ctx.container.get<ListRepository>(SYMBOLS.ListRepository);
      return repo.list();
    }),
    create: protectedProcedure.input(CreateListInput).mutation(async ({ ctx, input }) => {
      const repo = ctx.container.get<ListRepository>(SYMBOLS.ListRepository);
      return repo.create(input);
    }),
    update: protectedProcedure.input(UpdateListInput).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const repo = ctx.container.get<ListRepository>(SYMBOLS.ListRepository);
      return repo.update(id, data);
    }),
    delete: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
      const repo = ctx.container.get<ListRepository>(SYMBOLS.ListRepository);
      return repo.delete(input.id);
    }),
  }),

  // Areas
  areas: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const repo = ctx.container.get<AreaRepository>(SYMBOLS.AreaRepository);
      return repo.list();
    }),
    create: protectedProcedure.input(CreateAreaInput).mutation(async ({ ctx, input }) => {
      const repo = ctx.container.get<AreaRepository>(SYMBOLS.AreaRepository);
      return repo.create(input);
    }),
    update: protectedProcedure.input(UpdateAreaInput).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const repo = ctx.container.get<AreaRepository>(SYMBOLS.AreaRepository);
      return repo.update(id, data);
    }),
    delete: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
      const repo = ctx.container.get<AreaRepository>(SYMBOLS.AreaRepository);
      return repo.delete(input.id);
    }),
  }),

  // Tags
  tags: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const repo = ctx.container.get<TagRepository>(SYMBOLS.TagRepository);
      return repo.list();
    }),
    create: protectedProcedure.input(CreateTagInput).mutation(async ({ ctx, input }) => {
      const repo = ctx.container.get<TagRepository>(SYMBOLS.TagRepository);
      return repo.create(input);
    }),
    delete: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
      const repo = ctx.container.get<TagRepository>(SYMBOLS.TagRepository);
      return repo.delete(input.id);
    }),
  }),

  // Checklist
  checklist: router({
    list: protectedProcedure.input(z.object({ taskId: z.string().uuid() })).query(async ({ ctx, input }) => {
      const repo = ctx.container.get<ChecklistRepository>(SYMBOLS.ChecklistRepository);
      return repo.listByTask(input.taskId);
    }),
    create: protectedProcedure.input(CreateChecklistInput).mutation(async ({ ctx, input }) => {
      const repo = ctx.container.get<ChecklistRepository>(SYMBOLS.ChecklistRepository);
      return repo.create(input);
    }),
    update: protectedProcedure.input(UpdateChecklistInput).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const repo = ctx.container.get<ChecklistRepository>(SYMBOLS.ChecklistRepository);
      return repo.update(id, data);
    }),
    delete: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
      const repo = ctx.container.get<ChecklistRepository>(SYMBOLS.ChecklistRepository);
      return repo.delete(input.id);
    }),
  }),
});
