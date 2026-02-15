import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { trpc } from '@/lib/trpc';
import { Sparkles, ArrowLeft, Loader2, Calendar, Clock, Tag, FolderOpen, Flag, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ParsedTaskPreview } from '@cc/shared';

const priorityLabels: Record<number, { label: string; color: string }> = {
  0: { label: 'None', color: 'text-muted-foreground' },
  1: { label: 'Low', color: 'text-status-info' },
  2: { label: 'Medium', color: 'text-status-urgency-low' },
  3: { label: 'High', color: 'text-status-urgency-high' },
};

interface Props {
  open: boolean;
  onClose: () => void;
  projectId?: string | null;
}

export default function NaturalLanguageCapture({ open, onClose, projectId }: Props) {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<ParsedTaskPreview | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const parseMutation = trpc.tasks.parseNaturalLanguage.useMutation({
    onSuccess: (data) => setPreview(data),
  });

  const createMutation = trpc.tasks.create.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
      handleClose();
    },
  });

  useEffect(() => {
    if (open) {
      setText('');
      setPreview(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  function handleClose() {
    setText('');
    setPreview(null);
    onClose();
  }

  function handleParse() {
    const trimmed = text.trim();
    if (!trimmed) return;
    parseMutation.mutate({ text: trimmed });
  }

  function handleCreate() {
    if (!preview) return;
    createMutation.mutate({
      title: preview.title,
      notes: preview.notes,
      projectId: preview.projectId ?? projectId,
      tagIds: preview.tagIds,
      priority: preview.priority,
      dueDate: preview.dueDate ? new Date(preview.dueDate) : null,
      startDate: preview.startDate ? new Date(preview.startDate) : null,
      dueTime: preview.dueTime,
      estimateMinutes: preview.estimateMinutes,
      processed: true,
    });
  }

  function handleBack() {
    setPreview(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  if (!open) return null;

  const isParsing = parseMutation.isPending;
  const isCreating = createMutation.isPending;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="fixed inset-0 bg-black/60" onClick={handleClose} />
      <div
        className="relative w-full max-w-lg mx-4 bg-surface-raised border border-border rounded-lg shadow-lg"
        onKeyDown={(e) => {
          if (e.key === 'Escape') handleClose();
        }}
      >
        {!preview ? (
          /* Input phase */
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-caption text-muted-foreground">Natural language capture</span>
            </div>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                placeholder='e.g. "Schedule dentist next Tuesday 2pm #health high priority"'
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleParse();
                  }
                }}
                disabled={isParsing}
                className="flex-1 bg-transparent text-body text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
              />
              <button
                onClick={handleParse}
                disabled={!text.trim() || isParsing}
                className={cn(
                  'px-3 py-1.5 rounded-md text-caption font-medium transition-colors',
                  text.trim() && !isParsing
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground cursor-not-allowed',
                )}
              >
                {isParsing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Parse'}
              </button>
            </div>
            {parseMutation.isError && (
              <p className="text-caption text-status-urgency-high mt-2">
                Failed to parse. Try again or simplify your input.
              </p>
            )}
          </div>
        ) : (
          /* Preview phase */
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={handleBack}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <span className="text-caption text-muted-foreground">Preview</span>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-body-medium text-foreground font-medium">{preview.title}</h3>
                {preview.notes && (
                  <p className="text-caption text-muted-foreground mt-1">{preview.notes}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {preview.projectName && (
                  <PreviewChip icon={<FolderOpen className="h-3 w-3" />} label={preview.projectName} />
                )}
                {preview.tagNames.map((tag) => (
                  <PreviewChip key={tag} icon={<Tag className="h-3 w-3" />} label={tag} />
                ))}
                {preview.priority > 0 && (
                  <PreviewChip
                    icon={<Flag className="h-3 w-3" />}
                    label={priorityLabels[preview.priority].label}
                    className={priorityLabels[preview.priority].color}
                  />
                )}
                {preview.dueDate && (
                  <PreviewChip icon={<Calendar className="h-3 w-3" />} label={formatDate(preview.dueDate)} />
                )}
                {preview.dueTime && (
                  <PreviewChip icon={<Clock className="h-3 w-3" />} label={preview.dueTime} />
                )}
                {preview.estimateMinutes && (
                  <PreviewChip icon={<Timer className="h-3 w-3" />} label={`${preview.estimateMinutes}m`} />
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-border">
              <button
                onClick={handleBack}
                className="px-3 py-1.5 rounded-md text-caption text-muted-foreground hover:text-foreground transition-colors"
              >
                Edit Input
              </button>
              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="px-3 py-1.5 rounded-md text-caption font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {isCreating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Create Task'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

function PreviewChip({ icon, label, className }: { icon: React.ReactNode; label: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted text-caption', className)}>
      {icon}
      {label}
    </span>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
