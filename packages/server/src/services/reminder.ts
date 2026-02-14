import db from '../db.js';

interface TimeEntry {
  id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
}

interface Task {
  id: string;
  title: string;
  due_date: string | null;
  status: string;
  project_id: string | null;
}

export function getIdleStatus() {
  const active = db.prepare('SELECT * FROM time_entries WHERE ended_at IS NULL').get() as TimeEntry | undefined;
  if (active) {
    const startedAt = new Date(active.started_at + 'Z').getTime();
    const minutesElapsed = (Date.now() - startedAt) / 60000;
    return { idle: false, activeTimer: active, minutesElapsed: Math.round(minutesElapsed * 100) / 100 };
  }
  const last = db.prepare('SELECT * FROM time_entries ORDER BY ended_at DESC LIMIT 1').get() as TimeEntry | undefined;
  if (!last?.ended_at) {
    return { idle: true, minutesSinceLastActivity: null };
  }
  const endedAt = new Date(last.ended_at + 'Z').getTime();
  const minutesSince = (Date.now() - endedAt) / 60000;
  return { idle: true, minutesSinceLastActivity: Math.round(minutesSince * 100) / 100 };
}

export function getDailyStats() {
  const today = new Date().toISOString().slice(0, 10);
  const totalMinutes = db.prepare(
    "SELECT COALESCE(SUM(duration_minutes), 0) as total FROM time_entries WHERE date(started_at) = ?"
  ).get(today) as { total: number };
  const completedTasks = db.prepare(
    "SELECT COUNT(*) as count FROM tasks WHERE date(completed_at) = ?"
  ).get(today) as { count: number };
  return {
    totalMinutesLogged: Math.round(totalMinutes.total * 100) / 100,
    tasksCompleted: completedTasks.count,
  };
}

export function getDueTasksToday() {
  const today = new Date().toISOString().slice(0, 10);
  return db.prepare(
    "SELECT * FROM tasks WHERE due_date = ? AND status != 'done' ORDER BY priority ASC"
  ).all(today) as Task[];
}
