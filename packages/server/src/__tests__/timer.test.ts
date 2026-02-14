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
  const { default: timerRouter } = await import('../routes/timer.js');
  app.use('/api/timer', timerRouter);
});

describe('POST /api/timer/start', () => {
  it('creates a time entry', async () => {
    const res = await request(app)
      .post('/api/timer/start')
      .send({ note: 'working' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.ended_at).toBeNull();
    expect(res.body.note).toBe('working');
  });

  it('returns 400 if timer already running', async () => {
    await request(app).post('/api/timer/start').send({});
    const res = await request(app).post('/api/timer/start').send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /api/timer/active', () => {
  it('returns running timer', async () => {
    await request(app).post('/api/timer/start').send({ note: 'test' });
    const res = await request(app).get('/api/timer/active');
    expect(res.status).toBe(200);
    expect(res.body).not.toBeNull();
    expect(res.body.note).toBe('test');
    expect(res.body.ended_at).toBeNull();
  });

  it('returns null when no active timer', async () => {
    const res = await request(app).get('/api/timer/active');
    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });
});

describe('POST /api/timer/stop', () => {
  it('stops active timer with duration', async () => {
    await request(app).post('/api/timer/start').send({});
    const res = await request(app).post('/api/timer/stop');
    expect(res.status).toBe(200);
    expect(res.body.ended_at).toBeDefined();
    expect(res.body.duration_minutes).toBeDefined();
  });

  it('returns 400 when no active timer', async () => {
    const res = await request(app).post('/api/timer/stop');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/timer', () => {
  it('returns time entries', async () => {
    await request(app).post('/api/timer/start').send({});
    await request(app).post('/api/timer/stop');
    const res = await request(app).get('/api/timer');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].ended_at).toBeDefined();
  });
});
