import { Zap, AlertCircle, CalendarDays, Inbox, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';
import { useNavigate } from 'react-router-dom';
import TaskCheckbox from '@/components/tasks/TaskCheckbox';

export default function BriefingPage() {
  const navigate = useNavigate();
  const hour = new Date().getHours();
  const isEvening = hour >= 18;
  const isMorning = hour < 12;

  const greeting = isMorning
    ? 'Good morning'
    : isEvening
      ? 'Evening review'
      : 'Good afternoon';

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const { data: todayTasks = [] } = trpc.tasks.list.useQuery({ view: 'today' });
  const { data: inboxTasks = [] } = trpc.tasks.list.useQuery({ view: 'inbox' });
  const { data: upcomingTasks = [] } = trpc.tasks.list.useQuery({ view: 'upcoming' });
  const utils = trpc.useUtils();

  const complete = trpc.tasks.complete.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
    },
  });

  const activeTodayTasks = todayTasks.filter((t: any) => t.status === 'todo');
  const overdueTasks = activeTodayTasks.filter((t: any) => {
    if (!t.dueDate) return false;
    const due = new Date(t.dueDate);
    const now = new Date();
    due.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return due < now;
  });
  const dueTodayTasks = activeTodayTasks.filter((t: any) => {
    if (!t.dueDate) return false;
    const due = new Date(t.dueDate);
    const now = new Date();
    due.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return due.getTime() === now.getTime();
  });
  const activeInboxTasks = inboxTasks.filter((t: any) => t.status === 'todo');
  const activeUpcoming = upcomingTasks.filter((t: any) => t.status === 'todo').slice(0, 5);

  const totalActionItems = activeTodayTasks.length + activeInboxTasks.length;
  const hasAnything = totalActionItems > 0 || activeUpcoming.length > 0;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-display text-foreground">{greeting}</h1>
        <p className="text-body text-muted-foreground mt-1">{today}</p>
        {hasAnything && (
          <p className="text-body-medium text-foreground mt-4">
            You have <span className="text-primary font-semibold">{totalActionItems}</span> item{totalActionItems !== 1 ? 's' : ''} that need{totalActionItems === 1 ? 's' : ''} attention.
          </p>
        )}
      </div>

      {!hasAnything ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Zap className="h-12 w-12 text-muted-foreground/20 mb-4" />
          <p className="text-heading-3 text-muted-foreground">You're on top of things</p>
          <p className="text-body text-muted-foreground/60 mt-2">
            Nothing needs attention right now
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Overdue — highest urgency */}
          {overdueTasks.length > 0 && (
            <BriefingSection
              icon={AlertCircle}
              title="Overdue"
              iconColor="text-escalation-3"
              borderColor="border-escalation-3/30"
            >
              {overdueTasks.map((task: any) => (
                <BriefingTask
                  key={task.id}
                  task={task}
                  onComplete={() => complete.mutate({ id: task.id })}
                  onClick={() => navigate('/tasks')}
                  urgency="high"
                />
              ))}
            </BriefingSection>
          )}

          {/* Due today */}
          {dueTodayTasks.length > 0 && (
            <BriefingSection icon={CalendarDays} title="Due today" iconColor="text-status-urgency-low">
              {dueTodayTasks.map((task: any) => (
                <BriefingTask
                  key={task.id}
                  task={task}
                  onComplete={() => complete.mutate({ id: task.id })}
                  onClick={() => navigate('/tasks')}
                />
              ))}
            </BriefingSection>
          )}

          {/* Inbox — unsorted items */}
          {activeInboxTasks.length > 0 && (
            <BriefingSection icon={Inbox} title="Inbox" iconColor="text-muted-foreground">
              {activeInboxTasks.slice(0, 5).map((task: any) => (
                <BriefingTask
                  key={task.id}
                  task={task}
                  onComplete={() => complete.mutate({ id: task.id })}
                  onClick={() => navigate('/tasks')}
                />
              ))}
              {activeInboxTasks.length > 5 && (
                <button
                  onClick={() => navigate('/tasks')}
                  className="flex items-center gap-1 text-caption text-primary hover:text-primary/80 transition-colors mt-2"
                >
                  +{activeInboxTasks.length - 5} more <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </BriefingSection>
          )}

          {/* Upcoming preview */}
          {activeUpcoming.length > 0 && (
            <BriefingSection icon={CalendarDays} title="Coming up" iconColor="text-muted-foreground">
              {activeUpcoming.map((task: any) => (
                <BriefingTask
                  key={task.id}
                  task={task}
                  onComplete={() => complete.mutate({ id: task.id })}
                  onClick={() => navigate('/tasks')}
                  muted
                />
              ))}
            </BriefingSection>
          )}
        </div>
      )}
    </div>
  );
}

function BriefingSection({
  icon: Icon,
  title,
  iconColor = 'text-muted-foreground',
  borderColor,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  iconColor?: string;
  borderColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('rounded-lg border border-border p-4', borderColor)}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={cn('h-4 w-4', iconColor)} />
        <span className="text-overline text-muted-foreground uppercase tracking-wider">{title}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function BriefingTask({
  task,
  onComplete,
  onClick,
  urgency,
  muted,
}: {
  task: { id: string; title: string; status: string; dueDate?: string | null; priority: number };
  onComplete: () => void;
  onClick: () => void;
  urgency?: 'high';
  muted?: boolean;
}) {
  const isDone = task.status === 'done';

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors duration-150',
        'hover:bg-surface-overlay/50',
        muted && 'opacity-60',
      )}
    >
      <TaskCheckbox checked={isDone} onChange={onComplete} />
      <span
        className={cn(
          'text-body flex-1',
          isDone && 'line-through text-muted-foreground',
          urgency === 'high' && 'text-escalation-3 font-medium',
        )}
      >
        {task.title}
      </span>
      {task.dueDate && (
        <span className="text-caption text-muted-foreground">
          {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      )}
    </div>
  );
}
