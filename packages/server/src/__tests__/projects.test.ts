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
  // Re-create db for isolation
  const mod = await import('../db.js');
  db = mod.default as ReturnType<typeof createTestDb>;
  db.exec('DELETE FROM tasks');
  db.exec('DELETE FROM time_entries');
  db.exec('DELETE FROM projects');

  app = createTestApp();
  const { default: projectsRouter } = await import('../routes/projects.js');
  app.use('/api/projects', projectsRouter);
});

describe('GET /api/projects', () => {
  it('returns empty array initially', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('POST /api/projects', () => {
  it('creates a project with auto-generated id and slug', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({ name: 'My Project' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.slug).toBe('my-project');
    expect(res.body.name).toBe('My Project');
    expect(res.body.active).toBe(1);
  });

  it('generates slug from name', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({ name: 'Hello World 123!' });
    expect(res.status).toBe(201);
    expect(res.body.slug).toBe('hello-world-123');
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app).post('/api/projects').send({});
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/projects/:id', () => {
  it('updates a project', async () => {
    const create = await request(app)
      .post('/api/projects')
      .send({ name: 'Original' });
    const id = create.body.id;

    const res = await request(app)
      .patch(`/api/projects/${id}`)
      .send({ name: 'Updated', color: '#ff0000' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated');
    expect(res.body.color).toBe('#ff0000');
    expect(res.body.slug).toBe('updated');
  });
});

describe('DELETE /api/projects/:id', () => {
  it('soft-deletes by setting active=0', async () => {
    const create = await request(app)
      .post('/api/projects')
      .send({ name: 'To Delete' });
    const id = create.body.id;

    const res = await request(app).delete(`/api/projects/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const get = await request(app).get('/api/projects');
    const project = get.body.find((p: { id: string }) => p.id === id);
    expect(project.active).toBe(0);
  });
});
