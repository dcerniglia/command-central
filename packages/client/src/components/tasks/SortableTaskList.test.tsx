import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SortableTaskList from './SortableTaskList';

const tasks = [
  { id: '1', title: 'First task', status: 'todo', priority: 0, dueDate: null, listId: null, areaId: null },
  { id: '2', title: 'Second task', status: 'todo', priority: 1, dueDate: null, listId: null, areaId: null },
  { id: '3', title: 'Third task', status: 'todo', priority: 2, dueDate: null, listId: null, areaId: null },
];

describe('SortableTaskList', () => {
  it('renders all tasks', () => {
    render(
      <SortableTaskList tasks={tasks} onComplete={vi.fn()} onClick={vi.fn()} onReorder={vi.fn()} />,
    );
    expect(screen.getByText('First task')).toBeInTheDocument();
    expect(screen.getByText('Second task')).toBeInTheDocument();
    expect(screen.getByText('Third task')).toBeInTheDocument();
  });

  it('renders drag handles for each task', () => {
    const { container } = render(
      <SortableTaskList tasks={tasks} onComplete={vi.fn()} onClick={vi.fn()} onReorder={vi.fn()} />,
    );
    // Each task should have a drag handle (GripVertical svg)
    const gripIcons = container.querySelectorAll('.lucide-grip-vertical');
    expect(gripIcons.length).toBe(3);
  });

  it('renders empty when no tasks', () => {
    const { container } = render(
      <SortableTaskList tasks={[]} onComplete={vi.fn()} onClick={vi.fn()} onReorder={vi.fn()} />,
    );
    expect(container.querySelector('.space-y-2')).toBeInTheDocument();
  });
});
