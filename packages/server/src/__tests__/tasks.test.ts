import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTestDb, createTestApp } from '../test-helpers.js';
import request from 'supertest';
import type { Express } from 'express';

let app: Express;
let db: ReturnType<typeof createTestDb>;

vi.mock('../db.js', () => {
  return { default: createTestDb() };
});

beforeEach(async () => {
  const mod = await import('../db.js');
  db = mod.default as ReturnType<typeof createTestDb>;
  db.exec('DELETE FROM time_entries');
  db.exec('DELETE FROM tasks');
  db.exec('DELETE FROM projects');

  app = createTestApp();
  const { default: tasksRouter } = await import('../routes/tasks.js');
  const { default: projectsRouter } = await import('../routes/projects.js');
  app.use('/api/tasks', tasksRouter);
  app.use('/api/projects', projectsRouter);
});

describe('GET /api/tasks', () => {
  it('returns empty array initially', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('POST /api/tasks', () => {
  it('creates a task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Test Task' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.title).toBe('Test Task');
    expect(res.body.status).toBe('todo');
  });

  it('with project_id links to project', async () => {
    const proj = await request(app)
      .post('/api/projects')
      .send({ name: 'Proj' });
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Linked Task', project_id: proj.body.id });
    expect(res.status).toBe(201);
    expect(res.body.project_id).toBe(proj.body.id);
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app).post('/api/tasks').send({});
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/tasks/:id', () => {
  it('updates task fields', async () => {
    const create = await request(app)
      .post('/api/tasks')
      .send({ title: 'Original' });
    const res = await request(app)
      .patch(`/api/tasks/${create.body.id}`)
      .send({ title: 'Updated', description: 'desc' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated');
    expect(res.body.description).toBe('desc');
  });
});

describe('PATCH /api/tasks/:id/complete', () => {
  it('marks task done with completed_at', async () => {
    const create = await request(app)
      .post('/api/tasks')
      .send({ title: 'Complete Me' });
    const res = await request(app)
      .patch(`/api/tasks/${create.body.id}/complete`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('done');
    expect(res.body.completed_at).toBeDefined();
  });
});

describe('PATCH /api/tasks/reorder', () => {
  it('updates priority order', async () => {
    const t1 = await request(app).post('/api/tasks').send({ title: 'A' });
    const t2 = await request(app).post('/api/tasks').send({ title: 'B' });
    const t3 = await request(app).post('/api/tasks').send({ title: 'C' });

    const res = await request(app)
      .patch('/api/tasks/reorder')
      .send({ taskIds: [t3.body.id, t1.body.id, t2.body.id] });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const list = await request(app).get('/api/tasks');
    const priorities = list.body.map((t: { id: string; priority: number }) => ({
      id: t.id,
      priority: t.priority,
    }));
    expect(priorities.find((p: { id: string }) => p.id === t3.body.id).priority).toBe(0);
    expect(priorities.find((p: { id: string }) => p.id === t1.body.id).priority).toBe(1);
    expect(priorities.find((p: { id: string }) => p.id === t2.body.id).priority).toBe(2);
  });
});

describe('GET /api/tasks with filters', () => {
  it('filters by project_id', async () => {
    const proj = await request(app).post('/api/projects').send({ name: 'P1' });
    await request(app).post('/api/tasks').send({ title: 'T1', project_id: proj.body.id });
    await request(app).post('/api/tasks').send({ title: 'T2' });

    const res = await request(app).get(`/api/tasks?project_id=${proj.body.id}`);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('T1');
  });

  it('filters by status', async () => {
    const t = await request(app).post('/api/tasks').send({ title: 'T1' });
    await request(app).patch(`/api/tasks/${t.body.id}/complete`);
    await request(app).post('/api/tasks').send({ title: 'T2' });

    const res = await request(app).get('/api/tasks?status=done');
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('T1');
  });
});

describe('DELETE /api/tasks/:id', () => {
  it('removes task', async () => {
    const create = await request(app).post('/api/tasks').send({ title: 'Del' });
    const res = await request(app).delete(`/api/tasks/${create.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const list = await request(app).get('/api/tasks');
    expect(list.body).toHaveLength(0);
  });
});
