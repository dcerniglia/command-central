import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import TaskRow from './TaskRow';

const baseTask = {
  id: '123',
  title: 'Test task',
  status: 'todo',
  priority: 0,
  dueDate: null,
  projectId: null,
};

describe('TaskRow', () => {
  it('renders task title', () => {
    render(<TaskRow task={baseTask} onComplete={vi.fn()} onClick={vi.fn()} />);
    expect(screen.getByText('Test task')).toBeInTheDocument();
  });

  it('shows line-through when done', () => {
    const doneTask = { ...baseTask, status: 'done' };
    render(<TaskRow task={doneTask} onComplete={vi.fn()} onClick={vi.fn()} />);
    const title = screen.getByText('Test task');
    expect(title).toHaveClass('line-through');
  });

  it('calls onClick when row is clicked', async () => {
    const onClick = vi.fn();
    render(<TaskRow task={baseTask} onComplete={vi.fn()} onClick={onClick} />);
    await userEvent.click(screen.getByText('Test task'));
    expect(onClick).toHaveBeenCalledWith('123');
  });

  it('calls onComplete when checkbox is clicked', async () => {
    const onComplete = vi.fn();
    const onClick = vi.fn();
    render(<TaskRow task={baseTask} onComplete={onComplete} onClick={onClick} />);
    // Checkbox is the button element
    const checkbox = screen.getByRole('button');
    await userEvent.click(checkbox);
    expect(onComplete).toHaveBeenCalledWith('123');
    // Should not bubble to onClick
    expect(onClick).not.toHaveBeenCalled();
  });

  it('shows a due date label when dueDate is set', () => {
    // Use a date far in the future to get a predictable "Month Day" format
    const futureDate = '2099-06-15';
    const task = { ...baseTask, dueDate: futureDate };
    const { container } = render(<TaskRow task={task} onComplete={vi.fn()} onClick={vi.fn()} />);
    const dueLabel = container.querySelector('span[class*="text-"]');
    expect(dueLabel).toBeInTheDocument();
    expect(dueLabel!.textContent).toMatch(/Jun/);
  });

  it('shows overdue label for past dates', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0];
    const task = { ...baseTask, dueDate: threeDaysAgo };
    const { container } = render(<TaskRow task={task} onComplete={vi.fn()} onClick={vi.fn()} />);
    // Should show some overdue text (exact days depend on timezone)
    const dueLabel = container.querySelector('span[class*="escalation"]');
    expect(dueLabel).toBeInTheDocument();
    expect(dueLabel!.textContent).toMatch(/overdue/);
  });

  it('shows priority indicator for high priority', () => {
    const task = { ...baseTask, priority: 3 };
    const { container } = render(<TaskRow task={task} onComplete={vi.fn()} onClick={vi.fn()} />);
    // High priority renders a colored dot
    const dot = container.querySelector('.bg-status-urgency-high');
    expect(dot).toBeInTheDocument();
  });

  it('shows priority dot for medium priority', () => {
    const task = { ...baseTask, priority: 2 };
    const { container } = render(<TaskRow task={task} onComplete={vi.fn()} onClick={vi.fn()} />);
    const dot = container.querySelector('.bg-status-urgency-low');
    expect(dot).toBeInTheDocument();
  });
});
