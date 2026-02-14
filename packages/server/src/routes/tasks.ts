import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const { project_id, status } = req.query;
  let sql = 'SELECT * FROM tasks WHERE 1=1';
  const params: unknown[] = [];
  if (project_id) {
    sql += ' AND project_id = ?';
    params.push(project_id);
  }
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  sql += ' ORDER BY priority ASC, created_at DESC';
  const tasks = db.prepare(sql).all(...params);
  res.json(tasks);
});

router.post('/', (req, res) => {
  const { title, description, status, priority, project_id, due_date } = req.body;
  if (!title) {
    res.status(400).json({ error: 'title is required' });
    return;
  }
  const id = uuid();
  db.prepare(
    'INSERT INTO tasks (id, title, description, status, priority, project_id, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, title, description ?? null, status ?? 'todo', priority ?? 0, project_id ?? null, due_date ?? null);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.status(201).json(task);
});

router.patch('/reorder', (req, res) => {
  const { taskIds } = req.body;
  if (!Array.isArray(taskIds)) {
    res.status(400).json({ error: 'taskIds array is required' });
    return;
  }
  const stmt = db.prepare('UPDATE tasks SET priority = ? WHERE id = ?');
  const reorder = db.transaction((ids: string[]) => {
    ids.forEach((id, index) => stmt.run(index, id));
  });
  reorder(taskIds);
  res.json({ success: true });
});

router.patch('/:id/complete', (req, res) => {
  const { id } = req.params;
  db.prepare("UPDATE tasks SET status = 'done', completed_at = datetime('now') WHERE id = ?").run(id);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.json(task);
});

router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const allowed = ['title', 'description', 'status', 'priority', 'project_id', 'due_date'];
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(req.body[key]);
    }
  }
  if (fields.length === 0) {
    res.status(400).json({ error: 'no fields to update' });
    return;
  }
  values.push(id);
  db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.json(task);
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
