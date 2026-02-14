import { TimeEntry, Task } from '../api/client';

interface Props {
  activeTimer: TimeEntry | null;
  elapsedSeconds: number;
  tasks: Task[];
  onStop: () => void;
}

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

export default function ActiveTimer({ activeTimer, elapsedSeconds, tasks, onStop }: Props) {
  if (!activeTimer) return null;

  const task = tasks.find((t) => t.id === activeTimer.task_id);

  return (
    <div className="flex items-center gap-3 bg-indigo-600/20 border border-indigo-500/30 rounded-lg px-4 py-2">
      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      <span className="text-sm text-gray-300 truncate max-w-[200px]">
        {task ? task.title : 'Tracking time'}
      </span>
      <span className="font-mono text-lg font-semibold text-indigo-300">{formatTime(elapsedSeconds)}</span>
      <button
        onClick={onStop}
        className="ml-1 bg-red-600/80 hover:bg-red-600 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
      >
        Stop
      </button>
    </div>
  );
}
