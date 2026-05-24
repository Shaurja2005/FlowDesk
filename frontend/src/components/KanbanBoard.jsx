import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Link } from 'react-router-dom';
import { Plus, GripVertical, Calendar, MessageSquare, Clock } from 'lucide-react';
import { tasksApi } from '../api/tasksApi';
import { StatusBadge, PriorityBadge } from './Badges';
import Avatar from './Avatar';
import { SkeletonCard } from './Spinner';
import { KANBAN_COLUMNS } from '../utils/constants';
import { formatDate, isOverdue } from '../utils/formatDate';
import toast from 'react-hot-toast';

const TaskCard = ({ task, index }) => (
  <Draggable draggableId={task._id} index={index}>
    {(provided, snapshot) => (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        className={`glass-card p-3 cursor-pointer group transition-all duration-150 hover:border-primary-500/20 ${
          snapshot.isDragging ? 'shadow-glow rotate-1 scale-105' : ''
        }`}
      >
        {/* Drag handle */}
        <div className="flex items-start justify-between gap-2">
          <div
            {...provided.dragHandleProps}
            className="text-gray-600 hover:text-secondary-content mt-0.5 cursor-grab active:cursor-grabbing flex-shrink-0"
          >
            <GripVertical size={14} />
          </div>
          <Link to={`/tasks/${task._id}`} className="flex-1 min-w-0">
            <p className="text-sm font-medium text-primary-content group-hover:text-primary-500 line-clamp-2 mb-2">
              {task.title}
            </p>
          </Link>
        </div>

        {/* Labels */}
        {task.labels?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2 pl-5">
            {task.labels.slice(0, 3).map((label) => (
              <span key={label} className="text-xs px-1.5 py-0.5 rounded bg-primary-500/15 text-primary-700 dark:text-primary-400 border border-primary-500/20">
                {label}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-2 pl-5">
          <div className="flex items-center gap-2">
            <PriorityBadge priority={task.priority} />
            {task.dueDate && (
              <span className={`flex items-center gap-1 text-xs ${isOverdue(task.dueDate) && task.status !== 'done' ? 'text-red-400' : 'text-gray-600'}`}>
                <Calendar size={11} />
                {formatDate(task.dueDate)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {task.comments?.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-600">
                <MessageSquare size={11} /> {task.comments.length}
              </span>
            )}
            {task.assignedTo && <Avatar user={task.assignedTo} size="xs" />}
          </div>
        </div>
      </div>
    )}
  </Draggable>
);

const KanbanBoard = ({ projectId, refreshKey, canManage }) => {
  const [columns, setColumns] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const { data } = await tasksApi.getAll({ project: projectId, limit: 100 });
      const grouped = {};
      KANBAN_COLUMNS.forEach((col) => { grouped[col.id] = []; });
      data.data.forEach((task) => {
        if (grouped[task.status]) grouped[task.status].push(task);
        else grouped['todo'].push(task);
      });
      setColumns(grouped);
    } catch {}
    finally { setIsLoading(false); }
  };

  useEffect(() => { loadTasks(); }, [projectId, refreshKey]);

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const srcCol = [...(columns[source.droppableId] || [])];
    const dstCol = source.droppableId === destination.droppableId
      ? srcCol
      : [...(columns[destination.droppableId] || [])];

    const [moved] = srcCol.splice(source.index, 1);
    dstCol.splice(destination.index, 0, { ...moved, status: destination.droppableId });

    // Optimistic update
    setColumns((prev) => ({
      ...prev,
      [source.droppableId]: source.droppableId === destination.droppableId ? dstCol : srcCol,
      [destination.droppableId]: dstCol,
    }));

    try {
      await tasksApi.update(draggableId, {
        status: destination.droppableId,
        order: destination.index,
      });
    } catch {
      toast.error('Failed to update task status');
      loadTasks(); // rollback
    }
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((col) => (
          <div key={col.id} className="flex-shrink-0 w-72 space-y-3">
            <div className="skeleton h-6 w-24 rounded" />
            {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((col) => {
          const colTasks = columns[col.id] || [];
          return (
            <div key={col.id} className="flex-shrink-0 w-72">
              {/* Column header */}
              <div className={`flex items-center justify-between px-3 py-2 rounded-lg border mb-3 ${col.bg} ${col.border}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${col.color}`}>{col.title}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-black/20 text-secondary-content font-medium">
                    {colTasks.length}
                  </span>
                </div>
              </div>

              {/* Droppable area */}
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-24 space-y-2 rounded-lg p-2 transition-colors ${
                      snapshot.isDraggingOver ? 'bg-primary-500/5 ring-1 ring-primary-500/20' : ''
                    }`}
                  >
                    {colTasks.map((task, index) => (
                      <TaskCard key={task._id} task={task} index={index} />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;
