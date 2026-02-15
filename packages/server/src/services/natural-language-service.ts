import { injectable, inject } from 'inversify';
import Anthropic from '@anthropic-ai/sdk';
import { SYMBOLS } from '../di/symbols.js';
import { ProjectRepository } from './project-repository.js';
import { TagRepository } from './tag-repository.js';
import { AreaRepository } from './area-repository.js';
import type { ParsedTaskPreview } from '@cc/shared';

const TOOL_NAME = 'extract_task';

const extractTaskTool: Anthropic.Tool = {
  name: TOOL_NAME,
  description: 'Extract structured task data from natural language input.',
  input_schema: {
    type: 'object' as const,
    properties: {
      title: {
        type: 'string',
        description: 'The core task title, cleaned up from the raw input. Remove any date, priority, tag, or project markers.',
      },
      notes: {
        type: ['string', 'null'],
        description: 'Additional notes or context if the input contains extra detail beyond the title.',
      },
      projectName: {
        type: ['string', 'null'],
        description: 'Project name if mentioned (e.g. after "project:" or contextually implied). Use the exact name from the available projects list if it matches.',
      },
      tagNames: {
        type: 'array',
        items: { type: 'string' },
        description: 'Tag names extracted from #hashtags or contextual cues. Use exact names from the available tags list if they match.',
      },
      priority: {
        type: 'number',
        description: 'Priority level: 0=none, 1=low, 2=medium, 3=high/urgent. Infer from words like "urgent", "high priority", "low priority", etc.',
      },
      dueDate: {
        type: ['string', 'null'],
        description: 'Due date in YYYY-MM-DD format. Resolve relative dates like "tomorrow", "next Tuesday", "Friday" relative to the current date provided.',
      },
      startDate: {
        type: ['string', 'null'],
        description: 'Start date in YYYY-MM-DD format if mentioned (e.g. "starting Monday").',
      },
      dueTime: {
        type: ['string', 'null'],
        description: 'Due time in HH:mm format (24h) if a specific time is mentioned.',
      },
      estimateMinutes: {
        type: ['number', 'null'],
        description: 'Estimated duration in minutes if mentioned (e.g. "30 min", "2 hours").',
      },
    },
    required: ['title', 'tagNames', 'priority'],
  },
};

@injectable()
export class NaturalLanguageService {
  private client: Anthropic | null = null;

  constructor(
    @inject(SYMBOLS.ProjectRepository) private projectRepo: ProjectRepository,
    @inject(SYMBOLS.TagRepository) private tagRepo: TagRepository,
    @inject(SYMBOLS.AreaRepository) private areaRepo: AreaRepository,
  ) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      this.client = new Anthropic({ apiKey });
    }
  }

  async parse(text: string): Promise<ParsedTaskPreview> {
    if (!this.client) {
      return {
        title: text,
        notes: null,
        projectId: null,
        projectName: null,
        tagIds: [],
        tagNames: [],
        priority: 0,
        dueDate: null,
        startDate: null,
        dueTime: null,
        estimateMinutes: null,
      };
    }

    const [projects, tags] = await Promise.all([
      this.projectRepo.list(),
      this.tagRepo.list(),
    ]);

    const today = new Date().toISOString().split('T')[0];
    const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    const systemPrompt = `You are a task parser. Extract structured task data from the user's natural language input.

Current date: ${today} (${dayOfWeek})

Available projects: ${projects.map((p) => p.name).join(', ') || 'none'}
Available tags: ${tags.map((t) => t.name).join(', ') || 'none'}

Rules:
- Extract a clean title without date/priority/tag markers
- Match project and tag names to the available lists (fuzzy match OK, e.g. "errands" matches "Errands")
- If a #hashtag doesn't match an existing tag, still include it in tagNames
- Resolve relative dates (tomorrow, next Tuesday, etc.) to absolute YYYY-MM-DD dates
- Only set priority if explicitly mentioned (default 0)
- Extract time if mentioned (e.g. "2pm" → "14:00")
- Extract duration estimates if mentioned (e.g. "30 min" → 30)`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: systemPrompt,
      tools: [extractTaskTool],
      tool_choice: { type: 'tool', name: TOOL_NAME },
      messages: [{ role: 'user', content: text }],
    });

    const toolBlock = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
    );

    if (!toolBlock) {
      return {
        title: text,
        notes: null,
        projectId: null,
        projectName: null,
        tagIds: [],
        tagNames: [],
        priority: 0,
        dueDate: null,
        startDate: null,
        dueTime: null,
        estimateMinutes: null,
      };
    }

    const parsed = toolBlock.input as {
      title: string;
      notes?: string | null;
      projectName?: string | null;
      tagNames: string[];
      priority: number;
      dueDate?: string | null;
      startDate?: string | null;
      dueTime?: string | null;
      estimateMinutes?: number | null;
    };

    // Resolve project name to ID (case-insensitive)
    let projectId: string | null = null;
    let projectName: string | null = parsed.projectName ?? null;
    if (projectName) {
      const match = projects.find(
        (p) => p.name.toLowerCase() === projectName!.toLowerCase(),
      );
      if (match) {
        projectId = match.id;
        projectName = match.name;
      }
    }

    // Resolve tag names to IDs (case-insensitive)
    const tagIds: string[] = [];
    const tagNames: string[] = [];
    for (const name of parsed.tagNames) {
      const match = tags.find(
        (t) => t.name.toLowerCase() === name.toLowerCase(),
      );
      if (match) {
        tagIds.push(match.id);
        tagNames.push(match.name);
      } else {
        tagNames.push(name);
      }
    }

    return {
      title: parsed.title,
      notes: parsed.notes ?? null,
      projectId,
      projectName,
      tagIds,
      tagNames,
      priority: Math.min(3, Math.max(0, parsed.priority)),
      dueDate: parsed.dueDate ?? null,
      startDate: parsed.startDate ?? null,
      dueTime: parsed.dueTime ?? null,
      estimateMinutes: parsed.estimateMinutes ?? null,
    };
  }
}
