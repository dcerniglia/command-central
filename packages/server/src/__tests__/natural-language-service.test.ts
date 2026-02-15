import { describe, it, expect, vi, beforeEach } from 'vitest';
import 'reflect-metadata';
import { NaturalLanguageService } from '../services/natural-language-service.js';

const mockCreate = vi.fn();

// Mock the Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = { create: mockCreate };
    },
  };
});

function createMockRepos() {
  const projectRepo = {
    list: vi.fn().mockResolvedValue([
      { id: 'proj-1', name: 'Home', status: 'active' },
      { id: 'proj-2', name: 'Work', status: 'active' },
    ]),
  } as any;

  const tagRepo = {
    list: vi.fn().mockResolvedValue([
      { id: 'tag-1', name: 'health' },
      { id: 'tag-2', name: 'errands' },
    ]),
  } as any;

  const areaRepo = {
    list: vi.fn().mockResolvedValue([]),
  } as any;

  return { projectRepo, tagRepo, areaRepo };
}

describe('NaturalLanguageService', () => {
  describe('without API key', () => {
    it('returns raw text as title with processed=false shape', async () => {
      // No ANTHROPIC_API_KEY set
      delete process.env.ANTHROPIC_API_KEY;
      const { projectRepo, tagRepo, areaRepo } = createMockRepos();
      const service = new NaturalLanguageService(projectRepo, tagRepo, areaRepo);

      const result = await service.parse('Buy groceries tomorrow');

      expect(result.title).toBe('Buy groceries tomorrow');
      expect(result.projectId).toBeNull();
      expect(result.tagIds).toEqual([]);
      expect(result.priority).toBe(0);
      expect(result.dueDate).toBeNull();
    });
  });

  describe('with API key', () => {
    let service: NaturalLanguageService;

    beforeEach(() => {
      process.env.ANTHROPIC_API_KEY = 'test-key';
      mockCreate.mockReset();
      const { projectRepo, tagRepo, areaRepo } = createMockRepos();
      service = new NaturalLanguageService(projectRepo, tagRepo, areaRepo);
    });

    it('resolves project name to ID', async () => {
      mockCreate.mockResolvedValue({
        content: [{
          type: 'tool_use',
          id: 'call-1',
          name: 'extract_task',
          input: {
            title: 'Fix the sink',
            projectName: 'Home',
            tagNames: [],
            priority: 0,
          },
        }],
      });

      const result = await service.parse('Fix the sink project:Home');

      expect(result.title).toBe('Fix the sink');
      expect(result.projectId).toBe('proj-1');
      expect(result.projectName).toBe('Home');
    });

    it('resolves tag names to IDs (case-insensitive)', async () => {
      mockCreate.mockResolvedValue({
        content: [{
          type: 'tool_use',
          id: 'call-1',
          name: 'extract_task',
          input: {
            title: 'Schedule dentist',
            tagNames: ['Health'],
            priority: 2,
          },
        }],
      });

      const result = await service.parse('Schedule dentist #Health medium priority');

      expect(result.tagIds).toEqual(['tag-1']);
      expect(result.tagNames).toEqual(['health']);
      expect(result.priority).toBe(2);
    });

    it('keeps unmatched tags in tagNames without IDs', async () => {
      mockCreate.mockResolvedValue({
        content: [{
          type: 'tool_use',
          id: 'call-1',
          name: 'extract_task',
          input: {
            title: 'Buy gifts',
            tagNames: ['shopping', 'health'],
            priority: 0,
          },
        }],
      });

      const result = await service.parse('Buy gifts #shopping #health');

      expect(result.tagIds).toEqual(['tag-1']); // only health matched
      expect(result.tagNames).toEqual(['shopping', 'health']); // both in display names
    });

    it('extracts dates and times', async () => {
      mockCreate.mockResolvedValue({
        content: [{
          type: 'tool_use',
          id: 'call-1',
          name: 'extract_task',
          input: {
            title: 'Dentist appointment',
            tagNames: [],
            priority: 0,
            dueDate: '2026-02-17',
            dueTime: '14:00',
            estimateMinutes: 60,
          },
        }],
      });

      const result = await service.parse('Dentist appointment next Tuesday 2pm 1 hour');

      expect(result.dueDate).toBe('2026-02-17');
      expect(result.dueTime).toBe('14:00');
      expect(result.estimateMinutes).toBe(60);
    });

    it('clamps priority to 0-3 range', async () => {
      mockCreate.mockResolvedValue({
        content: [{
          type: 'tool_use',
          id: 'call-1',
          name: 'extract_task',
          input: {
            title: 'Test',
            tagNames: [],
            priority: 5,
          },
        }],
      });

      const result = await service.parse('Test');
      expect(result.priority).toBe(3);
    });

    it('handles missing tool_use block gracefully', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'Sorry, I could not parse that.' }],
      });

      const result = await service.parse('gibberish input');

      expect(result.title).toBe('gibberish input');
      expect(result.projectId).toBeNull();
    });
  });
});
