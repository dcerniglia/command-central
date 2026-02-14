import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTestDb } from '../test-helpers.js';

vi.mock('../db.js', () => {
  return { default: createTestDb() };
});

let db: ReturnType<typeof createTestDb>;

beforeEach(async () => {
  const mod = await import('../db.js');
  db = mod.default as ReturnType<typeof createTestDb>;
  db.exec('DELETE FROM time_entries');
  db.exec('DELETE FROM tasks');
  db.exec('DELETE FROM projects');
});

describe('getIdleStatus', () => {
  it('returns idle true when no time entries exist', async () => {
    const { getIdleStatus } = await import('../services/reminder.js');
    const result = getIdleStatus();
    expect(result.idle).toBe(true);
    expect(result.minutesSinceLastActivity).toBeNull();
  });

  it('returns idle false when timer is active', async () => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    db.prepare(
      "INSERT INTO time_entries (id, started_at, created_at) VALUES ('t1', ?, ?)"
    ).run(now, now);
    const { getIdleStatus } = await import('../services/reminder.js');
    const result = getIdleStatus();
    expect(result.idle).toBe(false);
    expect(result.activeTimer).toBeDefined();
  });

  it('returns idle true with minutes since last activity', async () => {
    const past = new Date(Date.now() - 10 * 60000).toISOString().replace('T', ' ').slice(0, 19);
    const pastEnd = new Date(Date.now() - 5 * 60000).toISOString().replace('T', ' ').slice(0, 19);
    db.prepare(
      "INSERT INTO time_entries (id, started_at, ended_at, duration_minutes, created_at) VALUES ('t1', ?, ?, 5, ?)"
    ).run(past, pastEnd, past);
    const { getIdleStatus } = await import('../services/reminder.js');
    const result = getIdleStatus();
    expect(result.idle).toBe(true);
    expect(result.minutesSinceLastActivity).toBeGreaterThan(0);
  });
});

describe('getDailyStats', () => {
  it('returns zero stats when no entries', async () => {
    const { getDailyStats } = await import('../services/reminder.js');
    const result = getDailyStats();
    expect(result.totalMinutesLogged).toBe(0);
    expect(result.tasksCompleted).toBe(0);
  });

  it('counts completed tasks today', async () => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    db.prepare(
      "INSERT INTO tasks (id, title, status, completed_at, created_at) VALUES ('t1', 'Done', 'done', ?, ?)"
    ).run(now, now);
    const { getDailyStats } = await import('../services/reminder.js');
    const result = getDailyStats();
    expect(result.tasksCompleted).toBe(1);
  });
});

describe('getDueTasksToday', () => {
  it('returns tasks due today that are not done', async () => {
    const today = new Date().toISOString().slice(0, 10);
    db.prepare(
      "INSERT INTO tasks (id, title, status, due_date, created_at) VALUES ('t1', 'Due Today', 'todo', ?, datetime('now'))"
    ).run(today);
    db.prepare(
      "INSERT INTO tasks (id, title, status, due_date, completed_at, created_at) VALUES ('t2', 'Done Today', 'done', ?, datetime('now'), datetime('now'))"
    ).run(today);
    const { getDueTasksToday } = await import('../services/reminder.js');
    const result = getDueTasksToday();
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Due Today');
  });

  it('returns empty array when no tasks due today', async () => {
    const { getDueTasksToday } = await import('../services/reminder.js');
    const result = getDueTasksToday();
    expect(result).toEqual([]);
  });
});
