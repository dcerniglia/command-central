import { useState } from 'react';
import { Project, Task, HarvestProjectAssignment } from '../api/client';

interface Props {
  projects: Project[];
  tasks: Task[];
  selectedProjectId: string | null;
  onSelect: (projectId: string | null) => void;
  onAddProject: (name: string, color: string) => void;
  harvestProjects: HarvestProjectAssignment[];
  onMapHarvest: (projectId: string, harvestProjectId: string, harvestTaskId: string) => void;
}

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#14b8a6'];

export default function ProjectSidebar({ projects, tasks, selectedProjectId, onSelect, onAddProject, harvestProjects, onMapHarvest }: Props) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [mappingId, setMappingId] = useState<string | null>(null);
  const [selectedHarvestProject, setSelectedHarvestProject] = useState<string>('');
  const [selectedHarvestTask, setSelectedHarvestTask] = useState<string>('');

  function taskCount(projectId?: string) {
    if (!projectId) return tasks.filter((t) => t.status !== 'done').length;
    return tasks.filter((t) => t.project_id === projectId && t.status !== 'done').length;
  }

  function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAddProject(trimmed, color);
    setName('');
    setColor(COLORS[0]);
    setAdding(false);
  }

  function handleMapSave() {
    if (mappingId && selectedHarvestProject && selectedHarvestTask) {
      onMapHarvest(mappingId, selectedHarvestProject, selectedHarvestTask);
      setMappingId(null);
      setSelectedHarvestProject('');
      setSelectedHarvestTask('');
    }
  }

  const selectedHarvestAssignment = harvestProjects.find(
    hp => String(hp.project.id) === selectedHarvestProject
  );

  return (
    <aside className="w-64 bg-gray-800/50 border-r border-gray-700 flex flex-col h-full">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Projects</h2>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        <button
          onClick={() => onSelect(null)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
            selectedProjectId === null ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700/50'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
            All Tasks
          </span>
          <span className="text-xs text-gray-500 bg-gray-700/80 px-2 py-0.5 rounded-full">{taskCount()}</span>
        </button>

        {projects.filter((p) => p.active).map((project) => (
          <div key={project.id} className="group">
            <button
              onClick={() => onSelect(project.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedProjectId === project.id ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              <span className="flex items-center gap-2.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
                <span className="truncate">{project.name}</span>
                {project.harvest_project_id && (
                  <span className="text-[10px] px-1 py-0.5 rounded bg-orange-500/20 text-orange-300" title="Mapped to Harvest">
                    H
                  </span>
                )}
              </span>
              <div className="flex items-center gap-1.5">
                {!project.harvest_project_id && harvestProjects.length > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setMappingId(project.id); }}
                    className="opacity-0 group-hover:opacity-100 text-[10px] px-1 py-0.5 rounded text-gray-500 hover:text-orange-300 hover:bg-orange-500/10 transition-all"
                    title="Map to Harvest project"
                  >
                    +H
                  </button>
                )}
                <span className="text-xs text-gray-500 bg-gray-700/80 px-2 py-0.5 rounded-full">
                  {taskCount(project.id)}
                </span>
              </div>
            </button>

            {/* Harvest mapping modal */}
            {mappingId === project.id && (
              <div className="mx-2 mt-1 mb-2 p-3 bg-gray-800 border border-gray-600 rounded-lg space-y-2">
                <p className="text-xs text-gray-400">Map to Harvest project:</p>
                <select
                  value={selectedHarvestProject}
                  onChange={(e) => { setSelectedHarvestProject(e.target.value); setSelectedHarvestTask(''); }}
                  className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-gray-200"
                >
                  <option value="">Select project...</option>
                  {harvestProjects.map(hp => (
                    <option key={hp.project.id} value={String(hp.project.id)}>
                      {hp.project.client ? `${hp.project.client.name} — ` : ''}{hp.project.name}
                    </option>
                  ))}
                </select>

                {selectedHarvestAssignment && (
                  <>
                    <p className="text-xs text-gray-400">Default task:</p>
                    <select
                      value={selectedHarvestTask}
                      onChange={(e) => setSelectedHarvestTask(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-gray-200"
                    >
                      <option value="">Select task...</option>
                      {selectedHarvestAssignment.taskAssignments.map(ta => (
                        <option key={ta.task.id} value={String(ta.task.id)}>
                          {ta.task.name}
                        </option>
                      ))}
                    </select>
                  </>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleMapSave}
                    disabled={!selectedHarvestProject || !selectedHarvestTask}
                    className="flex-1 text-xs bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white py-1.5 rounded-md transition-colors"
                  >
                    Map
                  </button>
                  <button
                    onClick={() => setMappingId(null)}
                    className="flex-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 py-1.5 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-700">
        {adding ? (
          <div className="space-y-2">
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="Project name"
              className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="flex gap-1.5 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-5 h-5 rounded-full transition-transform ${color === c ? 'ring-2 ring-white scale-110' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={handleAdd} className="flex-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white py-1.5 rounded-md transition-colors">
                Add
              </button>
              <button onClick={() => setAdding(false)} className="flex-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 py-1.5 rounded-md transition-colors">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full text-sm text-gray-400 hover:text-gray-200 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-700/50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Project
          </button>
        )}
      </div>
    </aside>
  );
}
