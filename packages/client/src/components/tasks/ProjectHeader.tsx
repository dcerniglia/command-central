import { useState, useEffect } from 'react';
import { Layers, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';
import { DatePicker } from '@/components/ui/date-picker';

const statusOptions = [
  { value: 'active', label: 'Active', color: 'text-status-info' },
  { value: 'on_hold', label: 'On Hold', color: 'text-status-urgency-low' },
  { value: 'completed', label: 'Completed', color: 'text-green-500' },
  { value: 'archived', label: 'Archived', color: 'text-muted-foreground/50' },
];

interface ProjectHeaderProps {
  projectId: string;
  onDeleted: () => void;
}

export default function ProjectHeader({ projectId, onDeleted }: ProjectHeaderProps) {
  const utils = trpc.useUtils();
  const { data: project } = trpc.tasks.projects.get.useQuery({ id: projectId });
  const { data: tasks = [] } = trpc.tasks.list.useQuery({ projectId });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description ?? '');
      setStatus(project.status);
      setStartDate(project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '');
      setDueDate(project.dueDate ? new Date(project.dueDate).toISOString().split('T')[0] : '');
    }
  }, [project]);

  const update = trpc.tasks.projects.update.useMutation({
    onSuccess: () => {
      utils.tasks.projects.list.invalidate();
      utils.tasks.projects.get.invalidate({ id: projectId });
    },
  });

  const deleteMutation = trpc.tasks.projects.delete.useMutation({
    onSuccess: () => {
      utils.tasks.projects.list.invalidate();
      utils.tasks.list.invalidate();
      onDeleted();
    },
  });

  function save(fields: Record<string, any>) {
    update.mutate({ id: projectId, ...fields });
  }

  if (!project) return null;

  const doneTasks = tasks.filter((t: any) => t.status === 'done').length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="mb-6 space-y-3">
      {/* Title row */}
      <div className="flex items-start gap-3">
        <Layers className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => name.trim() && name !== project.name && save({ name: name.trim() })}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            className="w-full bg-transparent text-heading-3 text-foreground font-semibold focus:outline-none"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => description !== (project.description ?? '') && save({ description: description || null })}
            placeholder="Add project description..."
            rows={1}
            className="w-full bg-transparent text-body text-muted-foreground placeholder:text-muted-foreground/50 focus:outline-none resize-none mt-1"
          />
        </div>
        <button
          onClick={() => deleteMutation.mutate({ id: projectId })}
          className="p-1.5 rounded-md text-muted-foreground hover:text-status-error hover:bg-status-error/10 transition-colors"
          title="Delete project"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Status pills */}
      <div className="flex items-center gap-1 ml-8">
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

      {/* Dates + progress row */}
      <div className="flex items-center gap-4 ml-8 flex-wrap">
        <DatePicker
          value={startDate}
          onChange={(val) => { setStartDate(val); save({ startDate: val || null }); }}
          placeholder="Start date"
        />
        <DatePicker
          value={dueDate}
          onChange={(val) => { setDueDate(val); save({ dueDate: val || null }); }}
          placeholder="Due date"
        />
        {totalTasks > 0 && (
          <span className="text-caption text-muted-foreground">
            {doneTasks}/{totalTasks} tasks ({progress}%)
          </span>
        )}
      </div>

      {/* Progress bar */}
      {totalTasks > 0 && (
        <div className="ml-8 h-1.5 rounded-full bg-surface-overlay overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="border-b border-border" />
    </div>
  );
}
