import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';

const router = Router();

const REPORT_PATH = path.join(os.homedir(), '.claude', 'usage-data', 'report.html');

function getReportData(): { lastGenerated: string | null; html: string | null } {
  try {
    const stat = fs.statSync(REPORT_PATH);
    const html = fs.readFileSync(REPORT_PATH, 'utf-8');
    return { lastGenerated: stat.mtime.toISOString(), html };
  } catch {
    return { lastGenerated: null, html: null };
  }
}

router.get('/', (_req, res) => {
  res.json(getReportData());
});

router.post('/refresh', (_req, res) => {
  exec('claude /insights', { timeout: 120000 }, (error) => {
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json(getReportData());
  });
});

export default router;
