import { useState, useRef, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Inbox } from 'lucide-react';
import TaskRow from '@/components/tasks/TaskRow';
import TaskDetail from '@/components/tasks/TaskDetail';
import ProjectHeader from '@/components/tasks/ProjectHeader';
import TaskSidebar from '@/components/tasks/TaskSidebar';
import SortableTaskList from '@/components/tasks/SortableTaskList';
import QuickAdd, { type QuickAddHandle } from '@/components/tasks/QuickAdd';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

type ViewKey = 'inbox' | 'today' | 'upcoming' | 'all';

export default function TasksPage() {
  const [activeView, setActiveView] = useState<ViewKey>('inbox');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeAreaId, setActiveAreaId] = useState<string | null>(null);
  const [noProjectFilter, setNoProjectFilter] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [focusAreaId, setFocusAreaId] = useState<string | null>(
    () => localStorage.getItem('cc-focus-area-id') || null,
  );
  const quickAddRef = useRef<QuickAddHandle>(null);

  function handleFocusArea(areaId: string | null) {
    setFocusAreaId(areaId);
    if (areaId) {
      localStorage.setItem('cc-focus-area-id', areaId);
    } else {
      localStorage.removeItem('cc-focus-area-id');
    }
  }

  useKeyboardShortcuts(useMemo(() => ({
    'n': () => quickAddRef.current?.focus(),
    'Escape': () => setSelectedTaskId(null),
  }), []));

  function clearSelection() {
    setActiveProjectId(null);
    setActiveAreaId(null);
    setNoProjectFilter(false);
  }

  // Build filter based on what's selected
  const filter: Record<string, any> = {};
  if (noProjectFilter) {
    filter.noProject = true;
  } else if (activeProjectId) {
    filter.projectId = activeProjectId;
  } else if (activeAreaId) {
    filter.areaId = activeAreaId;
  } else {
    filter.view = activeView;
  }
  if (focusAreaId) {
    filter.focusAreaId = focusAreaId;
  }

  const { data: tasks = [], isLoading } = trpc.tasks.list.useQuery(filter);
  const utils = trpc.useUtils();

  const complete = trpc.tasks.complete.useMutation({
    onSuccess: () => utils.tasks.list.invalidate(),
  });

  const reorder = trpc.tasks.reorder.useMutation({
    onSuccess: () => utils.tasks.list.invalidate(),
  });

  const activeTasks = tasks.filter((t: any) => !['done', 'cancelled'].includes(t.status));
  const doneTasks = tasks.filter((t: any) => t.status === 'done');

  function handleViewChange(view: ViewKey) {
    clearSelection();
    setActiveView(view);
  }

  function handleProjectSelect(projectId: string) {
    clearSelection();
    setActiveProjectId(projectId);
  }

  function handleAreaSelect(areaId: string) {
    clearSelection();
    setActiveAreaId(areaId);
  }

  function handleNoProjectFilter() {
    clearSelection();
    setNoProjectFilter(true);
  }

  return (
    <div className="flex h-full">
      <TaskSidebar
        activeView={!activeProjectId && !activeAreaId && !noProjectFilter ? activeView : null}
        activeProjectId={activeProjectId}
        activeAreaId={activeAreaId}
        noProjectFilter={noProjectFilter}
        focusAreaId={focusAreaId}
        onViewChange={handleViewChange}
        onProjectSelect={handleProjectSelect}
        onAreaSelect={handleAreaSelect}
        onNoProjectFilter={handleNoProjectFilter}
        onFocusArea={handleFocusArea}
      />

      <div className="flex flex-col flex-1 min-w-0">
        {/* Task list */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-3">
            {activeProjectId && (
              <ProjectHeader
                projectId={activeProjectId}
                onDeleted={() => { setActiveProjectId(null); setActiveView('inbox'); }}
              />
            )}
            <QuickAdd
              ref={quickAddRef}
              focusAreaId={focusAreaId}
              projectId={activeProjectId}
            />

            {isLoading ? (
              <div className="space-y-3 mt-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 rounded-lg bg-surface-raised animate-pulse" />
                ))}
              </div>
            ) : activeTasks.length === 0 && doneTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Inbox className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-body-medium text-muted-foreground">
                  {activeView === 'inbox' && !activeProjectId && !activeAreaId ? 'Inbox is empty' : 'No tasks'}
                </p>
                <p className="text-caption text-muted-foreground/60 mt-1">
                  {activeView === 'inbox' && !activeProjectId && !activeAreaId
                    ? 'Tasks without a project show up here'
                    : 'Add a task above to get started'}
                </p>
              </div>
            ) : (
              <>
                {activeTasks.length > 0 && (
                  <div className="mt-2">
                    <SortableTaskList
                      tasks={activeTasks}
                      onComplete={(id) => complete.mutate({ id })}
                      onClick={(id) => setSelectedTaskId(id)}
                      onReorder={(items) => reorder.mutate({ items })}
                    />
                  </div>
                )}

                {doneTasks.length > 0 && (
                  <div className="mt-6">
                    <button
                      className="text-caption text-muted-foreground hover:text-foreground transition-colors mb-2"
                      onClick={() => setShowCompleted(!showCompleted)}
                    >
                      {showCompleted ? '▾' : '▸'} Completed ({doneTasks.length})
                    </button>
                    {showCompleted && (
                      <div className="space-y-2">
                        {doneTasks.map((task: any) => (
                          <TaskRow
                            key={task.id}
                            task={task}
                            onComplete={(id) => complete.mutate({ id })}
                            onClick={(id) => setSelectedTaskId(id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {selectedTaskId && (
        <TaskDetail taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />
      )}
    </div>
  );
}
