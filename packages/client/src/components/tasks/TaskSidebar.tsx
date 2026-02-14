import { useState } from 'react';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';
import {
  Inbox, CalendarDays, CalendarClock, ListChecks,
  ChevronRight, Plus, FolderOpen, MapPin,
} from 'lucide-react';

type ViewKey = 'inbox' | 'today' | 'upcoming' | 'all';

interface TaskSidebarProps {
  activeView: ViewKey | null;
  activeListId: string | null;
  activeAreaId: string | null;
  onViewChange: (view: ViewKey) => void;
  onListSelect: (listId: string) => void;
  onAreaSelect: (areaId: string) => void;
}

const smartViews = [
  { key: 'inbox' as const, label: 'Inbox', icon: Inbox },
  { key: 'today' as const, label: 'Today', icon: CalendarDays },
  { key: 'upcoming' as const, label: 'Upcoming', icon: CalendarClock },
  { key: 'all' as const, label: 'All', icon: ListChecks },
];

export default function TaskSidebar({
  activeView, activeListId, activeAreaId,
  onViewChange, onListSelect, onAreaSelect,
}: TaskSidebarProps) {
  const { data: areas = [] } = trpc.tasks.areas.list.useQuery();
  const { data: lists = [] } = trpc.tasks.lists.list.useQuery();
  const utils = trpc.useUtils();

  const createArea = trpc.tasks.areas.create.useMutation({
    onSuccess: () => utils.tasks.areas.list.invalidate(),
  });
  const createList = trpc.tasks.lists.create.useMutation({
    onSuccess: () => utils.tasks.lists.list.invalidate(),
  });

  const [newAreaName, setNewAreaName] = useState('');
  const [showNewArea, setShowNewArea] = useState(false);
  const [newListAreaId, setNewListAreaId] = useState<string | null>(null);
  const [newListName, setNewListName] = useState('');
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());

  function toggleArea(areaId: string) {
    setExpandedAreas((prev) => {
      const next = new Set(prev);
      if (next.has(areaId)) next.delete(areaId);
      else next.add(areaId);
      return next;
    });
  }

  function handleCreateArea() {
    const name = newAreaName.trim();
    if (!name) return;
    createArea.mutate({ name });
    setNewAreaName('');
    setShowNewArea(false);
  }

  function handleCreateList(areaId: string | null) {
    const name = newListName.trim();
    if (!name) return;
    createList.mutate({ name, areaId });
    setNewListName('');
    setNewListAreaId(null);
  }

  const unassignedLists = lists.filter((l: any) => !l.areaId);

  return (
    <div className="w-52 flex-shrink-0 border-r border-border bg-surface-root overflow-y-auto">
      {/* Smart views */}
      <div className="p-2 space-y-0.5">
        {smartViews.map((view) => (
          <button
            key={view.key}
            onClick={() => onViewChange(view.key)}
            className={cn(
              'flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-body transition-colors duration-150',
              activeView === view.key && !activeListId && !activeAreaId
                ? 'bg-primary/15 text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-overlay',
            )}
          >
            <view.icon className="h-4 w-4 flex-shrink-0" />
            <span>{view.label}</span>
          </button>
        ))}
      </div>

      <div className="mx-2 my-2 border-t border-border" />

      {/* Areas with nested lists */}
      <div className="p-2 space-y-1">
        <div className="flex items-center justify-between px-2.5 mb-1">
          <span className="text-overline text-muted-foreground uppercase tracking-wider">Areas</span>
          <button
            onClick={() => setShowNewArea(true)}
            className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {showNewArea && (
          <div className="px-2.5">
            <input
              autoFocus
              value={newAreaName}
              onChange={(e) => setNewAreaName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateArea();
                if (e.key === 'Escape') { setShowNewArea(false); setNewAreaName(''); }
              }}
              onBlur={() => { setShowNewArea(false); setNewAreaName(''); }}
              placeholder="Area name..."
              className="w-full bg-surface-raised text-body text-foreground placeholder:text-muted-foreground/50 px-2 py-1 rounded border border-border focus:outline-none focus:border-primary/50"
            />
          </div>
        )}

        {areas.map((area: any) => {
          const areaLists = lists.filter((l: any) => l.areaId === area.id);
          const expanded = expandedAreas.has(area.id);

          return (
            <div key={area.id}>
              <div className="flex items-center">
                <button
                  onClick={() => toggleArea(area.id)}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronRight className={cn('h-3 w-3 transition-transform', expanded && 'rotate-90')} />
                </button>
                <button
                  onClick={() => onAreaSelect(area.id)}
                  className={cn(
                    'flex items-center gap-2 flex-1 px-1.5 py-1.5 rounded-md text-body transition-colors duration-150 min-w-0',
                    activeAreaId === area.id
                      ? 'bg-primary/15 text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-surface-overlay',
                  )}
                >
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{area.name}</span>
                </button>
                <button
                  onClick={() => { setNewListAreaId(area.id); setExpandedAreas((p) => new Set(p).add(area.id)); }}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                  title="Add list"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>

              {expanded && (
                <div className="ml-5 space-y-0.5">
                  {areaLists.map((list: any) => (
                    <button
                      key={list.id}
                      onClick={() => onListSelect(list.id)}
                      className={cn(
                        'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-body transition-colors duration-150',
                        activeListId === list.id
                          ? 'bg-primary/15 text-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-surface-overlay',
                      )}
                    >
                      <FolderOpen className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{list.name}</span>
                    </button>
                  ))}

                  {newListAreaId === area.id && (
                    <input
                      autoFocus
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateList(area.id);
                        if (e.key === 'Escape') { setNewListAreaId(null); setNewListName(''); }
                      }}
                      onBlur={() => { setNewListAreaId(null); setNewListName(''); }}
                      placeholder="List name..."
                      className="w-full bg-surface-raised text-body text-foreground placeholder:text-muted-foreground/50 px-2 py-1 rounded border border-border focus:outline-none focus:border-primary/50"
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Unassigned lists */}
        {unassignedLists.length > 0 && (
          <>
            <div className="mx-2.5 my-1 border-t border-border" />
            {unassignedLists.map((list: any) => (
              <button
                key={list.id}
                onClick={() => onListSelect(list.id)}
                className={cn(
                  'flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md text-body transition-colors duration-150',
                  activeListId === list.id
                    ? 'bg-primary/15 text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-surface-overlay',
                )}
              >
                <FolderOpen className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{list.name}</span>
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
