import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

const mockTags = [
  { id: 'tag-1', name: 'Work', color: 'blue' },
  { id: 'tag-2', name: 'Personal', color: 'green' },
  { id: 'tag-3', name: 'Urgent', color: 'rose' },
];

const createMutateFn = vi.fn();
const deleteMutateFn = vi.fn();

vi.mock('@/lib/trpc', () => ({
  trpc: {
    tasks: {
      tags: {
        list: { useQuery: () => ({ data: mockTags }) },
        create: {
          useMutation: (opts: any) => {
            createMutateFn.mockImplementation((input: any) => {
              opts?.onSuccess?.({ id: 'new-tag', ...input });
            });
            return { mutate: createMutateFn };
          },
        },
        delete: {
          useMutation: () => ({ mutate: deleteMutateFn }),
        },
      },
    },
    useUtils: () => ({
      tasks: {
        tags: { list: { invalidate: vi.fn() } },
      },
    }),
  },
}));

import TagPicker from './TagPicker';

describe('TagPicker', () => {
  it('renders selected tags as badges', () => {
    render(<TagPicker tagIds={['tag-1']} onChange={vi.fn()} />);
    expect(screen.getByText('Work')).toBeInTheDocument();
  });

  it('renders unselected tags as toggleable buttons', () => {
    render(<TagPicker tagIds={['tag-1']} onChange={vi.fn()} />);
    // tag-2 and tag-3 should be available to add
    expect(screen.getByText('Personal')).toBeInTheDocument();
    expect(screen.getByText('Urgent')).toBeInTheDocument();
  });

  it('calls onChange when toggling a tag on', async () => {
    const onChange = vi.fn();
    render(<TagPicker tagIds={['tag-1']} onChange={onChange} />);
    await userEvent.click(screen.getByText('Personal'));
    expect(onChange).toHaveBeenCalledWith(['tag-1', 'tag-2']);
  });

  it('calls onChange when removing a selected tag', async () => {
    const onChange = vi.fn();
    render(<TagPicker tagIds={['tag-1', 'tag-2']} onChange={onChange} />);
    // The X button next to "Work"
    const removeButtons = screen.getAllByRole('button');
    // Find the X button inside the Work badge
    const workBadge = screen.getByText('Work').closest('span');
    const removeBtn = workBadge?.querySelector('button');
    if (removeBtn) await userEvent.click(removeBtn);
    expect(onChange).toHaveBeenCalledWith(['tag-2']);
  });

  it('shows "New" button to create tags', () => {
    render(<TagPicker tagIds={[]} onChange={vi.fn()} />);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('shows create input when New is clicked', async () => {
    render(<TagPicker tagIds={[]} onChange={vi.fn()} />);
    await userEvent.click(screen.getByText('New'));
    expect(screen.getByPlaceholderText('Tag name...')).toBeInTheDocument();
  });
});
