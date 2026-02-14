import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface TaskCheckboxProps {
  checked: boolean;
  onChange: () => void;
  className?: string;
}

export default function TaskCheckbox({ checked, onChange, className }: TaskCheckboxProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={cn(
        'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200',
        checked
          ? 'bg-status-positive border-status-positive scale-100'
          : 'border-surface-overlay hover:border-muted-foreground',
        className,
      )}
    >
      {checked && <Check className="h-3 w-3 text-surface-root" strokeWidth={3} />}
    </button>
  );
}
