import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';
import { mkdirSync } from 'fs';

const dataDir = path.join(process.env.HOME ?? '', 'command-central', 'data');
mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'command-central.db');
const db = new Database(dbPath);

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

// Schema migrations — add columns if they don't exist
const migrations = [
  "ALTER TABLE tasks ADD COLUMN jira_key TEXT",
  "ALTER TABLE tasks ADD COLUMN source TEXT DEFAULT 'local'",
  "ALTER TABLE time_entries ADD COLUMN synced_to_harvest INTEGER DEFAULT 0",
  "ALTER TABLE time_entries ADD COLUMN harvest_entry_id TEXT",
  "ALTER TABLE projects ADD COLUMN harvest_project_id TEXT",
  "ALTER TABLE projects ADD COLUMN harvest_default_task_id TEXT",
  "ALTER TABLE projects ADD COLUMN phase TEXT DEFAULT NULL",
  "ALTER TABLE projects ADD COLUMN session_status TEXT DEFAULT NULL",
  "ALTER TABLE projects ADD COLUMN is_hub INTEGER DEFAULT 0",
];

for (const sql of migrations) {
  try { db.exec(sql); } catch { /* column already exists */ }
}

// Seed Command Central hub project
try {
  const ccExists = db.prepare("SELECT id FROM projects WHERE slug = 'command-central'").get();
  if (!ccExists) {
    const id = crypto.randomUUID();
    db.prepare("INSERT INTO projects (id, name, slug, color, is_hub) VALUES (?, 'Command Central', 'command-central', '#8b5cf6', 1)").run(id);
  }
} catch { /* already exists or other issue */ }

export default db;
