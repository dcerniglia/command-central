import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Star, GripVertical, ExternalLink } from 'lucide-react';
import TaskCheckbox from './TaskCheckbox';

export interface TaskRowTask {
  id: string;
  title: string;
  status: string;
  priority: number;
  dueDate?: string | null;
  listId?: string | null;
  areaId?: string | null;
  projectId?: string | null;
  source?: string | null;
  externalKey?: string | null;
  externalUrl?: string | null;
}

interface TaskRowProps {
  task: TaskRowTask;
  onComplete: (id: string) => void;
  onClick: (id: string) => void;
  dragHandleProps?: Record<string, any>;
  style?: React.CSSProperties;
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

const statusBadges: Record<string, { label: string; color: string }> = {
  in_progress: { label: 'In Progress', color: 'text-status-info bg-status-info/10' },
  blocked: { label: 'Blocked', color: 'text-status-urgency-high bg-status-urgency-high/10' },
  waiting: { label: 'Waiting', color: 'text-status-urgency-low bg-status-urgency-low/10' },
};

function getPriorityIndicator(priority: number) {
  if (priority === 0) return null;
  const colors = ['', 'bg-status-info', 'bg-status-urgency-low', 'bg-status-urgency-high'];
  return <div className={cn('w-2 h-2 rounded-full flex-shrink-0', colors[priority])} />;
}

const TaskRow = forwardRef<HTMLDivElement, TaskRowProps>(function TaskRow(
  { task, onComplete, onClick, dragHandleProps, style },
  ref,
) {
  const isDone = task.status === 'done';
  const dueInfo = getDueLabel(task.dueDate);

  return (
    <div
      ref={ref}
      style={style}
      onClick={() => onClick(task.id)}
      className={cn(
        'group flex items-center gap-3 px-4 py-3 rounded-lg border border-border',
        'bg-surface-raised hover:bg-surface-overlay/50 cursor-pointer transition-colors duration-150',
        isDone && 'opacity-50',
      )}
    >
      {dragHandleProps && (
        <button
          {...dragHandleProps}
          className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors -ml-1"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}
      <TaskCheckbox checked={isDone} onChange={() => onComplete(task.id)} />

      <div className="flex-1 min-w-0">
        <p className={cn('text-body-medium text-foreground truncate', isDone && 'line-through text-muted-foreground')}>
          {task.title}
        </p>
        <div className="flex items-center gap-2">
          {dueInfo && (
            <span className={cn('text-caption', dueInfo.color)}>{dueInfo.label}</span>
          )}
          {!task.projectId && !isDone && (
            <span className="text-[11px] text-muted-foreground/50">No project</span>
          )}
          {!task.areaId && !isDone && (
            <span className="text-[11px] text-muted-foreground/50">No area</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {statusBadges[task.status] && (
          <span className={cn('px-1.5 py-0.5 rounded text-[11px] font-medium', statusBadges[task.status].color)}>
            {statusBadges[task.status].label}
          </span>
        )}
        {task.source === 'jira' && task.externalKey && (
          <span className="flex items-center gap-1 text-caption text-muted-foreground/70">
            <span className="font-mono text-[11px]">{task.externalKey}</span>
            {task.externalUrl && (
              <a
                href={task.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </span>
        )}
        {task.priority === 3 && (
          <Star className="h-3.5 w-3.5 text-primary fill-primary" />
        )}
        {getPriorityIndicator(task.priority)}
      </div>
    </div>
  );
});

export default TaskRow;
