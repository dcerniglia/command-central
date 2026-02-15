import { useState, useRef } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';
import TaskCheckbox from './TaskCheckbox';

interface TaskChecklistProps {
  taskId: string;
  checklist: any[];
}

export default function TaskChecklist({ taskId, checklist }: TaskChecklistProps) {
  const utils = trpc.useUtils();
  const [newTitle, setNewTitle] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const invalidate = () => {
    utils.tasks.checklist.list.invalidate({ taskId });
  };

  const createItem = trpc.tasks.checklist.create.useMutation({ onSuccess: invalidate });
  const updateItem = trpc.tasks.checklist.update.useMutation({ onSuccess: invalidate });
  const deleteItem = trpc.tasks.checklist.delete.useMutation({ onSuccess: invalidate });

  function handleAdd() {
    const title = newTitle.trim();
    if (!title) return;
    createItem.mutate({ taskId, title });
    setNewTitle('');
    // Keep input focused for rapid entry
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleToggle(id: string, currentDone: boolean) {
    updateItem.mutate({ id, done: !currentDone });
  }

  function startEditing(id: string, title: string) {
    setEditingId(id);
    setEditTitle(title);
  }

  function handleEditSave(id: string) {
    const title = editTitle.trim();
    if (title && title !== checklist.find(i => i.id === id)?.title) {
      updateItem.mutate({ id, title });
    }
    setEditingId(null);
  }

  const doneCount = checklist.filter((i: any) => i.done).length;

  return (
    <div className="pt-2 border-t border-border space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-overline text-muted-foreground uppercase tracking-wider">
          Checklist
          {checklist.length > 0 && (
            <span className="ml-1.5 text-muted-foreground/50">
              {doneCount}/{checklist.length}
            </span>
          )}
        </span>
        {!showAdd && (
          <button
            onClick={() => { setShowAdd(true); setTimeout(() => inputRef.current?.focus(), 0); }}
            className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Progress bar */}
      {checklist.length > 0 && (
        <div className="h-1 rounded-full bg-surface-overlay overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(doneCount / checklist.length) * 100}%` }}
          />
        </div>
      )}

      {/* Items */}
      {checklist.map((item: any) => (
        <div key={item.id} className="group flex items-center gap-2">
          <TaskCheckbox
            checked={item.done}
            onChange={() => handleToggle(item.id, item.done)}
            className="w-4 h-4"
          />
          {editingId === item.id ? (
            <input
              autoFocus
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={() => handleEditSave(item.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleEditSave(item.id);
                if (e.key === 'Escape') setEditingId(null);
              }}
              className="flex-1 bg-transparent text-body text-foreground focus:outline-none"
            />
          ) : (
            <span
              onClick={() => startEditing(item.id, item.title)}
              className={cn(
                'flex-1 text-body cursor-text',
                item.done && 'line-through text-muted-foreground',
              )}
            >
              {item.title}
            </span>
          )}
          <button
            onClick={() => deleteItem.mutate({ id: item.id })}
            className="p-0.5 rounded text-muted-foreground/0 group-hover:text-muted-foreground hover:!text-status-error transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}

      {/* Add input */}
      {showAdd && (
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
          <input
            ref={inputRef}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') { setShowAdd(false); setNewTitle(''); }
            }}
            onBlur={() => {
              if (!newTitle.trim()) { setShowAdd(false); setNewTitle(''); }
            }}
            placeholder="Add item..."
            className="flex-1 bg-transparent text-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}
