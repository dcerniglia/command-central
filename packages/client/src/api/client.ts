export interface Project {
  id: string;
  name: string;
  slug: string;
  color: string;
  active: number;
  harvest_project_id: string | null;
  harvest_default_task_id: string | null;
  phase: string | null;
  session_status: string | null;
  is_hub: number;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: number;
  project_id: string | null;
  due_date: string | null;
  completed_at: string | null;
  source: string | null;
  jira_key: string | null;
  created_at: string;
}

export interface TimeEntry {
  id: string;
  task_id: string | null;
  project_id: string | null;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  note: string | null;
  synced_to_harvest: number;
  harvest_entry_id: string | null;
  created_at: string;
}

export interface JiraIssue {
  key: string;
  summary: string;
  status: string;
  statusCategory: string;
  priority: string;
  projectKey: string;
  projectName: string;
  updated: string;
  assignee: string | null;
}

export interface HarvestProjectAssignment {
  project: {
    id: number;
    name: string;
    code: string;
    is_active: boolean;
    client: { id: number; name: string } | null;
  };
  taskAssignments: Array<{
    id: number;
    task: { id: number; name: string };
    is_active: boolean;
  }>;
}

export interface HarvestTimeEntry {
  id: number;
  hours: number;
  notes: string | null;
  spent_date: string;
  is_running: boolean;
  project: { id: number; name: string };
  task: { id: number; name: string };
  user: { id: number; name: string };
}

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? res.statusText);
  }
  return res.json();
}

// Projects
export function fetchProjects(): Promise<Project[]> {
  return json('/api/projects');
}

export function createProject(name: string, color: string): Promise<Project> {
  return json('/api/projects', {
    method: 'POST',
    body: JSON.stringify({ name, color }),
  });
}

export function updateProject(id: string, fields: Partial<Project>): Promise<Project> {
  return json(`/api/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(fields),
  });
}

// Tasks
export function fetchTasks(projectId?: string): Promise<Task[]> {
  const params = projectId ? `?project_id=${projectId}` : '';
  return json(`/api/tasks${params}`);
}

export function createTask(title: string, projectId?: string): Promise<Task> {
  return json('/api/tasks', {
    method: 'POST',
    body: JSON.stringify({ title, project_id: projectId || null }),
  });
}

export function updateTask(id: string, fields: Partial<Task>): Promise<Task> {
  return json(`/api/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(fields),
  });
}

export function completeTask(id: string): Promise<Task> {
  return json(`/api/tasks/${id}/complete`, { method: 'PATCH' });
}

export function reorderTasks(taskIds: string[]): Promise<{ success: boolean }> {
  return json('/api/tasks/reorder', {
    method: 'PATCH',
    body: JSON.stringify({ taskIds }),
  });
}

// Timer
export function startTimer(taskId?: string, projectId?: string): Promise<TimeEntry> {
  return json('/api/timer/start', {
    method: 'POST',
    body: JSON.stringify({ task_id: taskId || null, project_id: projectId || null }),
  });
}

export function stopTimer(): Promise<TimeEntry> {
  return json('/api/timer/stop', { method: 'POST' });
}

export function getActiveTimer(): Promise<TimeEntry | null> {
  return json('/api/timer/active');
}

export function getTimeEntries(): Promise<TimeEntry[]> {
  return json('/api/timer');
}

// Jira
export function fetchJiraIssues(): Promise<JiraIssue[]> {
  return json('/api/jira/issues');
}

export function syncJira(): Promise<{ synced: number; created: number; updated: number }> {
  return json('/api/jira/sync', { method: 'POST' });
}

// Harvest
export function fetchHarvestProjects(): Promise<HarvestProjectAssignment[]> {
  return json('/api/harvest/projects');
}

export function fetchHarvestToday(): Promise<HarvestTimeEntry[]> {
  return json('/api/harvest/today');
}

export function logToHarvest(data: { project_id: number; task_id: number; spent_date: string; hours: number; notes?: string }): Promise<HarvestTimeEntry> {
  return json('/api/harvest/log', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Tmux
export interface TmuxPane {
  sessionName: string;
  windowName: string;
  currentCommand: string;
  currentPath: string;
}

export interface TmuxSession {
  name: string;
  created: number;
  windows: number;
  attached: boolean;
  panes: TmuxPane[];
  detectedStatus: string | null;
}

export function fetchTmuxSessions(): Promise<TmuxSession[]> {
  return json('/api/tmux/sessions');
}

export function openTmuxSession(sessionName: string): Promise<{ success: boolean }> {
  return json(`/api/tmux/open/${encodeURIComponent(sessionName)}`, { method: 'POST' });
}

export function killTmuxSession(sessionName: string): Promise<{ success: boolean }> {
  return json(`/api/tmux/sessions/${encodeURIComponent(sessionName)}`, { method: 'DELETE' });
}

export function killAllTmuxSessions(): Promise<{ success: boolean; killed: number }> {
  return json('/api/tmux/kill-all', { method: 'POST' });
}

export function launchTmuxSession(sessionName: string, slug?: string): Promise<{ success: boolean; session: string; method: string }> {
  return json('/api/tmux/launch', {
    method: 'POST',
    body: JSON.stringify({ sessionName, slug }),
  });
}

// Insights
export interface InsightsData {
  lastGenerated: string | null;
  html: string | null;
}

export function fetchInsights(): Promise<InsightsData> {
  return json('/api/insights');
}

export function refreshInsights(): Promise<InsightsData> {
  return json('/api/insights/refresh', { method: 'POST' });
}

// Claude Session State
export interface ClaudeSessionState {
  sessionName: string;
  phase: string;
  sessionStatus: string;
  skill: string;
  currentTask: string;
  timestamp: string;
  projectSlug: string;
}

export interface CCNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  project?: string;
  timestamp: string;
}

export function fetchClaudeStates(): Promise<ClaudeSessionState[]> {
  return json('/api/claude-state/sessions');
}

export function postNotification(data: { type: string; title: string; body: string; project?: string }): Promise<CCNotification> {
  return json('/api/notifications', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function fetchNotifications(): Promise<CCNotification[]> {
  return json('/api/notifications');
}

// Stats
export interface DailyStats {
  minutesLogged: number;
  harvestHoursToday: number;
  tasksDueToday: number;
  tasksCompletedToday: number;
}

export function getDailyStats(tasks: Task[], entries: TimeEntry[], harvestHours: number): DailyStats {
  const today = new Date().toISOString().slice(0, 10);
  const minutesLogged = entries
    .filter((e) => e.started_at.slice(0, 10) === today && e.duration_minutes != null)
    .reduce((sum, e) => sum + (e.duration_minutes ?? 0), 0);
  const tasksDueToday = tasks.filter((t) => t.due_date?.slice(0, 10) === today && t.status !== 'done').length;
  const tasksCompletedToday = tasks.filter((t) => t.completed_at?.slice(0, 10) === today).length;
  return { minutesLogged, harvestHoursToday: harvestHours, tasksDueToday, tasksCompletedToday };
}
