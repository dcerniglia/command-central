import { useState } from 'react';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';
import {
  Inbox, CalendarDays, CalendarClock, ListChecks,
  ChevronRight, Plus, FolderOpen, MapPin, Layers,
  Crosshair, RefreshCw, CircleOff,
} from 'lucide-react';

type ViewKey = 'inbox' | 'today' | 'upcoming' | 'all';
type SpecialFilter = 'noProject' | 'noArea';

interface TaskSidebarProps {
  activeView: ViewKey | null;
  activeListId: string | null;
  activeAreaId: string | null;
  activeProjectId: string | null;
  activeSpecialFilter: SpecialFilter | null;
  focusAreaId: string | null;
  onViewChange: (view: ViewKey) => void;
  onListSelect: (listId: string) => void;
  onAreaSelect: (areaId: string) => void;
  onProjectSelect: (projectId: string) => void;
  onSpecialFilter: (filter: SpecialFilter) => void;
  onFocusArea: (areaId: string | null) => void;
}

const smartViews = [
  { key: 'inbox' as const, label: 'Inbox', icon: Inbox },
  { key: 'today' as const, label: 'Today', icon: CalendarDays },
  { key: 'upcoming' as const, label: 'Upcoming', icon: CalendarClock },
  { key: 'all' as const, label: 'All', icon: ListChecks },
];

export default function TaskSidebar({
  activeView, activeListId, activeAreaId, activeProjectId, activeSpecialFilter, focusAreaId,
  onViewChange, onListSelect, onAreaSelect, onProjectSelect, onSpecialFilter, onFocusArea,
}: TaskSidebarProps) {
  const { data: areas = [] } = trpc.tasks.areas.list.useQuery();
  const { data: lists = [] } = trpc.tasks.lists.list.useQuery();
  const { data: projects = [] } = trpc.tasks.projects.list.useQuery();
  const utils = trpc.useUtils();

  const createArea = trpc.tasks.areas.create.useMutation({
    onSuccess: () => utils.tasks.areas.list.invalidate(),
  });
  const createList = trpc.tasks.lists.create.useMutation({
    onSuccess: () => utils.tasks.lists.list.invalidate(),
  });
  const createProject = trpc.tasks.projects.create.useMutation({
    onSuccess: () => utils.tasks.projects.list.invalidate(),
  });

  const [newAreaName, setNewAreaName] = useState('');
  const [showNewArea, setShowNewArea] = useState(false);
  const [newListAreaId, setNewListAreaId] = useState<string | null>(null);
  const [newListName, setNewListName] = useState('');
  const [newProjectAreaId, setNewProjectAreaId] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());

  const { data: jiraStatus } = trpc.jira.status.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  const jiraSync = trpc.jira.sync.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
      utils.tasks.areas.list.invalidate();
      utils.tasks.projects.list.invalidate();
    },
  });

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

  function handleCreateProject(areaId: string | null) {
    const name = newProjectName.trim();
    if (!name) return;
    createProject.mutate({ name, areaId });
    setNewProjectName('');
    setNewProjectAreaId(null);
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
        {/* Unassigned filters */}
        {(['noProject', 'noArea'] as const).map((key) => (
          <button
            key={key}
            onClick={() => onSpecialFilter(key)}
            className={cn(
              'flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-body transition-colors duration-150',
              activeSpecialFilter === key
                ? 'bg-primary/15 text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-overlay',
            )}
          >
            <CircleOff className="h-4 w-4 flex-shrink-0" />
            <span>{key === 'noProject' ? 'No Project' : 'No Area'}</span>
          </button>
        ))}
      </div>

      {/* Jira sync */}
      {jiraStatus?.configured && (
        <div className="px-2 pb-1">
          <button
            onClick={() => jiraSync.mutate()}
            disabled={jiraSync.isPending}
            className={cn(
              'flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md text-body transition-colors duration-150',
              'text-muted-foreground hover:text-foreground hover:bg-surface-overlay',
              jiraSync.isPending && 'opacity-50 cursor-wait',
            )}
          >
            <RefreshCw className={cn('h-4 w-4 flex-shrink-0', jiraSync.isPending && 'animate-spin')} />
            <span>{jiraSync.isPending ? 'Syncing...' : 'Sync Jira'}</span>
          </button>
        </div>
      )}

      <div className="mx-2 my-2 border-t border-border" />

      {/* Focus mode indicator */}
      {focusAreaId && (
        <div className="px-2 pb-1">
          <button
            onClick={() => onFocusArea(null)}
            className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md text-body text-primary bg-primary/10 hover:bg-primary/15 transition-colors"
          >
            <Crosshair className="h-4 w-4" />
            <span>All Areas</span>
          </button>
        </div>
      )}

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

        {areas.filter((a: any) => !focusAreaId || a.id === focusAreaId).map((area: any) => {
          const areaLists = lists.filter((l: any) => l.areaId === area.id);
          const areaProjects = projects.filter((p: any) => p.areaId === area.id);
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
                  onClick={() => onFocusArea(focusAreaId === area.id ? null : area.id)}
                  className={cn(
                    'p-1 rounded transition-colors',
                    focusAreaId === area.id
                      ? 'text-primary'
                      : 'text-muted-foreground/0 hover:text-muted-foreground',
                  )}
                  title={focusAreaId === area.id ? 'Clear focus' : 'Focus on this area'}
                >
                  <Crosshair className="h-3 w-3" />
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

                  {areaProjects.map((project: any) => (
                    <button
                      key={project.id}
                      onClick={() => onProjectSelect(project.id)}
                      className={cn(
                        'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-body transition-colors duration-150',
                        activeProjectId === project.id
                          ? 'bg-primary/15 text-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-surface-overlay',
                      )}
                    >
                      <Layers className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{project.name}</span>
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

                  {newProjectAreaId === area.id && (
                    <input
                      autoFocus
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateProject(area.id);
                        if (e.key === 'Escape') { setNewProjectAreaId(null); setNewProjectName(''); }
                      }}
                      onBlur={() => { setNewProjectAreaId(null); setNewProjectName(''); }}
                      placeholder="Project name..."
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
