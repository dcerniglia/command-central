import { useState, useEffect } from 'react';
import { X, Trash2, Calendar, Flag, FolderOpen, MapPin, Layers, Repeat, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';
import TaskCheckbox from './TaskCheckbox';

interface TaskDetailProps {
  taskId: string;
  onClose: () => void;
}

const priorityOptions = [
  { value: 0, label: 'None', color: '' },
  { value: 1, label: 'Low', color: 'bg-status-info' },
  { value: 2, label: 'Medium', color: 'bg-status-urgency-low' },
  { value: 3, label: 'High', color: 'bg-status-urgency-high' },
];

export default function TaskDetail({ taskId, onClose }: TaskDetailProps) {
  const utils = trpc.useUtils();
  const { data: task, isLoading } = trpc.tasks.get.useQuery({ id: taskId });
  const { data: lists = [] } = trpc.tasks.lists.list.useQuery();
  const { data: areas = [] } = trpc.tasks.areas.list.useQuery();
  const { data: projects = [] } = trpc.tasks.projects.list.useQuery();
  const { data: checklist = [] } = trpc.tasks.checklist.list.useQuery({ taskId });

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState(0);
  const [listId, setListId] = useState<string | null>(null);
  const [areaId, setAreaId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [recurrenceRule, setRecurrenceRule] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setNotes(task.notes ?? '');
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
      setPriority(task.priority);
      setListId(task.listId ?? null);
      setAreaId(task.areaId ?? null);
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
            onClick={() => deleteMutation.mutate({ id: taskId })}
            className="p-1.5 rounded-md text-muted-foreground hover:text-status-error hover:bg-status-error/10 transition-colors"
            title="Delete task"
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

        {/* Notes */}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => notes !== (task.notes ?? '') && save({ notes: notes || null })}
          placeholder="Add notes..."
          rows={4}
          className="w-full bg-transparent text-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none resize-none"
        />

        {/* Metadata fields */}
        <div className="space-y-3 pt-2 border-t border-border">
          {/* Due date */}
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value);
                save({ dueDate: e.target.value || null });
              }}
              className="flex-1 bg-transparent text-body text-foreground focus:outline-none [color-scheme:dark]"
            />
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

          {/* List */}
          <div className="flex items-center gap-3">
            <FolderOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <select
              value={listId ?? ''}
              onChange={(e) => {
                const val = e.target.value || null;
                setListId(val);
                save({ listId: val });
              }}
              className="flex-1 bg-transparent text-body text-foreground focus:outline-none"
            >
              <option value="">No list</option>
              {lists.map((l: any) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          {/* Area */}
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <select
              value={areaId ?? ''}
              onChange={(e) => {
                const val = e.target.value || null;
                setAreaId(val);
                save({ areaId: val });
              }}
              className="flex-1 bg-transparent text-body text-foreground focus:outline-none"
            >
              <option value="">No area</option>
              {areas.map((a: any) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
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

        {/* Checklist */}
        {checklist.length > 0 && (
          <div className="pt-2 border-t border-border space-y-2">
            <span className="text-overline text-muted-foreground uppercase tracking-wider">Checklist</span>
            {checklist.map((item: any) => (
              <div key={item.id} className="flex items-center gap-2">
                <TaskCheckbox
                  checked={item.done}
                  onChange={() => {}}
                  className="w-4 h-4"
                />
                <span className={cn('text-body', item.done && 'line-through text-muted-foreground')}>
                  {item.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
