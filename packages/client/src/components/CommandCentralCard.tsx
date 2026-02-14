import { useState } from 'react';
import { ClaudeSessionState, Project, TmuxSession, openTmuxSession, launchTmuxSession } from '../api/client';
import WebTerminal from './WebTerminal';

interface Props {
  state: ClaudeSessionState | undefined;
  tmuxSession: TmuxSession | null;
  workstreamProjects?: Project[];
  claudeStates?: ClaudeSessionState[];
}

const PIPELINE_STEPS = [
  'Fetch JIRA',
  'Analyze',
  'Estimate',
  'Implement',
  'Test',
  'Create PR',
  'Notify',
];

function getStepIndex(skill: string): number {
  const map: Record<string, number> = {
    'task-analyzer': 1,
    'estimate': 2,
    'implement': 3,
    'test': 4,
    'pr': 5,
    'notify': 6,
  };
  return map[skill] ?? 0;
}

// Workflow stages — shared with WorkstreamCard
const WORKFLOW_STAGES: Record<string, { label: string; icon: string; owner: string; color: string }> = {
  backlog:   { label: 'Backlog',   icon: '📋', owner: 'user',   color: 'bg-gray-500/20 text-gray-300 border-gray-500/30' },
  analyzing: { label: 'Analyzing', icon: '🔍', owner: 'claude', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  coding:    { label: 'Coding',    icon: '⚙',  owner: 'claude', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  testing:   { label: 'Testing',   icon: '🧪', owner: 'user',   color: 'bg-green-500/20 text-green-300 border-green-500/30' },
  reviewing: { label: 'Reviewing', icon: '👀', owner: 'user',   color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  pr:        { label: 'PR',        icon: '🚀', owner: 'claude', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  done:      { label: 'Done',      icon: '✓',  owner: 'none',   color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
};

const STALE_THRESHOLD_MS = 2 * 60 * 1000;

function resolveNextAction(
  phase: string | null | undefined,
  sessionStatus: string | null | undefined,
  timestamp: string | null | undefined,
): { label: string; isUserAction: boolean } {
  const stage = phase ? WORKFLOW_STAGES[phase] : null;
  if (!stage) return { label: 'Set workflow stage', isUserAction: true };

  if (stage.owner === 'claude') {
    const isStale = timestamp && (Date.now() - new Date(timestamp).getTime() > STALE_THRESHOLD_MS);
    const isIdle = !sessionStatus || sessionStatus === 'idle' || sessionStatus === 'needs_input';
    if (isStale || isIdle) {
      switch (phase) {
        case 'analyzing': return { label: 'Review analysis, start coding', isUserAction: true };
        case 'coding':    return { label: 'Review changes and test', isUserAction: true };
        case 'pr':        return { label: 'Review and merge PR', isUserAction: true };
        default:          return { label: 'Review and advance', isUserAction: true };
      }
    }
    return { label: `Claude is ${stage.label.toLowerCase()}...`, isUserAction: false };
  }

  switch (phase) {
    case 'backlog':   return { label: 'Pick a task to start', isUserAction: true };
    case 'testing':   return { label: 'Test locally and verify', isUserAction: true };
    case 'reviewing': return { label: 'Review the changes', isUserAction: true };
    case 'done':      return { label: 'Complete', isUserAction: false };
    default:          return { label: stage.label, isUserAction: true };
  }
}

export default function CommandCentralCard({ state, tmuxSession, workstreamProjects = [], claudeStates = [] }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'terminal'>('overview');
  const stepIdx = state?.skill ? getStepIndex(state.skill) : -1;
  const isActive = !!state?.skill;

  return (
    <div className="col-span-full rounded-xl border-2 border-indigo-500/50 bg-gray-800/90 shadow-[0_0_20px_-3px_rgba(99,102,241,0.3)] flex flex-col">
      {/* Indigo gradient header */}
      <div className="h-2 rounded-t-xl bg-gradient-to-r from-indigo-500 to-purple-500" />
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Title + tmux */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">Command Central</span>
            <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded">Hub</span>
          </div>
          {tmuxSession ? (
            <button
              onClick={() => openTmuxSession(tmuxSession.name).catch(console.error)}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 shrink-0 hover:bg-indigo-500/25 transition-colors cursor-pointer"
              title="Open command-central in Ghostty"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-xs font-medium text-indigo-400">live</span>
            </button>
          ) : (
            <button
              onClick={() => launchTmuxSession('command-central', 'command-central').catch(console.error)}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs text-gray-500 shrink-0 hover:bg-gray-700/50 hover:text-gray-300 transition-colors cursor-pointer"
              title="Start Command Central session"
            >
              <span className="w-2 h-2 rounded-full bg-gray-600" />
              <span>start session</span>
            </button>
          )}
        </div>

        {/* Pipeline status */}
        {isActive ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-indigo-300 font-medium">Pipeline:</span>
              <span className="text-white">{state?.currentTask || 'Running...'}</span>
            </div>
            {/* Step indicators */}
            <div className="flex gap-1">
              {PIPELINE_STEPS.map((step, i) => (
                <div
                  key={step}
                  className={`flex-1 flex flex-col items-center gap-1 ${
                    i < stepIdx ? 'opacity-50' : i === stepIdx ? '' : 'opacity-30'
                  }`}
                >
                  <div
                    className={`w-full h-1.5 rounded-full ${
                      i < stepIdx
                        ? 'bg-green-500'
                        : i === stepIdx
                        ? 'bg-indigo-500 animate-pulse'
                        : 'bg-gray-600'
                    }`}
                  />
                  <span className={`text-[10px] ${i === stepIdx ? 'text-indigo-300 font-medium' : 'text-gray-500'}`}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
            {state?.skill && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>Step {stepIdx + 1}/{PIPELINE_STEPS.length}:</span>
                <span className="text-indigo-300 font-medium">{state.skill}</span>
                {state.phase && (() => {
                  const stage = WORKFLOW_STAGES[state.phase];
                  return stage ? (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${stage.color}`}>
                      {stage.label}
                    </span>
                  ) : null;
                })()}
              </div>
            )}
          </div>
        ) : state ? (
          <div className="flex items-center gap-2 text-sm">
            {(() => {
              const stage = state.phase ? WORKFLOW_STAGES[state.phase] : null;
              const na = resolveNextAction(state.phase, state.sessionStatus, state.timestamp);
              return (
                <>
                  {stage && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${stage.color}`}>
                      {stage.icon} {stage.label}
                    </span>
                  )}
                  <span className={na.isUserAction ? 'text-amber-300' : 'text-gray-400'}>
                    {na.label}
                  </span>
                </>
              );
            })()}
          </div>
        ) : (
          <div className="text-sm text-gray-500 italic">
            No active session
          </div>
        )}

        {/* Project summary rows — separated into active and inactive */}
        {workstreamProjects.length > 0 && (() => {
          const allRows = workstreamProjects
            .map((p) => ({ project: p, cs: claudeStates.find((s) => s.projectSlug === p.slug) }));
          const active = allRows.filter(({ project: p }) => p.phase);
          const inactive = allRows.filter(({ project: p }) => !p.phase);

          const renderRow = ({ project: p, cs }: { project: Project; cs: ClaudeSessionState | undefined }) => {
            const stage = p.phase ? WORKFLOW_STAGES[p.phase] : null;
            const na = resolveNextAction(p.phase, cs?.sessionStatus || p.session_status, cs?.timestamp);
            return (
              <div key={p.id} className="flex items-center text-xs gap-2">
                <span className="flex items-center gap-1.5 w-24 shrink-0">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="truncate text-gray-300 font-medium uppercase">{p.slug}</span>
                </span>
                <span className="w-20 shrink-0">
                  {stage ? (
                    <span className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${stage.color}`}>
                      {stage.icon} {stage.label}
                    </span>
                  ) : (
                    <span className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium border border-gray-600/40 bg-gray-700/30 text-gray-500">
                      Set stage
                    </span>
                  )}
                </span>
                <span className={`truncate min-w-0 ${na.isUserAction ? 'text-amber-300 font-medium' : 'text-gray-500'}`}>
                  {na.isUserAction ? 'You: ' : ''}{na.label}
                </span>
              </div>
            );
          };

          return (
            <div className="pt-2 border-t border-gray-700/30 space-y-3">
              {active.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Active</span>
                  {active.map(renderRow)}
                </div>
              )}
              {inactive.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-gray-600 font-medium">Needs Stage</span>
                  {inactive.map(renderRow)}
                </div>
              )}
            </div>
          );
        })()}

        {/* Session status + expand toggle */}
        <div className="mt-auto flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-700/30">
          {tmuxSession ? (
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
              <span>Session: {tmuxSession.name}</span>
            </button>
          ) : (
            <span>No session</span>
          )}
          {state?.timestamp && (
            <span>Updated {new Date(state.timestamp).toLocaleTimeString()}</span>
          )}
        </div>
      </div>

      {/* Expanded accordion */}
      {expanded && tmuxSession && (
        <div className="border-t border-gray-700/30 bg-gray-850/50">
          <div className="flex border-b border-gray-700/30">
            {(['overview', 'terminal'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === tab
                    ? 'text-white border-b-2 border-indigo-400'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab === 'overview' ? 'Overview' : 'Terminal'}
              </button>
            ))}
          </div>
          <div className="px-4 py-3">
            {activeTab === 'terminal' ? (
              <WebTerminal sessionName={tmuxSession.name} />
            ) : (
              <div className="text-sm text-gray-400">
                {workstreamProjects.length} active workstreams
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
