import { Router } from 'express';
import { execSync, spawn } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { getTmuxSessions } from '../services/tmux.js';

const router = Router();

const LOCAL_BIN = path.join(process.env.HOME ?? '', '.local', 'bin');

router.get('/sessions', (_req, res) => {
  const sessions = getTmuxSessions();
  res.json(sessions);
});

// Open an existing tmux session — attach in a new Ghostty window
router.post('/open/:session', (req, res) => {
  const { session } = req.params;

  const sessions = getTmuxSessions();
  const exists = sessions.some((s) => s.name === session);

  if (!exists) {
    res.status(404).json({ error: `tmux session "${session}" not found` });
    return;
  }

  // Launch Ghostty with tmux attach
  const child = spawn('ghostty', ['-e', 'tmux', 'attach-session', '-t', session], {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();

  res.json({ success: true, session });
});

// Launch a project session using its launcher script (ghostlight, adagio, etc.)
// Falls back to claude-session, then basic tmux
router.post('/launch', (req, res) => {
  const { sessionName, slug } = req.body;
  if (!sessionName) {
    res.status(400).json({ error: 'sessionName is required' });
    return;
  }

  // If session already exists, just attach
  const sessions = getTmuxSessions();
  if (sessions.some((s) => s.name === sessionName)) {
    const child = spawn('ghostty', ['-e', 'tmux', 'attach-session', '-t', sessionName], {
      detached: true,
      stdio: 'ignore',
    });
    child.unref();
    res.json({ success: true, session: sessionName, method: 'attach' });
    return;
  }

  // Look for a dedicated launcher script in ~/.local/bin/
  // Try: session name first, then slug
  const candidates = [sessionName, slug].filter(Boolean);
  let launcherPath: string | null = null;
  for (const name of candidates) {
    const candidate = path.join(LOCAL_BIN, name);
    if (existsSync(candidate)) {
      launcherPath = candidate;
      break;
    }
  }

  if (launcherPath) {
    // Run the launcher script inside Ghostty (it handles tmux creation + attach)
    const child = spawn('ghostty', ['-e', launcherPath], {
      detached: true,
      stdio: 'ignore',
    });
    child.unref();
    res.json({ success: true, session: sessionName, method: 'launcher', script: launcherPath });
    return;
  }

  // Fallback: use claude-session if it exists
  const claudeSession = path.join(LOCAL_BIN, 'claude-session');
  if (existsSync(claudeSession)) {
    const child = spawn('ghostty', ['-e', claudeSession, sessionName], {
      detached: true,
      stdio: 'ignore',
    });
    child.unref();
    res.json({ success: true, session: sessionName, method: 'claude-session' });
    return;
  }

  // Last resort: basic tmux + Ghostty
  const child = spawn('ghostty', ['-e', 'bash', '-c', `tmux new-session -s "${sessionName}" || tmux attach-session -t "${sessionName}"`], {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
  res.json({ success: true, session: sessionName, method: 'basic' });
});

// Kill a single tmux session
router.delete('/sessions/:session', (req, res) => {
  const { session } = req.params;
  const sessions = getTmuxSessions();
  const exists = sessions.some((s) => s.name === session);

  if (!exists) {
    res.status(404).json({ error: `tmux session "${session}" not found` });
    return;
  }

  try {
    execSync(`tmux kill-session -t "${session}"`, { timeout: 5000 });
    res.json({ success: true, session });
  } catch {
    res.status(500).json({ error: `Failed to kill session "${session}"` });
  }
});

// Kill all tmux sessions
router.post('/kill-all', (_req, res) => {
  const sessions = getTmuxSessions();
  if (sessions.length === 0) {
    res.json({ success: true, killed: 0 });
    return;
  }

  try {
    execSync('tmux kill-server', { timeout: 5000 });
    res.json({ success: true, killed: sessions.length });
  } catch {
    res.status(500).json({ error: 'Failed to kill tmux server' });
  }
});

export default router;
