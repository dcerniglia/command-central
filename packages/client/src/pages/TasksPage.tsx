import { useState } from 'react';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';
import { Inbox, CalendarDays, CalendarClock, ListChecks } from 'lucide-react';
import TaskRow from '@/components/tasks/TaskRow';
import QuickAdd from '@/components/tasks/QuickAdd';

const views = [
  { key: 'inbox' as const, label: 'Inbox', icon: Inbox },
  { key: 'today' as const, label: 'Today', icon: CalendarDays },
  { key: 'upcoming' as const, label: 'Upcoming', icon: CalendarClock },
  { key: 'all' as const, label: 'All', icon: ListChecks },
];

type ViewKey = (typeof views)[number]['key'];

export default function TasksPage() {
  const [activeView, setActiveView] = useState<ViewKey>('inbox');

  const { data: tasks = [], isLoading } = trpc.tasks.list.useQuery({ view: activeView });
  const utils = trpc.useUtils();

  const complete = trpc.tasks.complete.useMutation({
    onSuccess: () => utils.tasks.list.invalidate(),
  });

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const activeTasks = tasks.filter((t: any) => t.status === 'todo');
  const doneTasks = tasks.filter((t: any) => t.status === 'done');

  return (
    <div className="flex flex-col h-full">
      {/* Header with view tabs */}
      <div className="flex items-center justify-between px-6 h-14 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-1">
          {views.map((view) => (
            <button
              key={view.key}
              onClick={() => setActiveView(view.key)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-body transition-colors duration-150',
                activeView === view.key
                  ? 'bg-primary/15 text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface-overlay',
              )}
            >
              <view.icon className="h-4 w-4" />
              <span className="font-medium">{view.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-3">
          <QuickAdd />

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
                {activeView === 'inbox' ? 'Inbox is empty' : 'No tasks'}
              </p>
              <p className="text-caption text-muted-foreground/60 mt-1">
                {activeView === 'inbox'
                  ? 'Tasks without a list or area show up here'
                  : 'Add a task above to get started'}
              </p>
            </div>
          ) : (
            <>
              {activeTasks.length > 0 && (
                <div className="space-y-2 mt-2">
                  {activeTasks.map((task: any) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onComplete={(id) => complete.mutate({ id })}
                      onClick={(id) => setSelectedTaskId(id)}
                    />
                  ))}
                </div>
              )}

              {doneTasks.length > 0 && (
                <div className="mt-6">
                  <button
                    className="text-caption text-muted-foreground hover:text-foreground transition-colors mb-2"
                    onClick={() => {}} // TODO: toggle visibility
                  >
                    Completed ({doneTasks.length})
                  </button>
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
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
