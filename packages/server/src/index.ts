import 'reflect-metadata';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '..', '..', '..', '.env');
dotenv.config({ path: envPath });

import http from 'http';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { setupTerminalWebSocket } from './services/terminal-ws.js';
import { createContainer } from './di/container.js';
import { appRouter } from './trpc/router.js';
import { createContextFactory } from './trpc/context.js';

// Legacy imports
import db from './db.js';
import projectsRouter from './routes/projects.js';
import tasksRouter from './routes/tasks.js';
import timerRouter from './routes/timer.js';
import claudeConfigRouter from './routes/claude-config.js';
import jiraRouter from './routes/jira.js';
import harvestRouter from './routes/harvest.js';
import tmuxRouter from './routes/tmux.js';
import insightsRouter from './routes/insights.js';
import claudeStateRouter from './routes/claude-state.js';
import notificationsRouter from './routes/notifications.js';

const app = express();
const PORT = 3001;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

// tRPC
const container = createContainer();
app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext: createContextFactory(container),
  }),
);

// Legacy Express routes
app.use('/api/projects', projectsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/timer', timerRouter);
app.use('/api/claude-config', claudeConfigRouter);
app.use('/api/jira', jiraRouter);
app.use('/api/harvest', harvestRouter);
app.use('/api/tmux', tmuxRouter);
app.use('/api/insights', insightsRouter);
app.use('/api/claude-state', claudeStateRouter);
app.use('/api/notifications', notificationsRouter);

const server = http.createServer(app);
setupTerminalWebSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`tRPC endpoint: http://localhost:${PORT}/trpc`);
});

export { db };
