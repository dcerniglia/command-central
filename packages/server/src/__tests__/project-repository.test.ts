import { describe, it, expect } from 'vitest';
import { CreateProjectInput, UpdateProjectInput, ProjectStatus } from '@cc/shared';

describe('Project schemas', () => {
  it('validates CreateProjectInput', () => {
    const result = CreateProjectInput.safeParse({
      name: 'My Project',
      description: 'Test description',
      areaId: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects CreateProjectInput with empty name', () => {
    const result = CreateProjectInput.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('validates UpdateProjectInput with status', () => {
    const result = UpdateProjectInput.safeParse({
      id: '00000000-0000-0000-0000-000000000001',
      status: 'completed',
    });
    expect(result.success).toBe(true);
  });

  it('validates all project statuses', () => {
    for (const status of ['active', 'completed', 'on_hold', 'archived']) {
      const result = ProjectStatus.safeParse(status);
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid project status', () => {
    const result = ProjectStatus.safeParse('invalid');
    expect(result.success).toBe(false);
  });

  it('allows optional fields in CreateProjectInput', () => {
    const result = CreateProjectInput.safeParse({ name: 'Minimal' });
    expect(result.success).toBe(true);
  });
});
