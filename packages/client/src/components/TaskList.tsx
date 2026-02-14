import { useState, useRef } from 'react';
import { Task, Project } from '../api/client';

interface Props {
  tasks: Task[];
  projects: Project[];
  onComplete: (id: string) => void;
  onReorder: (taskIds: string[]) => void;
  onStartTimer: (taskId: string, projectId?: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
}

function StatusSection({
  title,
  tasks,
  projects,
  onComplete,
  onStartTimer,
  onUpdateStatus,
  dragHandlers,
  defaultCollapsed = false,
}: {
  title: string;
  tasks: Task[];
  projects: Project[];
  onComplete: (id: string) => void;
  onStartTimer: (taskId: string, projectId?: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
  dragHandlers: {
    onDragStart: (e: React.DragEvent, id: string) => void;
    onDragOver: (e: React.DragEvent, id: string) => void;
    onDragEnd: () => void;
    dragOverId: string | null;
  };
  defaultCollapsed?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  if (tasks.length === 0) return null;

  return (
    <div className="mb-6">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 hover:text-gray-300 transition-colors"
      >
        <svg
          className={`w-3 h-3 transition-transform ${collapsed ? '' : 'rotate-90'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
        {title} ({tasks.length})
      </button>

      {!collapsed && (
        <div className="space-y-1">
          {tasks.map((task) => {
            const project = projects.find((p) => p.id === task.project_id);
            const isDone = task.status === 'done';
            return (
              <div
                key={task.id}
                draggable={!isDone}
                onDragStart={(e) => dragHandlers.onDragStart(e, task.id)}
                onDragOver={(e) => dragHandlers.onDragOver(e, task.id)}
                onDragEnd={dragHandlers.onDragEnd}
                className={`group flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-3 border transition-all cursor-default ${
                  dragHandlers.dragOverId === task.id
                    ? 'border-indigo-500 bg-gray-750'
                    : 'border-gray-700/50 hover:border-gray-600'
                } ${isDone ? 'opacity-60' : ''}`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => !isDone && onComplete(task.id)}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isDone
                      ? 'bg-green-600 border-green-600'
                      : 'border-gray-500 hover:border-indigo-400'
                  }`}
                >
                  {isDone && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                {/* Title */}
                <span className={`flex-1 text-sm truncate min-w-0 ${isDone ? 'line-through text-gray-500' : 'text-gray-100'}`}>
                  {task.title}
                </span>

                {/* Right-aligned badges and controls — fixed zone */}
                <div className="flex items-center gap-2 shrink-0 ml-auto">
                  {task.due_date && (
                    <span className="text-xs text-gray-500 tabular-nums">{task.due_date.slice(0, 10)}</span>
                  )}

                  {task.jira_key ? (
                    <a
                      href={`https://thedevshop.atlassian.net/browse/${task.jira_key}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs px-1.5 py-0.5 rounded bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 transition-colors font-mono min-w-[72px] text-center"
                      title={`Open ${task.jira_key} in Jira`}
                    >
                      {task.jira_key}
                    </a>
                  ) : (
                    <span className="min-w-[72px]" />
                  )}

                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium truncate w-[130px] text-center inline-block"
                    style={project ? { backgroundColor: project.color + '22', color: project.color } : {}}
                  >
                    {project ? project.name : '\u00A0'}
                  </span>

                  {/* Hover controls — always reserve space */}
                  <div className={`flex items-center gap-1.5 w-[72px] justify-end ${isDone ? 'invisible' : ''}`}>
                    {task.status === 'todo' && (
                      <button
                        onClick={() => onUpdateStatus(task.id, 'in_progress')}
                        className="opacity-0 group-hover:opacity-100 text-xs text-indigo-400 hover:text-indigo-300 transition-opacity"
                        title="Start working"
                      >
                        Start
                      </button>
                    )}

                    <button
                      onClick={() => onStartTimer(task.id, task.project_id ?? undefined)}
                      className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-indigo-400 transition-opacity"
                      title="Start timer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>

                    <div className="opacity-0 group-hover:opacity-100 cursor-grab text-gray-600 hover:text-gray-400 transition-opacity">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function TaskList({ tasks, projects, onComplete, onReorder, onStartTimer, onUpdateStatus }: Props) {
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragItemId = useRef<string | null>(null);

  const inProgress = tasks.filter((t) => t.status === 'in_progress');
  const todo = tasks.filter((t) => t.status === 'todo');
  const done = tasks.filter((t) => t.status === 'done');

  function onDragStart(e: React.DragEvent, id: string) {
    dragItemId.current = id;
    e.dataTransfer.effectAllowed = 'move';
  }

  function onDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    if (id !== dragItemId.current) {
      setDragOverId(id);
    }
  }

  function onDragEnd() {
    if (dragItemId.current && dragOverId && dragItemId.current !== dragOverId) {
      const activeTasks = tasks.filter((t) => t.status !== 'done');
      const ids = activeTasks.map((t) => t.id);
      const fromIdx = ids.indexOf(dragItemId.current);
      const toIdx = ids.indexOf(dragOverId);
      if (fromIdx !== -1 && toIdx !== -1) {
        ids.splice(fromIdx, 1);
        ids.splice(toIdx, 0, dragItemId.current);
        onReorder(ids);
      }
    }
    dragItemId.current = null;
    setDragOverId(null);
  }

  const dragHandlers = { onDragStart, onDragOver, onDragEnd, dragOverId };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <svg className="w-16 h-16 mb-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-lg">No tasks yet</p>
        <p className="text-sm mt-1">Use the quick capture bar above to add your first task.</p>
      </div>
    );
  }

  return (
    <div>
      <StatusSection title="In Progress" tasks={inProgress} projects={projects} onComplete={onComplete} onStartTimer={onStartTimer} onUpdateStatus={onUpdateStatus} dragHandlers={dragHandlers} />
      <StatusSection title="To Do" tasks={todo} projects={projects} onComplete={onComplete} onStartTimer={onStartTimer} onUpdateStatus={onUpdateStatus} dragHandlers={dragHandlers} />
      <StatusSection title="Done" tasks={done} projects={projects} onComplete={onComplete} onStartTimer={onStartTimer} onUpdateStatus={onUpdateStatus} dragHandlers={dragHandlers} defaultCollapsed />
    </div>
  );
}
