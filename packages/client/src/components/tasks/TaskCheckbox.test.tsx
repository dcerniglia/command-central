import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import TaskCheckbox from './TaskCheckbox';

describe('TaskCheckbox', () => {
  it('renders unchecked state', () => {
    render(<TaskCheckbox checked={false} onChange={vi.fn()} />);
    const button = screen.getByRole('button');
    expect(button).not.toHaveClass('bg-status-positive');
  });

  it('renders checked state with checkmark', () => {
    render(<TaskCheckbox checked={true} onChange={vi.fn()} />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-status-positive');
    // Check icon SVG should be present
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('calls onChange when clicked', async () => {
    const onChange = vi.fn();
    render(<TaskCheckbox checked={false} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('stops event propagation', async () => {
    const onChange = vi.fn();
    const parentClick = vi.fn();
    render(
      <div onClick={parentClick}>
        <TaskCheckbox checked={false} onChange={onChange} />
      </div>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onChange).toHaveBeenCalledOnce();
    expect(parentClick).not.toHaveBeenCalled();
  });
});
