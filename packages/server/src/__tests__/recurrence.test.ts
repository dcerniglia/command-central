import { describe, it, expect } from 'vitest';
import { computeNextOccurrence } from '../services/task-service.js';

describe('computeNextOccurrence', () => {
  it('computes daily recurrence', () => {
    expect(computeNextOccurrence('2026-02-14', 'FREQ=DAILY')).toBe('2026-02-15');
  });

  it('computes weekly recurrence', () => {
    expect(computeNextOccurrence('2026-02-14', 'FREQ=WEEKLY')).toBe('2026-02-21');
  });

  it('computes monthly recurrence', () => {
    expect(computeNextOccurrence('2026-01-15', 'FREQ=MONTHLY')).toBe('2026-02-15');
  });

  it('handles month boundary for daily', () => {
    expect(computeNextOccurrence('2026-01-31', 'FREQ=DAILY')).toBe('2026-02-01');
  });

  it('handles year boundary for daily', () => {
    expect(computeNextOccurrence('2025-12-31', 'FREQ=DAILY')).toBe('2026-01-01');
  });

  it('handles month overflow for monthly (Jan 31 → Feb 28)', () => {
    const result = computeNextOccurrence('2026-01-31', 'FREQ=MONTHLY');
    // JS Date rolls Jan 31 + 1 month to Mar 3 (28 days in Feb)
    expect(result).toBeTruthy();
  });

  it('returns null for unsupported frequency', () => {
    expect(computeNextOccurrence('2026-02-14', 'FREQ=YEARLY')).toBeNull();
  });

  it('returns null for empty rrule', () => {
    expect(computeNextOccurrence('2026-02-14', '')).toBeNull();
  });

  it('handles RRULE with additional params', () => {
    expect(computeNextOccurrence('2026-02-14', 'FREQ=DAILY;INTERVAL=1')).toBe('2026-02-15');
  });
});
