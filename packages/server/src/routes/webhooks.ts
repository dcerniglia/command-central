import { Router } from 'express';
import type { Container } from 'inversify';
import { SYMBOLS } from '../di/symbols.js';
import { JiraService } from '../services/jira-service.js';

export function createWebhookRouter(container: Container): Router {
  const router = Router();

  router.post('/jira', async (req, res) => {
    const secret = req.query.secret as string | undefined;
    const expectedSecret = process.env.JIRA_WEBHOOK_SECRET;

    if (!expectedSecret || secret !== expectedSecret) {
      res.status(401).json({ error: 'Invalid webhook secret' });
      return;
    }

    try {
      const jira = container.get<JiraService>(SYMBOLS.JiraService);
      await jira.processWebhook(req.body);
      res.json({ ok: true });
    } catch (err) {
      console.error('Jira webhook error:', err);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  return router;
}
