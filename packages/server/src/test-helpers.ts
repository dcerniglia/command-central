import Database from 'better-sqlite3';
import express from 'express';

export function createTestDb() {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      color TEXT DEFAULT '#6366f1',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'todo',
      priority INTEGER NOT NULL DEFAULT 0,
      project_id TEXT REFERENCES projects(id),
      due_date TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS time_entries (
      id TEXT PRIMARY KEY,
      task_id TEXT REFERENCES tasks(id),
      project_id TEXT REFERENCES projects(id),
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      ended_at TEXT,
      duration_minutes REAL,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  return db;
}

export function createTestApp() {
  const app = express();
  app.use(express.json());
  return app;
}
