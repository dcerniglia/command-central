import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';
import TaskCheckbox from './TaskCheckbox';

interface TaskRowProps {
  task: {
    id: string;
    title: string;
    status: string;
    priority: number;
    dueDate?: string | null;
    listId?: string | null;
    areaId?: string | null;
  };
  onComplete: (id: string) => void;
  onClick: (id: string) => void;
}

function getDueLabel(dueDate: string | null | undefined): { label: string; color: string } | null {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diff = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diff < 0) {
    const days = Math.abs(diff);
    if (days <= 1) return { label: 'Yesterday', color: 'text-escalation-2' };
    if (days <= 3) return { label: `${days}d overdue`, color: 'text-escalation-2' };
    if (days <= 6) return { label: `${days}d overdue`, color: 'text-escalation-3' };
    return { label: `${days}d overdue`, color: 'text-escalation-4' };
  }
  if (diff === 0) return { label: 'Today', color: 'text-status-urgency-low' };
  if (diff === 1) return { label: 'Tomorrow', color: 'text-muted-foreground' };
  if (diff <= 7) return { label: due.toLocaleDateString('en-US', { weekday: 'short' }), color: 'text-muted-foreground' };
  return { label: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), color: 'text-muted-foreground' };
}

function getPriorityIndicator(priority: number) {
  if (priority === 0) return null;
  const colors = ['', 'bg-status-info', 'bg-status-urgency-low', 'bg-status-urgency-high'];
  return <div className={cn('w-2 h-2 rounded-full flex-shrink-0', colors[priority])} />;
}

export default function TaskRow({ task, onComplete, onClick }: TaskRowProps) {
  const isDone = task.status === 'done';
  const dueInfo = getDueLabel(task.dueDate);

  return (
    <div
      onClick={() => onClick(task.id)}
      className={cn(
        'group flex items-center gap-3 px-4 py-3 rounded-lg border border-border',
        'bg-surface-raised hover:bg-surface-overlay/50 cursor-pointer transition-colors duration-150',
        isDone && 'opacity-50',
      )}
    >
      <TaskCheckbox checked={isDone} onChange={() => onComplete(task.id)} />

      <div className="flex-1 min-w-0">
        <p className={cn('text-body-medium text-foreground truncate', isDone && 'line-through text-muted-foreground')}>
          {task.title}
        </p>
        {dueInfo && (
          <span className={cn('text-caption', dueInfo.color)}>{dueInfo.label}</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {task.priority === 3 && (
          <Star className="h-3.5 w-3.5 text-primary fill-primary" />
        )}
        {getPriorityIndicator(task.priority)}
      </div>
    </div>
  );
}
