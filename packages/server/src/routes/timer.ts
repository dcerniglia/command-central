import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import * as harvest from '../services/harvest.js';

const router = Router();

router.post('/start', (req, res) => {
  const { task_id, project_id, note } = req.body;
  // Stop any active timer first
  const active = db.prepare('SELECT * FROM time_entries WHERE ended_at IS NULL').get();
  if (active) {
    res.status(400).json({ error: 'A timer is already running. Stop it first.' });
    return;
  }
  const id = uuid();
  db.prepare(
    'INSERT INTO time_entries (id, task_id, project_id, note) VALUES (?, ?, ?, ?)'
  ).run(id, task_id ?? null, project_id ?? null, note ?? null);
  const entry = db.prepare('SELECT * FROM time_entries WHERE id = ?').get(id);
  res.status(201).json(entry);
});

router.post('/stop', async (_req, res) => {
  const active = db.prepare('SELECT * FROM time_entries WHERE ended_at IS NULL').get() as {
    id: string; started_at: string; project_id: string | null; task_id: string | null; note: string | null;
  } | undefined;
  if (!active) {
    res.status(400).json({ error: 'No active timer' });
    return;
  }
  const startedAt = new Date(active.started_at + 'Z').getTime();
  const now = Date.now();
  const durationMinutes = (now - startedAt) / 60000;
  const hours = Math.max(0.01, Math.round((durationMinutes / 60) * 100) / 100);

  db.prepare("UPDATE time_entries SET ended_at = datetime('now'), duration_minutes = ? WHERE id = ?").run(
    Math.round(durationMinutes * 100) / 100,
    active.id
  );

  // Auto-sync to Harvest if project is mapped
  let harvestEntryId: number | null = null;
  if (active.project_id && harvest.isConfigured() && hours > 0) {
    const project = db.prepare('SELECT harvest_project_id, harvest_default_task_id FROM projects WHERE id = ?')
      .get(active.project_id) as { harvest_project_id: string | null; harvest_default_task_id: string | null } | undefined;

    if (project?.harvest_project_id) {
      try {
        // Auto-resolve harvest task ID if not set
        let harvestTaskId = project.harvest_default_task_id;
        if (!harvestTaskId) {
          const assignments = await harvest.getProjectAssignments();
          const match = assignments.find(a => String(a.project.id) === project.harvest_project_id);
          if (match?.taskAssignments.length) {
            harvestTaskId = String(match.taskAssignments[0].task.id);
            // Save for future use
            db.prepare('UPDATE projects SET harvest_default_task_id = ? WHERE id = ?')
              .run(harvestTaskId, active.project_id);
          }
        }
        if (!harvestTaskId) throw new Error('No Harvest task assignment found');

        // Get the task title for notes
        let notes = active.note ?? '';
        if (active.task_id) {
          const task = db.prepare('SELECT title FROM tasks WHERE id = ?').get(active.task_id) as { title: string } | undefined;
          if (task) notes = task.title;
        }

        const today = new Date().toISOString().slice(0, 10);
        const harvestEntry = await harvest.createTimeEntry({
          project_id: parseInt(project.harvest_project_id),
          task_id: parseInt(harvestTaskId),
          spent_date: today,
          hours,
          notes: notes || undefined,
        });
        harvestEntryId = harvestEntry.id;
        db.prepare('UPDATE time_entries SET synced_to_harvest = 1, harvest_entry_id = ? WHERE id = ?')
          .run(String(harvestEntryId), active.id);
      } catch (e) {
        // Don't fail the stop — just log the error
        console.error('Failed to sync to Harvest:', (e as Error).message);
      }
    }
  }

  const entry = db.prepare('SELECT * FROM time_entries WHERE id = ?').get(active.id);
  res.json(entry);
});

router.get('/active', (_req, res) => {
  const active = db.prepare('SELECT * FROM time_entries WHERE ended_at IS NULL').get();
  res.json(active ?? null);
});

router.get('/', (_req, res) => {
  const entries = db.prepare('SELECT * FROM time_entries ORDER BY started_at DESC LIMIT 50').all();
  res.json(entries);
});

export default router;
