import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open, title, description, confirmLabel = 'Archive', onConfirm, onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative bg-surface-raised border border-border rounded-lg shadow-lg max-w-sm w-full mx-4 p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-status-urgency-high/10">
            <AlertTriangle className="h-5 w-5 text-status-urgency-high" />
          </div>
          <div>
            <h3 className="text-body-medium text-foreground font-semibold">{title}</h3>
            <p className="text-caption text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="px-3 py-1.5 rounded-md text-body text-muted-foreground hover:text-foreground hover:bg-surface-overlay transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 rounded-md text-body text-white bg-status-urgency-high hover:bg-status-urgency-high/80 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
