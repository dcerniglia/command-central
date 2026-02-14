import { useState } from 'react';

interface Section {
  title: string;
  content: string;
}

const sections: Section[] = [
  {
    title: 'Overview',
    content: `Command Central is a local-first dashboard for managing tasks, time tracking, and project workstreams. It integrates with Jira, Harvest, tmux, and Ghostty to give you an at-a-glance view of everything happening across your active projects.

The app runs as a local dev server (\`pnpm dev\`) with an Express backend on port 3001 and a Vite React frontend on port 5173. Data is stored in a SQLite database at \`~/command-central/data/command-central.db\`.

There are three tabs: **Tasks** (the main dashboard), **Claude Code** (configuration viewer), and **Docs** (this page).

New in Phase 6: Auto-phase detection from Claude Code skills, pipeline orchestration (/pipeline skill), Command Central hub session, and enhanced browser + Slack notifications.`,
  },
  {
    title: 'Dashboard Views',
    content: `**Card View (default)** — Shows active workstream cards in a responsive grid (up to 3 columns). Each card represents a project that has open tasks, a running tmux session, or an active timer. Cards are sorted so projects with active tmux sessions appear first. Each card shows:
- Project name with color bar at the top
- Tmux session indicator — green pulsing "live" badge (clickable to open in Ghostty) or gray "start session" button
- Session status dropdown — track what Claude is doing (auto-detected or manual)
- Phase badge (click to cycle: analyzing → coding → reviewing → testing → blocked)
- Current in-progress task with Jira link
- Active timer with elapsed time
- Todo/done task counts (done count is gray when 0, green when > 0)
- Harvest hours logged today (if project is mapped)

Below the cards, the **full task list** is displayed with In Progress and To Do sections, so you can manage tasks directly without switching views.

Below the task list, a collapsible **Task Backlog** shows tasks not assigned to any active workstream project.

**List View** — The classic sidebar + task list layout with project filtering. Toggle between views using the grid/list icons in the top-right of the nav bar.

**Kill All Sessions** — A red button in the header bar (visible when tmux sessions are running) that kills all tmux sessions at once via \`tmux kill-server\`. Shows a confirmation dialog before executing.`,
  },
  {
    title: 'Projects',
    content: `Projects organize your tasks and time entries. Each project has a name, color, slug (auto-generated from the name), and optional phase and session status fields.

**Creating a project:** Use the "Add Project" form at the bottom of the sidebar (list view) or the quick capture bar (select a project before adding a task).

**Deactivating a project:** Projects can be deactivated (\`active=0\`) which hides them from the dashboard and project selectors. They remain in the database and can be reactivated.

**Harvest mapping:** Click the "+H" button on a project in the sidebar to map it to a Harvest project and task. This enables automatic hour tracking on workstream cards and auto-syncing time entries when timers are stopped.

**Phases:** In card view, click the phase badge on a project card to cycle through phases: analyzing → coding → reviewing → testing → blocked → (clear). Phases persist in the database.

**Project colors:** Each project has a color used for the card header bar and task list badges. Set the color when creating a project via the color picker.`,
  },
  {
    title: 'Session Status',
    content: `Each workstream card has a **session status** dropdown for tracking what's happening in your Claude Code / tmux sessions. This is the primary tool for managing multiple parallel development sessions.

**Available statuses:**
- **Claude working** (blue) — Claude is actively generating code or making changes
- **Needs input** (amber) — Claude is waiting for your response or decision
- **Debugging** (red) — Something broke and needs investigation
- **Ready to commit** (green) — Code is done, needs to be committed or PR'd
- **In review** (purple) — PR is open or code is being reviewed
- **Idle** (gray) — Session exists but nothing is actively happening

**Auto-detection:** When a tmux session is matched to a project, Command Central reads the last 30 lines of the pane output every 10 seconds and automatically detects the session status:
- Shell prompt with \`>\` waiting → **Needs input**
- Permission prompts (Allow?, y/n) → **Needs input**
- Error messages, stack traces, FAIL → **Debugging**
- "changes complete", "shall I commit" → **Ready to commit**
- Spinner characters, "thinking", "writing" → **Claude working**
- No Claude process running → **Idle**

Auto-detected statuses show an "AUTO" label on the card. You can manually override any status by clicking the dropdown — this pauses auto-detection for that project. Clear the status (click the active status again) to resume auto-detection.

**Manual override:** Click the status area on any card to open the dropdown and select a status. Click the same status again to clear it and resume auto-detection. The status persists in the database across reloads.

**Workflow tip:** When working across multiple projects, scan your cards for amber "Needs input" statuses — those are the sessions waiting on you. Green "Ready to commit" cards are done and just need a commit. This helps you context-switch efficiently without losing track of where each session is.

Auto-Detection from State Files: When skills report their phase via ~/.claude/session-state/ files, the dashboard auto-updates session status. State file detection takes priority over tmux pane parsing. Manual status overrides still work — setting a status manually disables auto-detection for that project until cleared.`,
  },
  {
    title: 'Tasks',
    content: `Tasks have three statuses: **todo**, **in_progress**, and **done**.

**Quick capture:** Type a task title in the input bar at the top of both card and list views. Optionally select a project from the dropdown. Press Enter or click Add.

**Task list layout:** In card view, the full task list appears below the workstream cards with sections for In Progress, To Do, and Done (collapsed by default). Each task row shows:
- Completion checkbox on the left
- Task title
- Right-aligned badges: due date, Jira key (links to Jira), project name badge
- Hover controls: Start button, timer play button, drag handle

Badges and controls are aligned in fixed-width columns so they line up across rows regardless of content.

**Starting a task:** Click "Start" on a todo task to move it to in_progress. In the task list, hover over a task to reveal the Start button.

**Completing a task:** Click the checkbox next to a task to mark it done with a timestamp.

**Reordering:** Drag tasks using the grip handle on the right side to reorder by priority.

**Jira sync:** Click "Sync Jira" in the header bar to pull your assigned Jira issues into Command Central as tasks. Jira keys appear as blue badges that link to \`https://thedevshop.atlassian.net/browse/<key>\`.`,
  },
  {
    title: 'Time Tracking',
    content: `**Starting a timer:** Hover over any task in the task list and click the play button to start tracking time. Only one timer can run at a time. The active timer appears in the header bar showing the task title and elapsed time (HH:MM:SS).

**Stopping a timer:** Click the red "Stop" button on the active timer. The time entry is saved with the calculated duration.

**Auto-sync to Harvest:** When you stop a timer on a project that is mapped to Harvest, the time entry is automatically logged to Harvest using the mapped project and task. The task title is used as the Harvest note. If the sync fails, the timer still stops successfully — the error is logged server-side.

**Harvest hours on cards:** When a project is mapped to Harvest, today's logged hours for that Harvest project appear on the workstream card (e.g. "H: 2.5h").

**Stats bar:** The notification bar below the header shows today's metrics:
- Tasks due today (amber)
- Local time logged (green, or gray if 0)
- Harvest time logged (orange, or red if 0)
- Tasks completed today (green)`,
  },
  {
    title: 'Tmux Integration',
    content: `Command Central detects running tmux sessions and matches them to projects. Sessions are polled every 10 seconds.

**How matching works:**
- Session name is matched against the project slug and name using word-boundary matching — this prevents short slugs (e.g. "ad" for Adagio) from falsely matching unrelated strings (e.g. "admin")
- Pane working directories are checked by path segment, not substring — \`/tds/clients-adagio\` matches "adagio" but \`/tds/clients-ghostlight/packages/admin\` does not match "ad"

**Setup:** Name your tmux sessions after your projects. Use your launcher scripts:
\`\`\`
ghostlight        # Full Ghostlight dev environment
adagio            # Full Adagio dev environment
claude-session x  # Generic Claude + shell session
\`\`\`

**Open in Ghostty:** Click the green "live" badge on any card to open that tmux session in a new Ghostty window via \`ghostty -e tmux attach-session -t <name>\`.

**Start a session:** Cards without a tmux session show a "start session" button. Clicking it launches the project's development environment using your launcher scripts in \`~/.local/bin/\`. The launch order is:
1. Dedicated launcher script matching the project name (e.g. \`ghostlight\`, \`adagio\`) — sets up all windows (Claude, nvim, API servers, etc.)
2. Falls back to \`claude-session <name>\` for a basic Claude + shell setup
3. Last resort: plain \`tmux new-session\`

The card updates to "live" on the next poll cycle (within 10 seconds).

**Kill All Sessions:** The red "Kill All Sessions" button in the header runs \`tmux kill-server\` to terminate all sessions at once. A confirmation dialog prevents accidental clicks.`,
  },
  {
    title: 'Notifications',
    content: `Command Central sends browser notifications to help you stay on track. These are checked every 5 minutes:

- **Idle alert** — Triggered if no mouse or keyboard activity for 15+ minutes
- **No time logged** — Triggered if you haven't logged any time today
- **Tasks due** — Triggered if you have tasks due today

Grant notification permission when prompted by your browser. Notifications use the browser's native Notification API.

Pipeline Notifications: When a /pipeline run completes, CC sends a Slack DM (if Slack MCP configured) and a browser push notification. Blocked alerts are also sent when a pipeline step fails after 3 retries.`,
  },
  {
    title: 'Claude Code Tab',
    content: `The "Claude Code" tab shows your Claude Code configuration:

- Registered skills and their invocability, allowed tools
- MCP server configurations
- Global settings
- CLAUDE.md global instructions
- WORKFLOW.md (if present)
- Project-specific configs from \`~/tds/\`
- Keybindings

This is read-only — it reflects your current Claude Code setup for quick reference. Each section is collapsible with item counts.`,
  },
  {
    title: 'Auto-Phase Detection',
    content: `How phases auto-update from Claude Code skills.

When a Claude Code skill runs (e.g., /implement, /debug, /pr), it calls the phase reporter script which:
1. Writes a JSON state file to ~/.claude/session-state/{session}.json
2. POSTs to the CC server at /api/claude-state/report for instant updates

The CC dashboard polls these state files every 5 seconds and auto-updates the phase badge and session status on matching project cards.

State file detection takes priority over tmux pane parsing. If no state file exists, the system falls back to parsing tmux pane content for phase keywords.

Flow:
  Skill runs → report-phase.sh → state file written
       ↓                              ↓
  POST /api/claude-state/report    CC polls every 5s
       ↓                              ↓
  DB updated instantly            Dashboard updates

Phase values: analyzing, coding, reviewing, testing, blocked
Session status values: claude_working, needs_input, debugging, ready_to_commit, reviewing, idle

Phase represents the workflow stage (what step of work), while session status represents Claude's activity state (what Claude is doing right now).`,
  },
  {
    title: 'Pipeline Orchestrator',
    content: `The /pipeline skill chains together the full workflow from JIRA task to PR.

Steps:
  1. Fetch JIRA Task → get ticket details via JIRA MCP
  2. Analyze Requirements → run /task-analyzer skill
  3. Estimate (optional) → run /estimate skill
  4. Implement → delegate /implement to project tmux session
  5. Run Tests → send test command to project session
  6. Create PR → delegate /pr to project session
  7. Notify → Slack DM + browser notification

Usage: /pipeline GHOST-123 [--mode autonomous|guided] [--session ghostlight]

Modes:
- Autonomous (default): runs all steps without pausing
- Guided: pauses at each step for user confirmation

Error handling: If any step fails after 3 retries, phase is set to "blocked", a notification is sent, and the pipeline stops.

Delegation: The pipeline runs in the "command-central" tmux session and delegates work to project sessions via tmux send-keys.`,
  },
  {
    title: 'Command Central Session',
    content: `The Command Central tmux session is the orchestrator brain.

Start it by clicking "start session" on the Command Central card in the dashboard, or manually: tmux new-session -s command-central

The CC card is always pinned first in the dashboard grid with distinct indigo/purple styling. It shows:
- Active skill name and current pipeline step (e.g., "3/7: Implement")
- Target project being worked on
- Pipeline progress bar with step indicators
- Tmux session status

From the CC session, run /pipeline to orchestrate multi-step workflows across your project sessions.`,
  },
  {
    title: 'API Reference',
    content: `All endpoints are served from \`http://localhost:3001\`.

**Projects**
- \`GET /api/projects\` — List all projects (active and inactive)
- \`POST /api/projects\` — Create project (body: \`{ name, color }\`)
- \`PATCH /api/projects/:id\` — Update fields: \`name\`, \`slug\`, \`color\`, \`active\`, \`harvest_project_id\`, \`harvest_default_task_id\`, \`phase\`, \`session_status\`
- \`DELETE /api/projects/:id\` — Soft-delete (sets \`active=0\`)

**Tasks**
- \`GET /api/tasks\` — List tasks (query: \`?project_id=...\`, \`?status=...\`)
- \`POST /api/tasks\` — Create task (body: \`{ title, project_id }\`)
- \`PATCH /api/tasks/:id\` — Update task fields
- \`PATCH /api/tasks/:id/complete\` — Mark task done (sets \`completed_at\`)
- \`PATCH /api/tasks/reorder\` — Reorder by priority (body: \`{ taskIds: [...] }\`)
- \`DELETE /api/tasks/:id\` — Hard delete

**Timer**
- \`GET /api/timer\` — List recent time entries (last 50)
- \`GET /api/timer/active\` — Get active timer (or null)
- \`POST /api/timer/start\` — Start timer (body: \`{ task_id, project_id }\`)
- \`POST /api/timer/stop\` — Stop active timer (auto-syncs to Harvest if mapped)

**Jira**
- \`GET /api/jira/issues\` — Fetch assigned Jira issues
- \`POST /api/jira/sync\` — Sync Jira issues to tasks

**Harvest**
- \`GET /api/harvest/projects\` — List Harvest project assignments
- \`GET /api/harvest/today\` — Today's Harvest time entries
- \`POST /api/harvest/log\` — Log time to Harvest

**Tmux**
- \`GET /api/tmux/sessions\` — List active tmux sessions with pane details and auto-detected status
- \`POST /api/tmux/open/:session\` — Open existing session in Ghostty
- \`POST /api/tmux/launch\` — Launch a new session using launcher scripts (body: \`{ sessionName, slug }\`)
- \`POST /api/tmux/kill-all\` — Kill all tmux sessions (\`tmux kill-server\`)

**Claude Config**
- \`GET /api/claude-config\` — Returns Claude Code configuration data

Claude State API:
- \`GET /api/claude-state/sessions\` — Returns all active session state files (filtered to last 10 minutes)
- \`POST /api/claude-state/report\` — Instant phase/status update from skills

Notifications API:
- \`GET /api/notifications\` — Poll for unread notifications (marks as read)
- \`POST /api/notifications\` — Create a notification (type, title, body, project)`,
  },
];

export default function DocsDashboard() {
  const [activeSection, setActiveSection] = useState(0);

  return (
    <div className="flex flex-1 min-h-0">
      {/* Sidebar nav */}
      <nav className="w-56 shrink-0 border-r border-gray-700/50 bg-gray-800/30 overflow-y-auto">
        <div className="p-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Documentation</h2>
          {sections.map((section, i) => (
            <button
              key={i}
              onClick={() => setActiveSection(i)}
              className={`w-full text-left px-3 py-1.5 text-sm rounded-md mb-0.5 transition-colors ${
                activeSection === i
                  ? 'bg-indigo-500/20 text-indigo-300'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
              }`}
            >
              {section.title}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-8 max-w-3xl">
        <h1 className="text-2xl font-bold text-white mb-6">{sections[activeSection].title}</h1>
        <div className="prose prose-invert prose-sm max-w-none">
          {sections[activeSection].content.split('\n\n').map((block, i) => {
            if (block.startsWith('```')) {
              const code = block.replace(/```\w*\n?/, '').replace(/```$/, '');
              return (
                <pre key={i} className="bg-gray-800 border border-gray-700/50 rounded-lg p-4 text-sm text-gray-300 overflow-x-auto">
                  <code>{code}</code>
                </pre>
              );
            }
            return (
              <p key={i} className="text-gray-300 leading-relaxed mb-4">
                {renderInline(block)}
              </p>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function renderInline(text: string): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = [];
  // Handle **bold**, `code`, and plain text
  const regex = /(\*\*(.+?)\*\*|`([^`]+)`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      parts.push(<strong key={match.index} className="text-white font-semibold">{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(
        <code key={match.index} className="bg-gray-800 text-indigo-300 px-1.5 py-0.5 rounded text-xs">
          {match[3]}
        </code>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}
