import { Router } from 'express';
import * as harvest from '../services/harvest.js';

const router = Router();

// GET /api/harvest/projects — list Harvest project assignments with task assignments
router.get('/projects', async (_req, res) => {
  try {
    if (!harvest.isConfigured()) {
      res.status(503).json({ error: 'Harvest not configured. Set HARVEST_ACCOUNT_ID and HARVEST_ACCESS_TOKEN in .env' });
      return;
    }
    const assignments = await harvest.getProjectAssignments();
    res.json(assignments);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/harvest/today — today's time entries from Harvest
router.get('/today', async (_req, res) => {
  try {
    if (!harvest.isConfigured()) {
      res.status(503).json({ error: 'Harvest not configured' });
      return;
    }
    const entries = await harvest.getTodayTimeEntries();
    res.json(entries);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/harvest/log — create a time entry in Harvest
router.post('/log', async (req, res) => {
  try {
    const { project_id, task_id, spent_date, hours, notes } = req.body;
    if (!project_id || !task_id || !spent_date || hours == null) {
      res.status(400).json({ error: 'project_id, task_id, spent_date, and hours are required' });
      return;
    }
    const entry = await harvest.createTimeEntry({ project_id, task_id, spent_date, hours, notes });
    res.json(entry);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/harvest/me — current user info
router.get('/me', async (_req, res) => {
  try {
    const user = await harvest.getCurrentUser();
    res.json(user);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
