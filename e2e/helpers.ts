const API = 'http://localhost:3001/api';

let counter = 0;

/** Generate a unique suffix for test data to avoid slug collisions */
export function unique(base: string): string {
  return `${base} ${Date.now()}-${++counter}`;
}

export async function resetDatabase() {
  // Stop any active timer
  await fetch(`${API}/timer/stop`, { method: 'POST' }).catch(() => {});

  // Delete all tasks
  const tasks: { id: string }[] = await fetch(`${API}/tasks`).then((r) => r.json());
  for (const t of tasks) {
    await fetch(`${API}/tasks/${t.id}`, { method: 'DELETE' });
  }
}

export async function createProjectViaApi(name: string, color = '#6366f1') {
  const res = await fetch(`${API}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, color }),
  });
  if (!res.ok) {
    throw new Error(`Failed to create project: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export async function createTaskViaApi(title: string, projectId?: string) {
  const res = await fetch(`${API}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, project_id: projectId || null }),
  });
  if (!res.ok) {
    throw new Error(`Failed to create task: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export async function startTimerViaApi(taskId: string, projectId?: string) {
  const res = await fetch(`${API}/timer/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task_id: taskId, project_id: projectId || null }),
  });
  if (!res.ok) {
    throw new Error(`Failed to start timer: ${res.status} ${await res.text()}`);
  }
  return res.json();
}
