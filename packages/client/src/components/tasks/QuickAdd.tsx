import { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';

export interface QuickAddHandle {
  focus: () => void;
}

interface QuickAddProps {
  focusAreaId?: string | null;
}

const QuickAdd = forwardRef<QuickAddHandle, QuickAddProps>(function QuickAdd({ focusAreaId }, ref) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));
  const utils = trpc.useUtils();

  const create = trpc.tasks.create.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
      setValue('');
    },
  });

  function handleSubmit() {
    const title = value.trim();
    if (!title) return;
    create.mutate({ title, ...(focusAreaId ? { areaId: focusAreaId } : {}) });
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors duration-150',
        focused
          ? 'border-primary/50 bg-surface-raised'
          : 'border-border bg-surface-raised/50 hover:bg-surface-raised',
      )}
    >
      <Plus className={cn('h-4 w-4 flex-shrink-0', focused ? 'text-primary' : 'text-muted-foreground')} />
      <input
        ref={inputRef}
        type="text"
        placeholder="Add a task..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit();
          if (e.key === 'Escape') {
            setValue('');
            inputRef.current?.blur();
          }
        }}
        className="flex-1 bg-transparent text-body text-foreground placeholder:text-muted-foreground focus:outline-none"
      />
      {value.trim() && (
        <span className="text-caption text-muted-foreground">Enter to save</span>
      )}
    </div>
  );
});

export default QuickAdd;
