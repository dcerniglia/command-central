function getConfig() {
  return {
    url: process.env.JIRA_URL ?? '',
    email: process.env.JIRA_EMAIL ?? '',
    token: process.env.JIRA_API_TOKEN ?? '',
  };
}

async function jiraFetch(path: string, init?: RequestInit) {
  const { url, email, token } = getConfig();
  const auth = Buffer.from(`${email}:${token}`).toString('base64');
  const res = await fetch(`${url}${path}`, {
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

export interface JiraIssue {
  key: string;
  summary: string;
  status: string;
  statusCategory: string;
  priority: string;
  projectKey: string;
  projectName: string;
  updated: string;
  assignee: string | null;
}

export async function getMyIssues(): Promise<JiraIssue[]> {
  const jql = 'assignee = currentUser() AND status != Done ORDER BY updated DESC';
  const data = await jiraFetch('/rest/api/3/search/jql', {
    method: 'POST',
    body: JSON.stringify({
      jql,
      maxResults: 50,
      fields: ['summary', 'status', 'priority', 'project', 'updated', 'assignee'],
    }),
  });

  return (data.issues ?? []).map((issue: any) => ({
    key: issue.key,
    summary: issue.fields.summary,
    status: issue.fields.status?.name ?? 'Unknown',
    statusCategory: issue.fields.status?.statusCategory?.key ?? 'undefined',
    priority: issue.fields.priority?.name ?? 'None',
    projectKey: issue.fields.project?.key ?? '',
    projectName: issue.fields.project?.name ?? '',
    updated: issue.fields.updated,
    assignee: issue.fields.assignee?.displayName ?? null,
  }));
}

export async function getIssue(key: string): Promise<JiraIssue> {
  const issue: any = await jiraFetch(`/rest/api/3/issue/${key}?fields=summary,status,priority,project,updated,assignee`);
  return {
    key: issue.key,
    summary: issue.fields.summary,
    status: issue.fields.status?.name ?? 'Unknown',
    statusCategory: issue.fields.status?.statusCategory?.key ?? 'undefined',
    priority: issue.fields.priority?.name ?? 'None',
    projectKey: issue.fields.project?.key ?? '',
    projectName: issue.fields.project?.name ?? '',
    updated: issue.fields.updated,
    assignee: issue.fields.assignee?.displayName ?? null,
  };
}

export function isConfigured(): boolean {
  const { url, email, token } = getConfig();
  return !!(url && email && token);
}
