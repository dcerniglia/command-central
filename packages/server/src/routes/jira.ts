import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import * as jira from '../services/jira.js';

const router = Router();

// GET /api/jira/issues — list all assigned Jira issues
router.get('/issues', async (_req, res) => {
  try {
    if (!jira.isConfigured()) {
      res.status(503).json({ error: 'Jira not configured. Set JIRA_URL, JIRA_EMAIL, JIRA_API_TOKEN in .env' });
      return;
    }
    const issues = await jira.getMyIssues();
    res.json(issues);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/jira/issues/:key — single issue detail
router.get('/issues/:key', async (req, res) => {
  try {
    const issue = await jira.getIssue(req.params.key);
    res.json(issue);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// POST /api/jira/sync — pull Jira issues into local tasks
router.post('/sync', async (_req, res) => {
  try {
    if (!jira.isConfigured()) {
      res.status(503).json({ error: 'Jira not configured' });
      return;
    }
    const issues = await jira.getMyIssues();
    let created = 0;
    let updated = 0;

    const syncTx = db.transaction(() => {
      for (const issue of issues) {
        // Find or create the project for this Jira project
        let project = db.prepare('SELECT id FROM projects WHERE slug = ?').get(slugify(issue.projectKey)) as { id: string } | undefined;
        if (!project) {
          const projectId = uuid();
          db.prepare('INSERT INTO projects (id, name, slug, color) VALUES (?, ?, ?, ?)').run(
            projectId, issue.projectName, slugify(issue.projectKey), '#6366f1'
          );
          project = { id: projectId };
        }

        // Check if task with this jira_key already exists
        const existing = db.prepare('SELECT id, status FROM tasks WHERE jira_key = ?').get(issue.key) as { id: string; status: string } | undefined;

        // Map Jira status category to CC status
        let ccStatus = 'todo';
        if (issue.statusCategory === 'indeterminate') ccStatus = 'in_progress';
        if (issue.statusCategory === 'done') ccStatus = 'done';

        if (existing) {
          // Update status if it changed in Jira, but don't overwrite manual local changes
          if (existing.status !== 'done' || ccStatus === 'done') {
            db.prepare('UPDATE tasks SET status = ?, project_id = ? WHERE id = ? AND source = ?')
              .run(ccStatus, project.id, existing.id, 'jira');
            updated++;
          }
        } else {
          const taskId = uuid();
          db.prepare(
            "INSERT INTO tasks (id, title, description, status, priority, project_id, source, jira_key) VALUES (?, ?, ?, ?, ?, ?, 'jira', ?)"
          ).run(taskId, `[${issue.key}] ${issue.summary}`, null, ccStatus, 0, project.id, issue.key);
          created++;
        }
      }
    });

    syncTx();

    res.json({ synced: issues.length, created, updated });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
