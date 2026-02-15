import { useState, useRef, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Inbox } from 'lucide-react';
import TaskRow from '@/components/tasks/TaskRow';
import TaskDetail from '@/components/tasks/TaskDetail';
import TaskSidebar from '@/components/tasks/TaskSidebar';
import SortableTaskList from '@/components/tasks/SortableTaskList';
import QuickAdd, { type QuickAddHandle } from '@/components/tasks/QuickAdd';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

type ViewKey = 'inbox' | 'today' | 'upcoming' | 'all';
type SpecialFilter = 'noProject' | 'noArea';

export default function TasksPage() {
  const [activeView, setActiveView] = useState<ViewKey>('inbox');
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [activeAreaId, setActiveAreaId] = useState<string | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeSpecialFilter, setActiveSpecialFilter] = useState<SpecialFilter | null>(null);
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

  // Build filter based on what's selected
  const filter: Record<string, any> = {};
  if (activeSpecialFilter) {
    if (activeSpecialFilter === 'noProject') filter.noProject = true;
    if (activeSpecialFilter === 'noArea') filter.noArea = true;
  } else if (activeListId) {
    filter.listId = activeListId;
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

  function clearSelection() {
    setActiveListId(null);
    setActiveAreaId(null);
    setActiveProjectId(null);
    setActiveSpecialFilter(null);
  }

  function handleViewChange(view: ViewKey) {
    clearSelection();
    setActiveView(view);
  }

  function handleListSelect(listId: string) {
    clearSelection();
    setActiveListId(listId);
  }

  function handleAreaSelect(areaId: string) {
    clearSelection();
    setActiveAreaId(areaId);
  }

  function handleProjectSelect(projectId: string) {
    clearSelection();
    setActiveProjectId(projectId);
  }

  function handleSpecialFilter(f: SpecialFilter) {
    clearSelection();
    setActiveSpecialFilter(f);
  }

  // Determine header title
  let pageTitle = activeView.charAt(0).toUpperCase() + activeView.slice(1);
  if (activeListId || activeAreaId) {
    pageTitle = ''; // Will be set by sidebar context
  }

  return (
    <div className="flex h-full">
      <TaskSidebar
        activeView={!activeListId && !activeAreaId && !activeProjectId && !activeSpecialFilter ? activeView : null}
        activeListId={activeListId}
        activeAreaId={activeAreaId}
        activeProjectId={activeProjectId}
        activeSpecialFilter={activeSpecialFilter}
        focusAreaId={focusAreaId}
        onViewChange={handleViewChange}
        onListSelect={handleListSelect}
        onAreaSelect={handleAreaSelect}
        onProjectSelect={handleProjectSelect}
        onSpecialFilter={handleSpecialFilter}
        onFocusArea={handleFocusArea}
      />

      <div className="flex flex-col flex-1 min-w-0">
        {/* Task list */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-3">
            <QuickAdd
              ref={quickAddRef}
              focusAreaId={focusAreaId}
              projectId={activeProjectId}
              areaId={activeAreaId}
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
                  {activeView === 'inbox' && !activeListId && !activeAreaId ? 'Inbox is empty' : 'No tasks'}
                </p>
                <p className="text-caption text-muted-foreground/60 mt-1">
                  {activeView === 'inbox' && !activeListId && !activeAreaId
                    ? 'Tasks without a list or area show up here'
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
