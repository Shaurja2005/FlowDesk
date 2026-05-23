import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowUpDown, Pencil, Trash2, Plus } from 'lucide-react';
import { tasksApi } from '../api/tasksApi';
import { StatusBadge, PriorityBadge } from './Badges';
import Avatar from './Avatar';
import { SkeletonRow, EmptyState } from './Spinner';
import { ConfirmDialog } from './Modal';
import { formatDate, isOverdue } from '../utils/formatDate';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const TaskListView = ({ projectId, refreshKey, canManage }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const { data } = await tasksApi.getAll({ project: projectId, limit: 100 });
        setTasks(data.data);
      } catch {}
      finally { setIsLoading(false); }
    };
    load();
  }, [projectId, refreshKey]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await tasksApi.delete(deleteId);
      setTasks((prev) => prev.filter((t) => t._id !== deleteId));
      toast.success('Task deleted');
    } catch (err) {
      toast.error('Failed to delete task');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const filtered = tasks.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="space-y-2">{[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}</div>;

  return (
    <div>
      <div className="mb-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input type="text" placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No tasks found" message="No tasks match your search" />
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Title</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium hidden md:table-cell">Status</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium hidden lg:table-cell">Priority</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium hidden lg:table-cell">Assignee</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium hidden md:table-cell">Due Date</th>
                <th className="text-right px-4 py-3 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((task) => (
                <tr key={task._id} className="hover:bg-white/3 transition-colors group">
                  <td className="px-4 py-3">
                    <Link to={`/tasks/${task._id}`} className="text-gray-200 hover:text-primary-300 font-medium line-clamp-1">
                      {task.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell"><StatusBadge status={task.status} /></td>
                  <td className="px-4 py-3 hidden lg:table-cell"><PriorityBadge priority={task.priority} /></td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {task.assignedTo ? (
                      <div className="flex items-center gap-2">
                        <Avatar user={task.assignedTo} size="xs" />
                        <span className="text-gray-400 text-xs">{task.assignedTo.name}</span>
                      </div>
                    ) : <span className="text-gray-600">Unassigned</span>}
                  </td>
                  <td className={`px-4 py-3 hidden md:table-cell text-xs ${isOverdue(task.dueDate) && task.status !== 'done' ? 'text-red-400' : 'text-gray-500'}`}>
                    {formatDate(task.dueDate)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link to={`/tasks/${task._id}`} className="btn-ghost p-1.5">
                        <Pencil size={14} />
                      </Link>
                      {canManage && (
                        <button onClick={() => setDeleteId(task._id)} className="btn-ghost p-1.5 text-red-400 hover:text-red-300">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Task"
        message="Are you sure you want to delete this task? This cannot be undone."
        isLoading={isDeleting}
      />
    </div>
  );
};

export default TaskListView;
