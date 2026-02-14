import { injectable, inject } from 'inversify';
import { eq } from 'drizzle-orm';
import { SYMBOLS } from '../di/symbols.js';
import { taskItems, taskAreas, taskProjects } from '../db/schema/tasks.js';
import { jiraSyncLog } from '../db/schema/jira.js';
import type { Database } from '../db/drizzle.js';

export interface JiraIssue {
  key: string;
  summary: string;
  status: string;
  statusCategory: string;
  priority: string;
  projectKey: string;
  projectName: string;
  url: string;
}

function mapStatusCategory(category: string): 'todo' | 'done' {
  return category === 'done' ? 'done' : 'todo';
}

function mapPriority(jiraPriority: string): number {
  const name = jiraPriority.toLowerCase();
  if (name === 'highest' || name === 'high') return 3;
  if (name === 'medium') return 2;
  if (name === 'low' || name === 'lowest') return 1;
  return 0;
}

@injectable()
export class JiraService {
  constructor(@inject(SYMBOLS.Database) private db: Database) {}

  isConfigured(): boolean {
    const { JIRA_URL, JIRA_EMAIL, JIRA_API_TOKEN } = process.env;
    return !!(JIRA_URL && JIRA_EMAIL && JIRA_API_TOKEN);
  }

  private async jiraFetch(path: string, init?: RequestInit) {
    const { JIRA_URL, JIRA_EMAIL, JIRA_API_TOKEN } = process.env;
    const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
    const res = await fetch(`${JIRA_URL}${path}`, {
      ...init,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`Jira API ${res.status}: ${text}`);
    }
    return res.json();
  }

  async getMyIssues(): Promise<JiraIssue[]> {
    const jql = 'assignee = currentUser() AND status != Done ORDER BY updated DESC';
    const data = await this.jiraFetch('/rest/api/3/search/jql', {
      method: 'POST',
      body: JSON.stringify({
        jql,
        maxResults: 50,
        fields: ['summary', 'status', 'priority', 'project', 'updated', 'assignee'],
      }),
    });

    const baseUrl = process.env.JIRA_URL!;
    return (data.issues ?? []).map((issue: any) => ({
      key: issue.key,
      summary: issue.fields.summary,
      status: issue.fields.status?.name ?? 'Unknown',
      statusCategory: issue.fields.status?.statusCategory?.key ?? 'undefined',
      priority: issue.fields.priority?.name ?? 'None',
      projectKey: issue.fields.project?.key ?? '',
      projectName: issue.fields.project?.name ?? '',
      url: `${baseUrl}/browse/${issue.key}`,
    }));
  }

  async syncAllIssues(): Promise<{ created: number; updated: number }> {
    const issues = await this.getMyIssues();
    const workArea = await this.ensureWorkArea();
    let created = 0;
    let updated = 0;

    for (const issue of issues) {
      const project = await this.ensureProject(issue.projectKey, issue.projectName, workArea.id);
      const result = await this.upsertTask(issue, workArea.id, project.id);
      if (result === 'created') created++;
      else updated++;
    }

    return { created, updated };
  }

  async syncSingleIssue(issueKey: string): Promise<void> {
    const data: any = await this.jiraFetch(
      `/rest/api/3/issue/${issueKey}?fields=summary,status,priority,project`
    );
    const baseUrl = process.env.JIRA_URL!;
    const issue: JiraIssue = {
      key: data.key,
      summary: data.fields.summary,
      status: data.fields.status?.name ?? 'Unknown',
      statusCategory: data.fields.status?.statusCategory?.key ?? 'undefined',
      priority: data.fields.priority?.name ?? 'None',
      projectKey: data.fields.project?.key ?? '',
      projectName: data.fields.project?.name ?? '',
      url: `${baseUrl}/browse/${data.key}`,
    };

    const workArea = await this.ensureWorkArea();
    const project = await this.ensureProject(issue.projectKey, issue.projectName, workArea.id);
    await this.upsertTask(issue, workArea.id, project.id);
  }

  async processWebhook(payload: any): Promise<void> {
    const webhookEvent = payload.webhookEvent as string | undefined;
    const issueKey = payload.issue?.key as string | undefined;
    const webhookId = payload.matchedWebhookIds?.[0]?.toString()
      ?? `${issueKey}-${Date.now()}`;

    if (!issueKey) return;

    // Dedup check
    const [existing] = await this.db
      .select()
      .from(jiraSyncLog)
      .where(eq(jiraSyncLog.webhookId, webhookId));
    if (existing) return;

    let action: 'created' | 'updated' | 'deleted' = 'updated';

    if (webhookEvent === 'jira:issue_deleted') {
      action = 'deleted';
      // Mark CC task as cancelled
      const [task] = await this.db
        .select()
        .from(taskItems)
        .where(eq(taskItems.externalKey, issueKey));
      if (task) {
        await this.db
          .update(taskItems)
          .set({ status: 'cancelled', updatedAt: new Date() })
          .where(eq(taskItems.id, task.id));
      }
    } else if (webhookEvent === 'jira:issue_created') {
      action = 'created';
      await this.syncSingleIssue(issueKey);
    } else {
      await this.syncSingleIssue(issueKey);
    }

    // Log for dedup
    await this.db.insert(jiraSyncLog).values({
      webhookId,
      issueKey,
      action,
    });
  }

  private async ensureWorkArea() {
    const [existing] = await this.db
      .select()
      .from(taskAreas)
      .where(eq(taskAreas.name, 'Work'));
    if (existing) return existing;

    const [area] = await this.db
      .insert(taskAreas)
      .values({ name: 'Work', icon: '💼', color: 'blue' })
      .returning();
    return area;
  }

  private async ensureProject(projectKey: string, projectName: string, areaId: string) {
    // Match by name prefixed with project key
    const name = `${projectKey}: ${projectName}`;
    const allProjects = await this.db.select().from(taskProjects);
    const existing = allProjects.find(p => p.name === name);
    if (existing) return existing;

    const [project] = await this.db
      .insert(taskProjects)
      .values({ name, areaId, icon: '🔧' })
      .returning();
    return project;
  }

  private async upsertTask(
    issue: JiraIssue,
    areaId: string,
    projectId: string
  ): Promise<'created' | 'updated'> {
    const [existing] = await this.db
      .select()
      .from(taskItems)
      .where(eq(taskItems.externalKey, issue.key));

    const taskData = {
      title: issue.summary,
      status: mapStatusCategory(issue.statusCategory),
      priority: mapPriority(issue.priority),
      source: 'jira' as const,
      externalKey: issue.key,
      externalUrl: issue.url,
      areaId,
      projectId,
      updatedAt: new Date(),
    };

    if (existing) {
      await this.db
        .update(taskItems)
        .set(taskData)
        .where(eq(taskItems.id, existing.id));
      return 'updated';
    }

    await this.db
      .insert(taskItems)
      .values(taskData)
      .returning();
    return 'created';
  }
}
