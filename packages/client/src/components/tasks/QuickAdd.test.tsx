import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

const mutateFn = vi.fn();
const invalidateFn = vi.fn();

vi.mock('@/lib/trpc', () => ({
  trpc: {
    tasks: {
      create: {
        useMutation: (opts: any) => {
          // Store the onSuccess so we can call it
          mutateFn.mockImplementation((input: any) => {
            opts?.onSuccess?.();
          });
          return { mutate: mutateFn };
        },
      },
    },
    useUtils: () => ({
      tasks: { list: { invalidate: invalidateFn } },
    }),
  },
}));

import QuickAdd from './QuickAdd';

describe('QuickAdd', () => {
  it('renders input with placeholder', () => {
    render(<QuickAdd />);
    expect(screen.getByPlaceholderText('Add a task...')).toBeInTheDocument();
  });

  it('calls create mutation on Enter with non-empty value', () => {
    render(<QuickAdd />);
    const input = screen.getByPlaceholderText('Add a task...');
    fireEvent.change(input, { target: { value: 'New task' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mutateFn).toHaveBeenCalledWith({ title: 'New task' });
  });

  it('does not call create mutation on Enter with empty value', () => {
    mutateFn.mockClear();
    render(<QuickAdd />);
    const input = screen.getByPlaceholderText('Add a task...');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mutateFn).not.toHaveBeenCalled();
  });

  it('clears input on Escape', () => {
    render(<QuickAdd />);
    const input = screen.getByPlaceholderText('Add a task...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Some text' } });
    expect(input.value).toBe('Some text');
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input.value).toBe('');
  });

  it('shows "Enter to save" hint when input has text', () => {
    render(<QuickAdd />);
    const input = screen.getByPlaceholderText('Add a task...');
    expect(screen.queryByText('Enter to save')).not.toBeInTheDocument();
    fireEvent.change(input, { target: { value: 'Something' } });
    expect(screen.getByText('Enter to save')).toBeInTheDocument();
  });
});
