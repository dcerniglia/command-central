import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskRow, { type TaskRowTask } from './TaskRow';

interface SortableTaskListProps {
  tasks: TaskRowTask[];
  onComplete: (id: string) => void;
  onClick: (id: string) => void;
  onReorder: (items: { id: string; sortOrder: number }[]) => void;
}

function SortableTask({
  task,
  onComplete,
  onClick,
}: {
  task: TaskRowTask;
  onComplete: (id: string) => void;
  onClick: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    zIndex: isDragging ? 10 : undefined,
    position: 'relative' as const,
  };

  return (
    <TaskRow
      ref={setNodeRef}
      style={style}
      task={task}
      onComplete={onComplete}
      onClick={onClick}
      dragHandleProps={{ ...attributes, ...listeners }}
    />
  );
}

export default function SortableTaskList({ tasks, onComplete, onClick, onReorder }: SortableTaskListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Compute new sort orders
    const reordered = [...tasks];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    onReorder(reordered.map((t, i) => ({ id: t.id, sortOrder: i })));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {tasks.map((task) => (
            <SortableTask key={task.id} task={task} onComplete={onComplete} onClick={onClick} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
