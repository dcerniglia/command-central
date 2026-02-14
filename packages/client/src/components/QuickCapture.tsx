import { useState, useRef, useEffect } from 'react';
import { Project } from '../api/client';

interface Props {
  projects: Project[];
  onAdd: (title: string, projectId?: string) => void;
}

export default function QuickCapture({ projects, onAdd }: Props) {
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed, projectId || undefined);
    setTitle('');
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-center">
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Quick add a task..."
        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
      <select
        value={projectId}
        onChange={(e) => setProjectId(e.target.value)}
        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
      >
        <option value="">No project</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
      >
        Add
      </button>
    </form>
  );
}
