import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { Pencil, Eye } from 'lucide-react';

interface MarkdownNotesProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  placeholder?: string;
}

export default function MarkdownNotes({ value, onChange, onBlur, placeholder = 'Add notes...' }: MarkdownNotesProps) {
  const [editing, setEditing] = useState(false);

  if (editing || !value) {
    return (
      <div className="relative">
        <textarea
          autoFocus={editing}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => {
            setEditing(false);
            onBlur();
          }}
          placeholder={placeholder}
          rows={6}
          className="w-full bg-transparent text-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none resize-none"
        />
        {value && (
          <button
            onClick={() => setEditing(false)}
            className="absolute top-0 right-0 p-1 text-muted-foreground hover:text-foreground transition-colors"
            title="Preview"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative group">
      <button
        onClick={() => setEditing(true)}
        className="absolute top-0 right-0 p-1 text-muted-foreground/0 group-hover:text-muted-foreground hover:!text-foreground transition-colors"
        title="Edit"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <div
        onClick={() => setEditing(true)}
        className={cn(
          'prose prose-invert prose-sm max-w-none cursor-text',
          'prose-headings:text-foreground prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2',
          'prose-p:text-foreground/90 prose-p:my-1.5',
          'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
          'prose-code:text-primary prose-code:bg-surface-overlay prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-[13px]',
          'prose-pre:bg-surface-overlay prose-pre:rounded-md prose-pre:border prose-pre:border-border',
          'prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5',
          'prose-strong:text-foreground',
        )}
      >
        <ReactMarkdown>{value}</ReactMarkdown>
      </div>
    </div>
  );
}
