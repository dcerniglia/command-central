import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import db from '../db.js';

const router = Router();
const STATE_DIR = path.join(os.homedir(), '.claude', 'session-state');

interface ClaudeSessionState {
  sessionName: string;
  phase: string;
  sessionStatus: string;
  skill: string;
  currentTask: string;
  timestamp: string;
  projectSlug: string;
}

// GET /api/claude-state/sessions — read all state files
router.get('/sessions', (_req, res) => {
  try {
    if (!fs.existsSync(STATE_DIR)) {
      res.json([]);
      return;
    }
    const files = fs.readdirSync(STATE_DIR).filter(f => f.endsWith('.json'));
    const states: ClaudeSessionState[] = [];
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(STATE_DIR, file), 'utf-8');
        const state = JSON.parse(content) as ClaudeSessionState;
        // Skip stale entries (older than 10 minutes)
        if (state.timestamp) {
          const age = Date.now() - new Date(state.timestamp).getTime();
          if (age < 10 * 60 * 1000) {
            states.push(state);
          }
        }
      } catch { /* skip malformed files */ }
    }
    res.json(states);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/claude-state/report — instant phase update
router.post('/report', (req, res) => {
  try {
    const state = req.body as ClaudeSessionState;
    if (!state.sessionName) {
      res.status(400).json({ error: 'sessionName required' });
      return;
    }

    // Write to state dir
    fs.mkdirSync(STATE_DIR, { recursive: true });
    const filePath = path.join(STATE_DIR, `${state.sessionName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2));

    // Update matching project in DB
    if (state.projectSlug) {
      const updates: string[] = [];
      const params: any[] = [];
      if (state.phase) {
        updates.push('phase = ?');
        params.push(state.phase);
      }
      if (state.sessionStatus) {
        updates.push('session_status = ?');
        params.push(state.sessionStatus);
      }
      if (updates.length > 0) {
        params.push(state.projectSlug);
        db.prepare(`UPDATE projects SET ${updates.join(', ')} WHERE slug = ?`).run(...params);
      }
    }

    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
