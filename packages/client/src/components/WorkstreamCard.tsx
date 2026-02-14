import { useState, useRef, useEffect } from 'react';
import { Project, Task, HarvestTimeEntry, TmuxSession, openTmuxSession, launchTmuxSession, killTmuxSession } from '../api/client';
import TaskList from './TaskList';
import WebTerminal from './WebTerminal';

// Workflow stages in order — each has a label, who owns it, and what the user's next action is
const WORKFLOW_STAGES = [
  { value: 'backlog',   label: 'Backlog',   icon: '📋', owner: 'user',   nextAction: 'Pick a task to start',     color: 'bg-gray-500/20 text-gray-300 border-gray-500/40' },
  { value: 'analyzing', label: 'Analyzing', icon: '🔍', owner: 'claude', nextAction: 'Claude is analyzing...',   color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  { value: 'coding',    label: 'Coding',    icon: '⚙',  owner: 'claude', nextAction: 'Claude is coding...',      color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  { value: 'testing',   label: 'Testing',   icon: '🧪', owner: 'user',   nextAction: 'Test locally and verify',  color: 'bg-green-500/20 text-green-300 border-green-500/40' },
  { value: 'reviewing', label: 'Reviewing', icon: '👀', owner: 'user',   nextAction: 'Review the changes',       color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
  { value: 'pr',        label: 'PR',        icon: '🚀', owner: 'claude', nextAction: 'Claude is creating PR...', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
  { value: 'done',      label: 'Done',      icon: '✓',  owner: 'none',   nextAction: 'Complete',                 color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
] as const;

const STAGE_VALUES = WORKFLOW_STAGES.map((s) => s.value);

const STALE_THRESHOLD_MS = 2 * 60 * 1000;

/** Resolve the effective status: if Claude owns the stage but state is stale, user needs to act */
function resolveNextAction(
  phase: string | null | undefined,
  sessionStatus: string | null | undefined,
  timestamp: string | null | undefined,
): { label: string; isUserAction: boolean } {
  const stage = WORKFLOW_STAGES.find((s) => s.value === phase);
  if (!stage) return { label: 'Set workflow stage', isUserAction: true };

  // If Claude owns this stage, check staleness
  if (stage.owner === 'claude') {
    const isStale = timestamp && (Date.now() - new Date(timestamp).getTime() > STALE_THRESHOLD_MS);
    const isIdle = !sessionStatus || sessionStatus === 'idle' || sessionStatus === 'needs_input';
    if (isStale || isIdle) {
      // Claude finished — user needs to advance
      switch (stage.value) {
        case 'analyzing': return { label: 'Review analysis, then start coding', isUserAction: true };
        case 'coding':    return { label: 'Review changes and test', isUserAction: true };
        case 'pr':        return { label: 'Review and merge PR', isUserAction: true };
        default:          return { label: 'Review and advance', isUserAction: true };
      }
    }
    return { label: stage.nextAction, isUserAction: false };
  }

  return { label: stage.nextAction, isUserAction: true };
}

interface Props {
  project: Project;
  tasks: Task[];
  projects: Project[];
  tmuxSession: TmuxSession | null;
  activeTimerProjectId: string | null;
  elapsedSeconds: number;
  harvestEntries: HarvestTimeEntry[];
  onPhaseChange: (projectId: string, phase: string | null) => void;
  onSessionStatusChange: (projectId: string, status: string | null) => void;
  onComplete: (id: string) => void;
  onReorder: (taskIds: string[]) => void;
  onStartTimer: (taskId: string, projectId?: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
  isAutoDetected: boolean;
  claudeStateTimestamp?: string | null;
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}


export default function WorkstreamCard({
  project,
  tasks,
  projects,
  tmuxSession,
  activeTimerProjectId,
  elapsedSeconds,
  harvestEntries,
  onPhaseChange,
  onSessionStatusChange,
  onComplete,
  onReorder,
  onStartTimer,
  onUpdateStatus,
  isAutoDetected,
  claudeStateTimestamp,
}: Props) {
  const [stageOpen, setStageOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [killing, setKilling] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'terminal'>('tasks');

  // Reset killing state once the session is actually gone
  useEffect(() => {
    if (killing && !tmuxSession) setKilling(false);
  }, [killing, tmuxSession]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const projectTasks = tasks.filter((t) => t.project_id === project.id);
  const inProgress = projectTasks.find((t) => t.status === 'in_progress');
  const todoCount = projectTasks.filter((t) => t.status === 'todo').length;
  const doneCount = projectTasks.filter((t) => t.status === 'done').length;
  const isTimerActive = activeTimerProjectId === project.id;
  const harvestHours = harvestEntries
    .filter((e) => e.project.id === Number(project.harvest_project_id))
    .reduce((sum, e) => sum + e.hours, 0);

  const currentStage = WORKFLOW_STAGES.find((s) => s.value === project.phase);
  const nextAction = resolveNextAction(project.phase, project.session_status, claudeStateTimestamp);

  // Close dropdown on outside click
  useEffect(() => {
    if (!stageOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setStageOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [stageOpen]);

  return (
    <div className={`rounded-xl border flex flex-col transition-colors ${
      tmuxSession
        ? 'border-green-500/40 bg-gray-800/90 shadow-[0_0_15px_-3px_rgba(34,197,94,0.15)]'
        : 'border-gray-700/50 bg-gray-800/80'
    }`}>
      {/* Color header */}
      <div
        className="h-2 rounded-t-xl"
        style={{ backgroundColor: project.color }}
      />
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Project name + tmux */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white truncate">{project.name}</h3>
          {tmuxSession ? (
            killing ? (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 shrink-0">
                <svg className="w-3 h-3 text-red-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-xs font-medium text-red-400">stopping...</span>
              </span>
            ) : (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openTmuxSession(tmuxSession.name).catch(console.error);
                  }}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/30 hover:bg-green-500/25 transition-colors cursor-pointer"
                  title={`Open ${tmuxSession.name} in Ghostty`}
                >
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs font-medium text-green-400">live</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setKilling(true);
                    killTmuxSession(tmuxSession.name)
                      .catch(() => setKilling(false));
                  }}
                  className="flex items-center px-1.5 py-0.5 rounded-full text-gray-500 hover:bg-red-500/15 hover:text-red-400 transition-colors cursor-pointer"
                  title={`Kill ${tmuxSession.name} session`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                launchTmuxSession(project.name.toLowerCase(), project.slug).catch(console.error);
              }}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs text-gray-500 shrink-0 hover:bg-gray-700/50 hover:text-gray-300 transition-colors cursor-pointer"
              title={`Start new tmux session for ${project.name}`}
            >
              <span className="w-2 h-2 rounded-full bg-gray-600" />
              <span>start session</span>
            </button>
          )}
        </div>

        {/* Workflow stage selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setStageOpen(!stageOpen)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
              currentStage
                ? currentStage.color
                : 'bg-gray-700/30 text-gray-400 border-gray-600/50 hover:bg-gray-700/50'
            }`}
          >
            <span>{currentStage?.icon ?? '○'}</span>
            <span className="flex-1 text-left">{currentStage?.label ?? 'Set stage...'}</span>
            {/* Stage progress dots */}
            <span className="flex gap-0.5">
              {WORKFLOW_STAGES.filter((s) => s.value !== 'done').map((s) => {
                const idx = STAGE_VALUES.indexOf(s.value);
                const currentIdx = currentStage ? STAGE_VALUES.indexOf(currentStage.value) : -1;
                return (
                  <span
                    key={s.value}
                    className={`w-1.5 h-1.5 rounded-full ${
                      idx < currentIdx ? 'bg-green-400' :
                      idx === currentIdx ? 'bg-white' :
                      'bg-gray-600'
                    }`}
                  />
                );
              })}
            </span>
            <svg className={`w-3.5 h-3.5 transition-transform ${stageOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {stageOpen && (
            <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg shadow-xl overflow-hidden">
              {WORKFLOW_STAGES.map((stage) => (
                <button
                  key={stage.value}
                  onClick={() => {
                    onPhaseChange(project.id, project.phase === stage.value ? null : stage.value);
                    setStageOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-gray-700/50 ${
                    project.phase === stage.value ? 'bg-gray-700/30' : ''
                  }`}
                >
                  <span>{stage.icon}</span>
                  <span className="text-gray-200">{stage.label}</span>
                  <span className="ml-auto text-[10px] text-gray-500">{stage.owner === 'claude' ? 'Claude' : stage.owner === 'user' ? 'You' : ''}</span>
                  {project.phase === stage.value && (
                    <span className="text-xs text-green-400">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Next action — what you need to do */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
          nextAction.isUserAction
            ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
            : 'text-gray-400'
        }`}>
          {nextAction.isUserAction ? (
            <span className="text-amber-400 text-xs font-bold uppercase tracking-wider shrink-0">You:</span>
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shrink-0" />
          )}
          <span className="truncate">{nextAction.label}</span>
        </div>

        {/* Current task */}
        {inProgress ? (
          <div className="bg-gray-700/40 rounded-lg p-2.5">
            {inProgress.jira_key && (
              <a
                href={`https://jira.atlassian.net/browse/${inProgress.jira_key}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-blue-400 hover:underline"
              >
                {inProgress.jira_key}
              </a>
            )}
            <p className="text-sm text-gray-200 truncate">{inProgress.title}</p>
          </div>
        ) : (
          <div className="text-xs text-gray-500 italic">No active task</div>
        )}

        {/* Timer */}
        {isTimerActive && (
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-lg font-mono font-bold text-green-400">
              {formatElapsed(elapsedSeconds)}
            </span>
          </div>
        )}

        {/* Bottom row: counts + harvest + expand toggle */}
        <div className="mt-auto flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-700/30">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 hover:text-gray-200 transition-colors cursor-pointer"
          >
            <svg
              className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span>{todoCount} todo</span>
            <span className={doneCount > 0 ? 'text-green-400' : ''}>{doneCount} done</span>
          </button>
          {project.harvest_project_id && (
            <span className="text-orange-400">
              H: {harvestHours.toFixed(1)}h
            </span>
          )}
        </div>
      </div>

      {/* Expanded accordion */}
      {expanded && (
        <div className="border-t border-gray-700/30 bg-gray-850/50">
          {tmuxSession && (
            <div className="flex border-b border-gray-700/30">
              {(['tasks', 'terminal'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === tab
                      ? 'text-white border-b-2 border-blue-400'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {tab === 'tasks' ? 'Tasks' : 'Terminal'}
                </button>
              ))}
            </div>
          )}
          <div className="px-4 py-3">
            {activeTab === 'tasks' || !tmuxSession ? (
              <TaskList
                tasks={projectTasks}
                projects={projects}
                onComplete={onComplete}
                onReorder={onReorder}
                onStartTimer={onStartTimer}
                onUpdateStatus={onUpdateStatus}
              />
            ) : (
              <WebTerminal sessionName={tmuxSession.name} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
