import { DailyStats, HarvestTimeEntry } from '../api/client';

interface Props {
  stats: DailyStats | null;
  harvestToday: HarvestTimeEntry[];
}

export default function NotificationBar({ stats, harvestToday }: Props) {
  if (!stats) return null;

  const items: { label: string; color: string }[] = [];

  if (stats.tasksDueToday > 0) {
    items.push({ label: `${stats.tasksDueToday} task${stats.tasksDueToday > 1 ? 's' : ''} due today`, color: 'text-amber-400' });
  }

  // Local time logged
  const hours = Math.floor(stats.minutesLogged / 60);
  const mins = Math.round(stats.minutesLogged % 60);
  const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  items.push({
    label: `${timeStr} local time`,
    color: stats.minutesLogged === 0 ? 'text-gray-500' : 'text-green-400',
  });

  // Harvest time logged
  const harvestHours = stats.harvestHoursToday;
  const hh = Math.floor(harvestHours);
  const hm = Math.round((harvestHours - hh) * 60);
  const harvestStr = hh > 0 ? `${hh}h ${hm}m` : `${hm}m`;
  items.push({
    label: `${harvestStr} in Harvest`,
    color: harvestHours === 0 ? 'text-red-400' : 'text-orange-400',
  });

  if (stats.tasksCompletedToday > 0) {
    items.push({ label: `${stats.tasksCompletedToday} completed today`, color: 'text-green-400' });
  }

  return (
    <div className="flex items-center gap-6 bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className={`w-1.5 h-1.5 rounded-full ${item.color.replace('text-', 'bg-')}`} />
          <span className={item.color}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
