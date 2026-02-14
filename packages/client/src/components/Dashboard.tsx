import { useState, useEffect, useCallback } from 'react';
import {
  fetchProjects,
  fetchTasks,
  createProject,
  createTask,
  completeTask,
  reorderTasks,
  updateTask,
  updateProject,
  getTimeEntries,
  getDailyStats,
  syncJira,
  fetchHarvestProjects,
  fetchHarvestToday,
  fetchTmuxSessions,
  killAllTmuxSessions,
  Project,
  Task,
  DailyStats,
  HarvestProjectAssignment,
  HarvestTimeEntry,
  TmuxSession,
  fetchClaudeStates,
  ClaudeSessionState,
  fetchNotifications,
} from '../api/client';
import { useTimer } from '../hooks/useTimer';
import { useNotifications } from '../hooks/useNotifications';
import ClaudeConfigDashboard from './ClaudeConfigDashboard';
import ProjectSidebar from './ProjectSidebar';
import QuickCapture from './QuickCapture';
import ActiveTimer from './ActiveTimer';
import NotificationBar from './NotificationBar';
import TaskList from './TaskList';
import WorkstreamCard from './WorkstreamCard';
import TaskBacklog from './TaskBacklog';
import DocsDashboard from './DocsDashboard';
import InsightsDashboard from './InsightsDashboard';
import CommandCentralCard from './CommandCentralCard';

// Match tmux sessions to projects by session name or pane cwd path segment
function matchesTmuxSession(project: Project, session: TmuxSession): boolean {
  const slug = project.slug.toLowerCase();
  const name = project.name.toLowerCase();
  const sName = session.name.toLowerCase();

  // Use word-boundary regex to avoid short slugs like "ad" matching "admin"
  const slugPattern = new RegExp(`(^|[^a-z])${slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`);
  if (slugPattern.test(sName) || sName === name || sName.includes(name)) return true;

  // Pane cwd match: check path segments, not arbitrary substrings
  return session.panes.some((p) => {
    const segments = p.currentPath.toLowerCase().split('/');
    return segments.some((seg) => slugPattern.test(seg) || seg.includes(name));
  });
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'claude' | 'docs' | 'insights'>('tasks');
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [harvestProjects, setHarvestProjects] = useState<HarvestProjectAssignment[]>([]);
  const [harvestToday, setHarvestToday] = useState<HarvestTimeEntry[]>([]);
  const [tmuxSessions, setTmuxSessions] = useState<TmuxSession[]>([]);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [manualStatusOverrides, setManualStatusOverrides] = useState<Set<string>>(new Set());
  const [claudeStates, setClaudeStates] = useState<ClaudeSessionState[]>([]);

  const timer = useTimer();

  const loadData = useCallback(async () => {
    const [p, t, entries] = await Promise.all([fetchProjects(), fetchTasks(), getTimeEntries()]);
    setProjects(p);
    setTasks(t);

    let harvestHours = 0;
    try {
      const hToday = await fetchHarvestToday();
      setHarvestToday(hToday);
      harvestHours = hToday.reduce((sum, e) => sum + e.hours, 0);
    } catch { /* Harvest not configured */ }

    setStats(getDailyStats(t, entries, harvestHours));
  }, []);

  const loadTmux = useCallback(async () => {
    try {
      const sessions = await fetchTmuxSessions();
      setTmuxSessions(sessions);

      // Auto-apply detected statuses for projects not manually overridden
      setProjects((prev) => {
        let changed = false;
        const updated = prev.map((p) => {
          if (manualStatusOverrides.has(p.id)) return p;
          const match = sessions.find((s) => matchesTmuxSession(p, s));
          if (match?.detectedStatus && match.detectedStatus !== p.session_status) {
            changed = true;
            // Fire and forget the API update
            updateProject(p.id, { session_status: match.detectedStatus } as Partial<Project>).catch(() => {});
            return { ...p, session_status: match.detectedStatus };
          }
          return p;
        });
        return changed ? updated : prev;
      });
    } catch { /* tmux not available */ }
  }, [manualStatusOverrides]);

  const loadClaudeStates = useCallback(async () => {
    try {
      const states = await fetchClaudeStates();
      setClaudeStates(states);

      // Auto-apply phase and session_status from state files
      setProjects((prev) => {
        let changed = false;
        const updated = prev.map((p) => {
          const state = states.find((s) => s.projectSlug === p.slug);
          if (!state) return p;
          const newPhase = state.phase || p.phase;
          const newStatus = state.sessionStatus || p.session_status;
          if (newPhase !== p.phase || newStatus !== p.session_status) {
            changed = true;
            // Fire and forget the API update
            if (newPhase !== p.phase) updateProject(p.id, { phase: newPhase } as Partial<Project>).catch(() => {});
            if (newStatus !== p.session_status && !manualStatusOverrides.has(p.id)) {
              updateProject(p.id, { session_status: newStatus } as Partial<Project>).catch(() => {});
            }
            return { ...p, phase: newPhase, session_status: manualStatusOverrides.has(p.id) ? p.session_status : newStatus };
          }
          return p;
        });
        return changed ? updated : prev;
      });
    } catch { /* state polling failed */ }
  }, [manualStatusOverrides]);

  useEffect(() => {
    loadData();
    loadTmux();
    loadClaudeStates();
    fetchHarvestProjects().then(setHarvestProjects).catch(() => {});
  }, [loadData, loadTmux, loadClaudeStates]);

  // Refresh stats every 30s
  useEffect(() => {
    const id = setInterval(async () => {
      const [t, entries] = await Promise.all([fetchTasks(), getTimeEntries()]);
      setTasks(t);
      let harvestHours = 0;
      try {
        const hToday = await fetchHarvestToday();
        setHarvestToday(hToday);
        harvestHours = hToday.reduce((sum, e) => sum + e.hours, 0);
      } catch {}
      setStats(getDailyStats(t, entries, harvestHours));
    }, 30000);
    return () => clearInterval(id);
  }, []);

  // Poll tmux every 10s
  useEffect(() => {
    const id = setInterval(loadTmux, 10000);
    return () => clearInterval(id);
  }, [loadTmux]);

  // Poll claude states every 5s
  useEffect(() => {
    const id = setInterval(loadClaudeStates, 5000);
    return () => clearInterval(id);
  }, [loadClaudeStates]);

  // Poll notifications every 10s and trigger browser notifications
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const notifs = await fetchNotifications();
        for (const n of notifs) {
          if (Notification.permission === 'granted') {
            new Notification(n.title, { body: n.body, icon: '/favicon.ico' });
          }
        }
      } catch {}
    }, 10000);
    return () => clearInterval(id);
  }, []);

  const getStats = useCallback(() => stats, [stats]);
  useNotifications(getStats);

  async function handleAddTask(title: string, projectId?: string) {
    await createTask(title, projectId);
    loadData();
  }

  async function handleAddProject(name: string, color: string) {
    await createProject(name, color);
    loadData();
  }

  async function handleComplete(id: string) {
    await completeTask(id);
    loadData();
  }

  async function handleReorder(taskIds: string[]) {
    await reorderTasks(taskIds);
    loadData();
  }

  async function handleStartTimer(taskId: string, projectId?: string) {
    if (timer.activeTimer) {
      await timer.stop();
    }
    await timer.start(taskId, projectId);
  }

  async function handleStopTimer() {
    await timer.stop();
    loadData();
  }

  async function handleUpdateStatus(id: string, status: string) {
    await updateTask(id, { status } as Partial<Task>);
    loadData();
  }

  async function handleSyncJira() {
    setSyncing(true);
    try {
      await syncJira();
      await loadData();
    } catch (e) {
      console.error('Jira sync failed:', e);
    } finally {
      setSyncing(false);
    }
  }

  async function handleKillAll() {
    if (!confirm('Kill all tmux sessions? This will stop all running dev environments.')) return;
    await killAllTmuxSessions();
    setTmuxSessions([]);
    loadTmux();
  }

  async function handleMapHarvest(projectId: string, harvestProjectId: string, harvestTaskId: string) {
    await updateProject(projectId, {
      harvest_project_id: harvestProjectId,
      harvest_default_task_id: harvestTaskId,
    } as Partial<Project>);
    loadData();
  }

  async function handlePhaseChange(projectId: string, phase: string | null) {
    await updateProject(projectId, { phase } as Partial<Project>);
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, phase } : p))
    );
  }

  async function handleSessionStatusChange(projectId: string, session_status: string | null) {
    await updateProject(projectId, { session_status } as Partial<Project>);
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, session_status } : p))
    );
    // Manual set = override auto-detection; clearing = resume auto-detection
    setManualStatusOverrides((prev) => {
      const next = new Set(prev);
      if (session_status) {
        next.add(projectId);
      } else {
        next.delete(projectId);
      }
      return next;
    });
  }

  function getTmuxForProject(project: Project): TmuxSession | null {
    return tmuxSessions.find((s) => matchesTmuxSession(project, s)) ?? null;
  }

  const activeProjects = projects.filter((p) => p.active);
  const ccProject = activeProjects.find((p) => p.is_hub === 1);
  const nonHubProjects = activeProjects.filter((p) => p.is_hub !== 1);
  const ccState = claudeStates.find((s) => s.projectSlug === 'command-central');
  // Projects that have tasks, a tmux session, or an active timer
  const workstreamProjects = nonHubProjects
    .filter((p) => {
      const hasTasks = tasks.some((t) => t.project_id === p.id && t.status !== 'done');
      const hasTmux = getTmuxForProject(p) !== null;
      const hasTimer = timer.activeTimer?.project_id === p.id;
      return hasTasks || hasTmux || hasTimer;
    })
    .sort((a, b) => {
      const aTmux = getTmuxForProject(a) !== null ? 1 : 0;
      const bTmux = getTmuxForProject(b) !== null ? 1 : 0;
      return bTmux - aTmux;
    });

  const activeProjectIds = new Set(workstreamProjects.map((p) => p.id));

  const filteredTasks = selectedProjectId
    ? tasks.filter((t) => t.project_id === selectedProjectId)
    : tasks;

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
      <nav className="flex items-center border-b border-gray-700 bg-gray-900 shrink-0">
        <div className="flex flex-1">
          {(['tasks', 'claude', 'docs', 'insights'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-white border-b-2 border-indigo-500'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab === 'tasks' ? 'Tasks' : tab === 'claude' ? 'Claude Code' : tab === 'docs' ? 'Docs' : 'Insights'}
            </button>
          ))}
        </div>
        {activeTab === 'tasks' && (
          <div className="flex items-center gap-2 pr-4">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded text-xs ${viewMode === 'cards' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'}`}
              title="Card view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded text-xs ${viewMode === 'list' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'}`}
              title="List view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        )}
      </nav>

      {activeTab === 'claude' ? (
        <ClaudeConfigDashboard />
      ) : activeTab === 'docs' ? (
        <DocsDashboard />
      ) : activeTab === 'insights' ? (
        <InsightsDashboard />
      ) : viewMode === 'list' ? (
        /* Classic list view */
        <div className="flex flex-1 min-h-0">
          <ProjectSidebar
            projects={projects}
            tasks={tasks}
            selectedProjectId={selectedProjectId}
            onSelect={setSelectedProjectId}
            onAddProject={handleAddProject}
            harvestProjects={harvestProjects}
            onMapHarvest={handleMapHarvest}
          />

          <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <header className="flex items-center gap-3 p-4 border-b border-gray-700/50">
              <div className="flex-1">
                <QuickCapture projects={projects} onAdd={handleAddTask} />
              </div>
              <button
                onClick={handleSyncJira}
                disabled={syncing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600/20 text-blue-300 rounded-md hover:bg-blue-600/30 transition-colors disabled:opacity-50"
                title="Pull assigned Jira issues"
              >
                <svg className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {syncing ? 'Syncing...' : 'Sync Jira'}
              </button>
              <ActiveTimer
                activeTimer={timer.activeTimer}
                elapsedSeconds={timer.elapsedSeconds}
                tasks={tasks}
                onStop={handleStopTimer}
              />
            </header>

            <div className="px-4 pt-3">
              <NotificationBar stats={stats} harvestToday={harvestToday} />
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <TaskList
                tasks={filteredTasks}
                projects={projects}
                onComplete={handleComplete}
                onReorder={handleReorder}
                onStartTimer={handleStartTimer}
                onUpdateStatus={handleUpdateStatus}
              />
            </div>
          </main>
        </div>
      ) : (
        /* Card view (new default) */
        <div className="flex-1 overflow-y-auto">
          {/* Header bar */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-700/50">
            <div className="flex-1">
              <QuickCapture projects={projects} onAdd={handleAddTask} />
            </div>
            <button
              onClick={handleSyncJira}
              disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600/20 text-blue-300 rounded-md hover:bg-blue-600/30 transition-colors disabled:opacity-50"
              title="Pull assigned Jira issues"
            >
              <svg className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {syncing ? 'Syncing...' : 'Sync Jira'}
            </button>
            {tmuxSessions.length > 0 && (
              <button
                onClick={handleKillAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-600/20 text-red-300 rounded-md hover:bg-red-600/30 transition-colors"
                title="Kill all tmux sessions"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Kill All Sessions
              </button>
            )}
            <ActiveTimer
              activeTimer={timer.activeTimer}
              elapsedSeconds={timer.elapsedSeconds}
              tasks={tasks}
              onStop={handleStopTimer}
            />
          </div>

          <div className="p-4 space-y-4">
            <NotificationBar stats={stats} harvestToday={harvestToday} />

            {/* Command Central card + Workstream cards grid */}
            {(ccProject || workstreamProjects.length > 0) ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {ccProject && (
                  <CommandCentralCard
                    state={ccState}
                    tmuxSession={getTmuxForProject(ccProject)}
                    workstreamProjects={workstreamProjects}
                    claudeStates={claudeStates}
                  />
                )}
                {workstreamProjects.map((project) => (
                  <WorkstreamCard
                    key={project.id}
                    project={project}
                    tasks={tasks}
                    projects={projects}
                    tmuxSession={getTmuxForProject(project)}
                    activeTimerProjectId={timer.activeTimer?.project_id ?? null}
                    elapsedSeconds={timer.elapsedSeconds}
                    harvestEntries={harvestToday}
                    onPhaseChange={handlePhaseChange}
                    onSessionStatusChange={handleSessionStatusChange}
                    onComplete={handleComplete}
                    onReorder={handleReorder}
                    onStartTimer={handleStartTimer}
                    onUpdateStatus={handleUpdateStatus}
                    isAutoDetected={!manualStatusOverrides.has(project.id)}
                    claudeStateTimestamp={claudeStates.find((s) => s.projectSlug === project.slug)?.timestamp ?? null}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                No active workstreams. Create a project and add tasks to get started.
              </div>
            )}

            {/* Backlog (unassigned / inactive project tasks) */}
            <TaskBacklog
              tasks={tasks}
              projects={projects}
              activeProjectIds={activeProjectIds}
              onComplete={handleComplete}
              onUpdateStatus={handleUpdateStatus}
            />
          </div>
        </div>
      )}
    </div>
  );
}
