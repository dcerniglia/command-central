import { useState } from 'react';
import { Task, Project } from '../api/client';

interface Props {
  tasks: Task[];
  projects: Project[];
  activeProjectIds: Set<string>;
  onComplete: (id: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
}

export default function TaskBacklog({ tasks, projects, activeProjectIds, onComplete, onUpdateStatus }: Props) {
  const [expanded, setExpanded] = useState(false);

  // Backlog = tasks not in active projects, or unassigned tasks
  const backlogTasks = tasks.filter(
    (t) => t.status !== 'done' && (!t.project_id || !activeProjectIds.has(t.project_id))
  );

  if (backlogTasks.length === 0) return null;

  const projectMap = new Map(projects.map((p) => [p.id, p]));

  return (
    <div className="mt-6 border border-gray-700/50 rounded-xl bg-gray-800/50 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-300 hover:text-white transition-colors"
      >
        <span>Task Backlog ({backlogTasks.length})</span>
        <svg
          className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-gray-700/50 divide-y divide-gray-700/30">
          {backlogTasks.map((task) => {
            const project = task.project_id ? projectMap.get(task.project_id) : null;
            return (
              <div key={task.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <button
                  onClick={() => onComplete(task.id)}
                  className="w-4 h-4 rounded border border-gray-600 hover:border-green-400 shrink-0 transition-colors"
                  title="Complete"
                />
                <span className="text-gray-200 truncate flex-1">{task.title}</span>
                {task.jira_key && (
                  <span className="text-xs font-mono text-blue-400">{task.jira_key}</span>
                )}
                {project && (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: project.color }}
                    title={project.name}
                  />
                )}
                {task.status === 'todo' && (
                  <button
                    onClick={() => onUpdateStatus(task.id, 'in_progress')}
                    className="text-xs text-indigo-400 hover:text-indigo-300"
                  >
                    Start
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
