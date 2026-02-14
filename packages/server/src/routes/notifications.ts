import { Router } from 'express';
import crypto from 'crypto';

const router = Router();

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  project?: string;
  timestamp: string;
  read: boolean;
}

// In-memory store (ephemeral — notifications don't need persistence)
const notifications: Notification[] = [];

// POST /api/notifications — store a notification
router.post('/', (req, res) => {
  const { type, title, body, project } = req.body;
  if (!title || !body) {
    res.status(400).json({ error: 'title and body required' });
    return;
  }
  const notification: Notification = {
    id: crypto.randomUUID(),
    type: type ?? 'info',
    title,
    body,
    project,
    timestamp: new Date().toISOString(),
    read: false,
  };
  notifications.push(notification);
  // Keep only last 50
  if (notifications.length > 50) notifications.splice(0, notifications.length - 50);
  res.json(notification);
});

// GET /api/notifications — poll pending notifications
router.get('/', (_req, res) => {
  const unread = notifications.filter(n => !n.read);
  // Mark as read
  for (const n of unread) n.read = true;
  res.json(unread);
});

export default router;
