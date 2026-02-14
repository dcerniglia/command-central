import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db.js';

const router = Router();

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

router.get('/', (_req, res) => {
  const projects = db.prepare('SELECT * FROM projects ORDER BY active DESC, created_at DESC').all();
  res.json(projects);
});

router.post('/', (req, res) => {
  const { name, color } = req.body;
  if (!name) {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  const id = uuid();
  const slug = slugify(name);
  db.prepare('INSERT INTO projects (id, name, slug, color) VALUES (?, ?, ?, ?)').run(id, name, slug, color ?? '#6366f1');
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  res.status(201).json(project);
});

router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const key of ['name', 'slug', 'color', 'active', 'harvest_project_id', 'harvest_default_task_id', 'phase', 'session_status'] as const) {
    if (req.body[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(req.body[key]);
      if (key === 'name' && !req.body.slug) {
        fields.push('slug = ?');
        values.push(slugify(req.body[key]));
      }
    }
  }
  if (fields.length === 0) {
    res.status(400).json({ error: 'no fields to update' });
    return;
  }
  values.push(id);
  db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  res.json(project);
});

router.delete('/:id', (req, res) => {
  db.prepare('UPDATE projects SET active = 0 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
