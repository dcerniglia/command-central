import { useEffect } from 'react';

interface ShortcutMap {
  [key: string]: (e: KeyboardEvent) => void;
}

/**
 * Global keyboard shortcut handler.
 * Keys are matched as: "n", "Escape", "mod+k" (Cmd/Ctrl+K).
 * Shortcuts are ignored when focus is in an input, textarea, or contenteditable.
 */
export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Don't intercept when typing in form elements
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        // Only allow Escape through when in inputs
        if (e.key !== 'Escape') return;
      }

      const mod = e.metaKey || e.ctrlKey;
      let key = e.key;
      if (mod) key = `mod+${key.toLowerCase()}`;

      const fn = shortcuts[key];
      if (fn) {
        e.preventDefault();
        fn(e);
      }
    }

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts]);
}
