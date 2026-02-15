import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';

const TAG_COLORS = [
  { value: 'blue', bg: 'bg-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-400' },
  { value: 'green', bg: 'bg-green-500/20', text: 'text-green-400', dot: 'bg-green-400' },
  { value: 'purple', bg: 'bg-purple-500/20', text: 'text-purple-400', dot: 'bg-purple-400' },
  { value: 'amber', bg: 'bg-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-400' },
  { value: 'rose', bg: 'bg-rose-500/20', text: 'text-rose-400', dot: 'bg-rose-400' },
  { value: 'cyan', bg: 'bg-cyan-500/20', text: 'text-cyan-400', dot: 'bg-cyan-400' },
];

export function getTagColor(color: string | null | undefined) {
  return TAG_COLORS.find((c) => c.value === color) ?? { value: 'default', bg: 'bg-muted', text: 'text-muted-foreground', dot: 'bg-muted-foreground' };
}

interface TagPickerProps {
  tagIds: string[];
  onChange: (tagIds: string[]) => void;
}

export default function TagPicker({ tagIds, onChange }: TagPickerProps) {
  const { data: allTags = [] } = trpc.tasks.tags.list.useQuery();
  const utils = trpc.useUtils();
  const [showCreate, setShowCreate] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('blue');

  const createTag = trpc.tasks.tags.create.useMutation({
    onSuccess: (tag) => {
      utils.tasks.tags.list.invalidate();
      onChange([...tagIds, tag.id]);
      setNewTagName('');
      setShowCreate(false);
    },
  });

  function toggleTag(tagId: string) {
    if (tagIds.includes(tagId)) {
      onChange(tagIds.filter((id) => id !== tagId));
    } else {
      onChange([...tagIds, tagId]);
    }
  }

  function handleCreate() {
    const name = newTagName.trim();
    if (!name) return;
    createTag.mutate({ name, color: newTagColor });
  }

  return (
    <div className="space-y-2">
      {/* Selected tags */}
      {tagIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tagIds.map((id) => {
            const tag = allTags.find((t: any) => t.id === id);
            if (!tag) return null;
            const color = getTagColor(tag.color);
            return (
              <span
                key={id}
                className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium', color.bg, color.text)}
              >
                {tag.name}
                <button
                  onClick={() => toggleTag(id)}
                  className="hover:opacity-70 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Available tags */}
      <div className="flex flex-wrap gap-1">
        {allTags
          .filter((t: any) => !tagIds.includes(t.id))
          .map((tag: any) => {
            const color = getTagColor(tag.color);
            return (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] transition-colors',
                  'text-muted-foreground hover:text-foreground border border-border hover:border-foreground/20',
                )}
              >
                <div className={cn('w-1.5 h-1.5 rounded-full', color.dot)} />
                {tag.name}
              </button>
            );
          })}
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-foreground/20 transition-colors"
        >
          <Plus className="h-3 w-3" />
          New
        </button>
      </div>

      {/* Create new tag inline */}
      {showCreate && (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') { setShowCreate(false); setNewTagName(''); }
            }}
            placeholder="Tag name..."
            className="flex-1 bg-surface-raised text-body text-foreground placeholder:text-muted-foreground/50 px-2 py-1 rounded border border-border focus:outline-none focus:border-primary/50"
          />
          <div className="flex gap-1">
            {TAG_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setNewTagColor(c.value)}
                className={cn('w-4 h-4 rounded-full', c.dot, newTagColor === c.value && 'ring-2 ring-foreground ring-offset-1 ring-offset-surface-root')}
              />
            ))}
          </div>
          <button
            onClick={() => { setShowCreate(false); setNewTagName(''); }}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
