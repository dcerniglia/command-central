import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Calendar } from './calendar';

interface DatePickerProps {
  value: string; // ISO date string (YYYY-MM-DD) or empty
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({ value, onChange, placeholder = 'Pick a date', className }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseISO(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-2 text-body transition-colors',
            value ? 'text-foreground' : 'text-muted-foreground/50',
            className,
          )}
        >
          <CalendarIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span>{value ? format(parseISO(value), 'MMM d, yyyy') : placeholder}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            onChange(date ? format(date, 'yyyy-MM-dd') : '');
            setOpen(false);
          }}
          initialFocus
        />
        {value && (
          <div className="border-t border-border p-2">
            <button
              onClick={() => { onChange(''); setOpen(false); }}
              className="w-full text-caption text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              Clear date
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
