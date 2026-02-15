import { useState, type DragEvent } from 'react';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';
import {
  Inbox, CalendarDays, CalendarClock, ListChecks,
  ChevronRight, Plus, MapPin, Layers, CircleOff,
  Crosshair, RefreshCw, Tag, X,
} from 'lucide-react';

type ViewKey = 'inbox' | 'today' | 'upcoming' | 'all';

interface TaskSidebarProps {
  activeView: ViewKey | null;
  activeProjectId: string | null;
  activeAreaId: string | null;
  noProjectFilter: boolean;
  focusAreaId: string | null;
  onViewChange: (view: ViewKey) => void;
  onProjectSelect: (projectId: string) => void;
  onAreaSelect: (areaId: string) => void;
  onNoProjectFilter: () => void;
  onFocusArea: (areaId: string | null) => void;
  onDropTaskToProject?: (taskId: string, projectId: string) => void;
}

function useDropTarget(onDrop: (taskId: string) => void) {
  const [isOver, setIsOver] = useState(false);
  return {
    isOver,
    handlers: {
      onDragOver: (e: DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setIsOver(true); },
      onDragEnter: (e: DragEvent) => { e.preventDefault(); setIsOver(true); },
      onDragLeave: () => setIsOver(false),
      onDrop: (e: DragEvent) => {
        e.preventDefault();
        setIsOver(false);
        const taskId = e.dataTransfer.getData('text/plain');
        if (taskId) onDrop(taskId);
      },
    },
  };
}

function ProjectDropButton({
  project,
  isActive,
  onClick,
  onDropTask,
  className: extraClassName,
}: {
  project: { id: string; name: string };
  isActive: boolean;
  onClick: () => void;
  onDropTask?: (taskId: string, projectId: string) => void;
  className?: string;
}) {
  const drop = useDropTarget((taskId) => onDropTask?.(taskId, project.id));
  return (
    <button
      onClick={onClick}
      {...(onDropTask ? drop.handlers : {})}
      className={cn(
        'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-body transition-colors duration-150',
        isActive
          ? 'bg-primary/15 text-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-surface-overlay',
        drop.isOver && 'ring-2 ring-primary bg-primary/10',
        extraClassName,
      )}
    >
      <Layers className="h-3.5 w-3.5 flex-shrink-0" />
      <span className="truncate">{project.name}</span>
    </button>
  );
}

const smartViews = [
  { key: 'inbox' as const, label: 'Inbox', icon: Inbox },
  { key: 'today' as const, label: 'Today', icon: CalendarDays },
  { key: 'upcoming' as const, label: 'Upcoming', icon: CalendarClock },
  { key: 'all' as const, label: 'All', icon: ListChecks },
];

export default function TaskSidebar({
  activeView, activeProjectId, activeAreaId, noProjectFilter, focusAreaId,
  onViewChange, onProjectSelect, onAreaSelect, onNoProjectFilter, onFocusArea,
  onDropTaskToProject,
}: TaskSidebarProps) {
  const { data: areas = [] } = trpc.tasks.areas.list.useQuery();
  const { data: projects = [] } = trpc.tasks.projects.list.useQuery();
  const utils = trpc.useUtils();

  const createArea = trpc.tasks.areas.create.useMutation({
    onSuccess: () => utils.tasks.areas.list.invalidate(),
  });
  const createProject = trpc.tasks.projects.create.useMutation({
    onSuccess: () => utils.tasks.projects.list.invalidate(),
  });

  const { data: tags = [] } = trpc.tasks.tags.list.useQuery();
  const createTag = trpc.tasks.tags.create.useMutation({
    onSuccess: () => utils.tasks.tags.list.invalidate(),
  });
  const deleteTag = trpc.tasks.tags.delete.useMutation({
    onSuccess: () => utils.tasks.tags.list.invalidate(),
  });

  const [showNewTag, setShowNewTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newAreaName, setNewAreaName] = useState('');
  const [showNewArea, setShowNewArea] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [showNewProject, setShowNewProject] = useState(false);
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

  function handleCreateProject() {
    const name = newProjectName.trim();
    if (!name) return;
    createProject.mutate({ name });
    setNewProjectName('');
    setShowNewProject(false);
  }

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
              activeView === view.key
                ? 'bg-primary/15 text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-overlay',
            )}
          >
            <view.icon className="h-4 w-4 flex-shrink-0" />
            <span>{view.label}</span>
          </button>
        ))}

        {/* No Project filter */}
        <button
          onClick={onNoProjectFilter}
          className={cn(
            'flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-body transition-colors duration-150',
            noProjectFilter
              ? 'bg-primary/15 text-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-surface-overlay',
          )}
        >
          <CircleOff className="h-4 w-4 flex-shrink-0" />
          <span>No Project</span>
        </button>
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

      {/* Projects */}
      <div className="p-2 space-y-1">
        <div className="flex items-center justify-between px-2.5 mb-1">
          <span className="text-overline text-muted-foreground uppercase tracking-wider">Projects</span>
          <button
            onClick={() => setShowNewProject(true)}
            className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {showNewProject && (
          <div className="px-2.5">
            <input
              autoFocus
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateProject();
                if (e.key === 'Escape') { setShowNewProject(false); setNewProjectName(''); }
              }}
              onBlur={() => { setShowNewProject(false); setNewProjectName(''); }}
              placeholder="Project name..."
              className="w-full bg-surface-raised text-body text-foreground placeholder:text-muted-foreground/50 px-2 py-1 rounded border border-border focus:outline-none focus:border-primary/50"
            />
          </div>
        )}

        {projects
          .filter((p: any) => !focusAreaId || areas.find((a: any) => a.id === p.areaId && a.id === focusAreaId))
          .map((project: any) => (
            <ProjectDropButton
              key={project.id}
              project={project}
              isActive={activeProjectId === project.id}
              onClick={() => onProjectSelect(project.id)}
              onDropTask={onDropTaskToProject}
              className="px-2.5"
            />
          ))}
      </div>

      <div className="mx-2 my-2 border-t border-border" />

      {/* Areas */}
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
          const areaProjects = projects.filter((p: any) => p.areaId === area.id);
          const expanded = expandedAreas.has(area.id);

          return (
            <div key={area.id} className="group/area">
              <div className="flex items-center">
                {areaProjects.length > 0 && (
                  <button
                    onClick={() => toggleArea(area.id)}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronRight className={cn('h-3 w-3 transition-transform', expanded && 'rotate-90')} />
                  </button>
                )}
                <button
                  onClick={() => onAreaSelect(area.id)}
                  className={cn(
                    'flex items-center gap-2 flex-1 px-1.5 py-1.5 rounded-md text-body transition-colors duration-150 min-w-0',
                    !areaProjects.length && 'ml-4',
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
              </div>

              {expanded && areaProjects.length > 0 && (
                <div className="ml-5 space-y-0.5">
                  {areaProjects.map((project: any) => (
                    <ProjectDropButton
                      key={project.id}
                      project={project}
                      isActive={activeProjectId === project.id}
                      onClick={() => onProjectSelect(project.id)}
                      onDropTask={onDropTaskToProject}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mx-2 my-2 border-t border-border" />

      {/* Tags */}
      <div className="p-2 space-y-1">
        <div className="flex items-center justify-between px-2.5 mb-1">
          <span className="text-overline text-muted-foreground uppercase tracking-wider">Tags</span>
          <button
            onClick={() => setShowNewTag(true)}
            className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {showNewTag && (
          <div className="px-2.5">
            <input
              autoFocus
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const name = newTagName.trim();
                  if (name) createTag.mutate({ name });
                  setNewTagName('');
                  setShowNewTag(false);
                }
                if (e.key === 'Escape') { setShowNewTag(false); setNewTagName(''); }
              }}
              onBlur={() => { setShowNewTag(false); setNewTagName(''); }}
              placeholder="Tag name..."
              className="w-full bg-surface-raised text-body text-foreground placeholder:text-muted-foreground/50 px-2 py-1 rounded border border-border focus:outline-none focus:border-primary/50"
            />
          </div>
        )}

        {tags.map((tag: any) => (
          <div
            key={tag.id}
            className="group/tag flex items-center gap-2 px-2.5 py-1.5 rounded-md text-body text-muted-foreground"
          >
            <Tag className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate flex-1">{tag.name}</span>
            <button
              onClick={() => deleteTag.mutate({ id: tag.id })}
              className="p-0.5 rounded opacity-0 group-hover/tag:opacity-100 text-muted-foreground hover:text-status-error transition-all"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
