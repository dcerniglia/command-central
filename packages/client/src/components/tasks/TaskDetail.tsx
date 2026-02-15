import { useState, useEffect } from 'react';
import { X, Trash2, Flag, Layers, Repeat, ExternalLink, CircleDot, Clock, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';
import TaskCheckbox from './TaskCheckbox';
import MarkdownNotes from './MarkdownNotes';
import { DatePicker } from '@/components/ui/date-picker';
import TagPicker from './TagPicker';
import ConfirmDialog from '@/components/ui/confirm-dialog';

interface TaskDetailProps {
  taskId: string;
  onClose: () => void;
}

const statusOptions = [
  { value: 'todo', label: 'To Do', color: 'text-muted-foreground' },
  { value: 'in_progress', label: 'In Progress', color: 'text-status-info' },
  { value: 'blocked', label: 'Blocked', color: 'text-status-urgency-high' },
  { value: 'waiting', label: 'Waiting', color: 'text-status-urgency-low' },
  { value: 'done', label: 'Done', color: 'text-green-500' },
  { value: 'cancelled', label: 'Cancelled', color: 'text-muted-foreground/50' },
];

const priorityOptions = [
  { value: 0, label: 'None', color: '' },
  { value: 1, label: 'Low', color: 'bg-status-info' },
  { value: 2, label: 'Medium', color: 'bg-status-urgency-low' },
  { value: 3, label: 'High', color: 'bg-status-urgency-high' },
];

export default function TaskDetail({ taskId, onClose }: TaskDetailProps) {
  const utils = trpc.useUtils();
  const { data: task, isLoading } = trpc.tasks.get.useQuery({ id: taskId });
  const { data: projects = [] } = trpc.tasks.projects.list.useQuery();

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('todo');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [priority, setPriority] = useState(0);
  const [estimateMinutes, setEstimateMinutes] = useState<number | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [recurrenceRule, setRecurrenceRule] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setNotes(task.notes ?? '');
      setStatus(task.status);
      setStartDate(task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '');
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
      setDueTime(task.dueTime ?? '');
      setPriority(task.priority);
      setEstimateMinutes(task.estimateMinutes ?? null);
      setProjectId(task.projectId ?? null);
      setRecurrenceRule(task.recurrenceRule ?? null);
    }
  }, [task]);

  const update = trpc.tasks.update.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
      utils.tasks.get.invalidate({ id: taskId });
    },
  });

  const complete = trpc.tasks.complete.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
      utils.tasks.get.invalidate({ id: taskId });
    },
  });

  const deleteMutation = trpc.tasks.delete.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
      onClose();
    },
  });

  function save(fields: Record<string, any>) {
    update.mutate({ id: taskId, ...fields });
  }

  if (isLoading || !task) {
    return (
      <div className="w-[400px] border-l border-border bg-surface-root flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const isDone = task.status === 'done';
  const isJira = task.source === 'jira';

  return (
    <div className="w-[400px] border-l border-border bg-surface-root flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border">
        <div className="flex items-center gap-3">
          <TaskCheckbox checked={isDone} onChange={() => complete.mutate({ id: taskId })} />
          <span className="text-overline text-muted-foreground uppercase tracking-wider">
            {isJira ? 'Jira Task' : 'Task Detail'}
          </span>
          {isJira && task.externalKey && (
            <a
              href={task.externalUrl ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-caption text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="font-mono">{task.externalKey}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-status-error hover:bg-status-error/10 transition-colors"
            title="Archive task"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-overlay transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Title */}
        <input
          value={title}
          onChange={(e) => !isJira && setTitle(e.target.value)}
          onBlur={() => !isJira && title.trim() && title !== task.title && save({ title: title.trim() })}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          readOnly={isJira}
          className={cn(
            'w-full bg-transparent text-heading-3 text-foreground font-semibold focus:outline-none',
            isDone && 'line-through text-muted-foreground',
            isJira && 'cursor-default',
          )}
        />
        {isJira && (
          <p className="text-caption text-muted-foreground/60">Title synced from Jira — edit in Jira to update</p>
        )}

        {/* Notes (markdown) */}
        <MarkdownNotes
          value={notes}
          onChange={setNotes}
          onBlur={() => notes !== (task.notes ?? '') && save({ notes: notes || null })}
          placeholder="Add notes (markdown supported)..."
        />

        {/* Metadata fields */}
        <div className="space-y-3 pt-2 border-t border-border">
          {/* Status */}
          <div className="flex items-center gap-3">
            <CircleDot className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex items-center gap-1 flex-wrap">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setStatus(opt.value);
                    save({ status: opt.value });
                  }}
                  className={cn(
                    'px-2 py-1 rounded text-caption transition-colors',
                    status === opt.value
                      ? `bg-primary/15 ${opt.color}`
                      : 'text-muted-foreground hover:text-foreground hover:bg-surface-overlay',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Start date */}
          <DatePicker
            value={startDate}
            onChange={(val) => {
              setStartDate(val);
              save({ startDate: val || null });
            }}
            placeholder="Start date"
          />

          {/* Due date */}
          <DatePicker
            value={dueDate}
            onChange={(val) => {
              setDueDate(val);
              save({ dueDate: val || null });
            }}
            placeholder="Due date"
          />

          {/* Due time */}
          <div className="flex items-center gap-3">
            <Timer className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <input
              type="time"
              value={dueTime}
              onChange={(e) => {
                setDueTime(e.target.value);
                save({ dueTime: e.target.value || null });
              }}
              className="flex-1 bg-transparent text-body text-foreground focus:outline-none [color-scheme:dark]"
            />
            {!dueTime && <span className="text-caption text-muted-foreground/50">Due time</span>}
          </div>

          {/* Estimate */}
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <input
              type="number"
              min={0}
              value={estimateMinutes ?? ''}
              onChange={(e) => {
                const val = e.target.value ? parseInt(e.target.value, 10) : null;
                setEstimateMinutes(val);
              }}
              onBlur={() => {
                const current = task.estimateMinutes ?? null;
                if (estimateMinutes !== current) save({ estimateMinutes });
              }}
              placeholder="Estimate (min)"
              className="flex-1 bg-transparent text-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
            />
            {estimateMinutes && (
              <span className="text-caption text-muted-foreground">
                {estimateMinutes >= 60 ? `${Math.floor(estimateMinutes / 60)}h ${estimateMinutes % 60}m` : `${estimateMinutes}m`}
              </span>
            )}
          </div>

          {/* Recurrence */}
          <div className="flex items-center gap-3">
            <Repeat className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <select
              value={recurrenceRule ?? ''}
              onChange={(e) => {
                const val = e.target.value || null;
                setRecurrenceRule(val);
                save({ recurrenceRule: val });
              }}
              className="flex-1 bg-transparent text-body text-foreground focus:outline-none"
            >
              <option value="">No repeat</option>
              <option value="FREQ=DAILY">Daily</option>
              <option value="FREQ=WEEKLY">Weekly</option>
              <option value="FREQ=MONTHLY">Monthly</option>
            </select>
          </div>

          {/* Priority */}
          <div className="flex items-center gap-3">
            <Flag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex items-center gap-1">
              {priorityOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setPriority(opt.value);
                    save({ priority: opt.value });
                  }}
                  className={cn(
                    'px-2 py-1 rounded text-caption transition-colors',
                    priority === opt.value
                      ? 'bg-primary/15 text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-surface-overlay',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Project */}
          <div className="flex items-center gap-3">
            <Layers className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <select
              value={projectId ?? ''}
              onChange={(e) => {
                const val = e.target.value || null;
                setProjectId(val);
                save({ projectId: val });
              }}
              className="flex-1 bg-transparent text-body text-foreground focus:outline-none"
            >
              <option value="">No project</option>
              {projects.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tags */}
        <div className="pt-2 border-t border-border">
          <span className="text-overline text-muted-foreground uppercase tracking-wider mb-2 block">Tags</span>
          <TagPicker
            tagIds={task.tagIds ?? []}
            onChange={(tagIds) => save({ tagIds })}
          />
        </div>

      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Archive this task?"
        description="This task will be archived and hidden from all views. It can be restored later."
        onConfirm={() => { setShowDeleteConfirm(false); deleteMutation.mutate({ id: taskId }); }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
