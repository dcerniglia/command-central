import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  it('calls handler when key is pressed', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts({ 'n': handler }));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }));
    expect(handler).toHaveBeenCalledOnce();
  });

  it('does not call handler for unregistered keys', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts({ 'n': handler }));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' }));
    expect(handler).not.toHaveBeenCalled();
  });

  it('handles mod+key shortcuts', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts({ 'mod+k': handler }));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
    expect(handler).toHaveBeenCalledOnce();
  });

  it('allows Escape through in input elements', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts({ 'Escape': handler }));

    // Create an input and dispatch from it
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    input.dispatchEvent(event);
    expect(handler).toHaveBeenCalledOnce();

    document.body.removeChild(input);
  });

  it('blocks non-Escape keys in input elements', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts({ 'n': handler }));

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent('keydown', { key: 'n', bubbles: true });
    input.dispatchEvent(event);
    expect(handler).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });
});
