# Command Central - Implementation Plan

## Context

David has ADHD and struggles with executive functioning tasks: tracking work across multiple projects, logging time in Harvest, maintaining a to-do list, and context-switching. Command Central is a local web app that serves as a single dashboard to manage all development work, with active prompting to keep him on track.

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Express + TypeScript
- **Database:** SQLite (via better-sqlite3)
- **Styling:** Tailwind CSS
- **Location:** `~/command-central`
- **Monorepo:** Single repo, `packages/client` + `packages/server`

## Phase 1: Core Dashboard (This session)

Build the foundation — a working dashboard with manual task management, project tracking, and browser notifications.

### Project Structure
```
~/command-central/
├── package.json              # root workspace
├── packages/
│   ├── client/               # React + Vite
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Dashboard.tsx        # Main layout
│   │   │   │   ├── TaskList.tsx         # To-do list with quick capture
│   │   │   │   ├── ProjectSidebar.tsx   # Project switcher
│   │   │   │   ├── ActiveTimer.tsx      # Current work timer
│   │   │   │   ├── NotificationBar.tsx  # Prompt/reminder display
│   │   │   │   └── QuickCapture.tsx     # Global quick-add input
│   │   │   ├── hooks/
│   │   │   │   ├── useNotifications.ts  # Browser notification API
│   │   │   │   └── useTimer.ts          # Work session timer
│   │   │   ├── api/                     # API client functions
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   └── vite.config.ts
│   └── server/               # Express API
│       ├── src/
│       │   ├── index.ts              # Express app entry
│       │   ├── db.ts                 # SQLite setup + migrations
│       │   ├── routes/
│       │   │   ├── tasks.ts          # CRUD for tasks
│       │   │   ├── projects.ts       # CRUD for projects
│       │   │   └── timer.ts          # Work session tracking
│       │   └── services/
│       │       └── reminder.ts       # Notification scheduling logic
│       └── tsconfig.json
└── tsconfig.base.json
```

### Core Features
1. **Quick Capture** — Global input bar at the top. Type a task, hit enter, it's saved. Optionally assign to a project. Frictionless.
2. **Task List** — Prioritized to-do list. Drag to reorder. Mark complete. Filter by project.
3. **Project Sidebar** — List of active projects (Ghostlight, Adagio, PowerSchool, etc.). Click to filter tasks. Shows task counts.
4. **Active Timer** — Start/stop a work timer for the current task. Tracks what you're working on and for how long. This becomes the basis for Harvest integration.
5. **Idle Detection + Nudges** — Browser notifications:
   - "You've been idle for 15 minutes — still working on [task]?"
   - "You haven't logged time today"
   - "You have 3 tasks due today"
6. **Dashboard View** — At-a-glance: current task, timer, today's tasks, recent activity.

### Database Schema (SQLite)
```sql
-- Projects you're working on
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  color TEXT,           -- for UI color coding
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Tasks / to-dos
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  project_id TEXT REFERENCES projects(id),
  status TEXT DEFAULT 'todo',       -- todo, in_progress, done
  priority INTEGER DEFAULT 0,       -- sort order
  due_date TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT
);

-- Time entries (local, later syncs to Harvest)
CREATE TABLE time_entries (
  id TEXT PRIMARY KEY,
  task_id TEXT REFERENCES tasks(id),
  project_id TEXT REFERENCES projects(id),
  started_at TEXT NOT NULL,
  ended_at TEXT,
  duration_minutes INTEGER,
  notes TEXT,
  synced_to_harvest INTEGER DEFAULT 0
);
```

## Phase 2: Harvest Integration (Next)

- OAuth or personal access token auth with Harvest API
- Sync local time entries → Harvest
- Pull Harvest projects to map to local projects
- "Log time" button that sends to Harvest directly
- Daily reminder if time hasn't been logged

## Phase 3: Jira Integration

- Pull assigned tickets from Jira
- Auto-create tasks from Jira tickets
- Link tasks ↔ Jira issues
- Status sync (mark done in CC → transition in Jira)

## Phase 4: GitHub Integration

- Show open PRs needing review
- Show PR status for current branch
- Link tasks to PRs

## Phase 5: Slack Integration

- Show unread messages / mentions
- Quick-capture tasks from Slack messages

## Phase 6: Auto-Phase Detection & Pipeline Orchestration

### Auto-Phase Detection
- Phase reporter script (`~/.claude/skills/_shared/report-phase.sh`) called by skills at phase transitions
- State files written to `~/.claude/session-state/{session}.json`
- Server routes: `GET/POST /api/claude-state/*` for instant updates
- Dashboard polls every 5s, auto-updates phase and session_status on project cards
- Tmux pane content parsing as fallback when no state file exists

### Pipeline Orchestration
- New `/pipeline` skill orchestrates JIRA → analyze → implement → test → PR → notify
- Runs from dedicated "command-central" tmux session
- Delegates to project sessions via `tmux send-keys`
- Supports autonomous (default) and guided modes
- Error handling: 3 retries per step, then blocked + notification

### Command Central Hub
- "Command Central" project seeded with `is_hub=1`
- Special pinned card in dashboard with indigo/purple styling
- Shows pipeline progress, active skill, step indicators
- "Open CC Session" button to attach to tmux

### Notifications
- Server-side notification store: `GET/POST /api/notifications`
- Browser push notifications for pipeline completion and blocked alerts
- Slack DM notifications via Slack MCP when available

### Skills Updated
- `/implement`, `/task-analyzer`, `/estimate`, `/debug`, `/pr` now report phases via reporter script
- New `/pipeline` skill for full workflow orchestration

## Verification

After Phase 1 build:
1. `cd ~/command-central && pnpm install && pnpm dev` starts both client and server
2. Can create projects in the sidebar
3. Can quick-capture tasks and assign to projects
4. Can start/stop a timer on a task
5. Browser notification permission prompt appears on first visit
6. Idle notification fires after 15 minutes of no interaction
