const BASE_URL = 'https://api.harvestapp.com/v2';

function getConfig() {
  return {
    accountId: process.env.HARVEST_ACCOUNT_ID ?? '',
    accessToken: process.env.HARVEST_ACCESS_TOKEN ?? '',
  };
}

async function harvestFetch(path: string, init?: RequestInit) {
  const { accountId, accessToken } = getConfig();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Harvest-Account-ID': accountId,
      'Content-Type': 'application/json',
      'User-Agent': 'Command Central',
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Harvest API ${res.status}: ${text}`);
  }
  return res.json();
}

export interface HarvestProject {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
  client: { id: number; name: string } | null;
}

export interface HarvestTaskAssignment {
  id: number;
  task: { id: number; name: string };
  is_active: boolean;
}

export interface HarvestTimeEntry {
  id: number;
  hours: number;
  notes: string | null;
  spent_date: string;
  is_running: boolean;
  project: { id: number; name: string };
  task: { id: number; name: string };
  user: { id: number; name: string };
}

export async function getProjectAssignments(): Promise<Array<{ project: HarvestProject; taskAssignments: HarvestTaskAssignment[] }>> {
  // Paginate through all assignments
  let allAssignments: any[] = [];
  let page = 1;
  while (true) {
    const data = await harvestFetch(`/users/me/project_assignments?per_page=100&page=${page}`);
    allAssignments.push(...(data.project_assignments ?? []));
    if (!data.next_page) break;
    page++;
  }
  const assignments = allAssignments;

  return assignments
    .filter((a: any) => a.is_active)
    .map((a: any) => ({
      project: {
        id: a.project.id,
        name: a.project.name,
        code: a.project.code ?? '',
        is_active: a.project.is_active,
        client: a.client ? { id: a.client.id, name: a.client.name } : null,
      },
      taskAssignments: (a.task_assignments ?? [])
        .filter((ta: any) => ta.is_active)
        .map((ta: any) => ({
          id: ta.id,
          task: { id: ta.task.id, name: ta.task.name },
          is_active: ta.is_active,
        })),
    }));
}

export async function getTodayTimeEntries(): Promise<HarvestTimeEntry[]> {
  const today = new Date().toISOString().slice(0, 10);
  const data = await harvestFetch(`/time_entries?from=${today}&to=${today}&per_page=100`);
  return (data.time_entries ?? []).map((e: any) => ({
    id: e.id,
    hours: e.hours,
    notes: e.notes,
    spent_date: e.spent_date,
    is_running: e.is_running,
    project: { id: e.project.id, name: e.project.name },
    task: { id: e.task.id, name: e.task.name },
    user: { id: e.user.id, name: e.user.name },
  }));
}

export async function createTimeEntry(data: {
  project_id: number;
  task_id: number;
  spent_date: string;
  hours: number;
  notes?: string;
}): Promise<HarvestTimeEntry> {
  const entry: any = await harvestFetch('/time_entries', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return {
    id: entry.id,
    hours: entry.hours,
    notes: entry.notes,
    spent_date: entry.spent_date,
    is_running: entry.is_running,
    project: { id: entry.project.id, name: entry.project.name },
    task: { id: entry.task.id, name: entry.task.name },
    user: { id: entry.user.id, name: entry.user.name },
  };
}

export async function getCurrentUser(): Promise<{ id: number; first_name: string; last_name: string }> {
  const user = await harvestFetch('/users/me');
  return { id: user.id, first_name: user.first_name, last_name: user.last_name };
}

export function isConfigured(): boolean {
  const { accountId, accessToken } = getConfig();
  return !!(accountId && accessToken);
}
