import { useState } from 'react';
import { CheckSquare, Search, Filter } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../components/Badges';
import Avatar from '../components/Avatar';
import { SkeletonRow, EmptyState } from '../components/Spinner';
import Pagination from '../components/Pagination';
import { Link } from 'react-router-dom';
import { formatDate, isOverdue } from '../utils/formatDate';
import { useDebounce } from '../hooks/useDebounce';

const MyTasksPage = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const { tasks, pagination, isLoading } = useTasks({
    assignedTo: user?._id,
    search: debouncedSearch,
    status: statusFilter,
    priority: priorityFilter,
    page,
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Tasks</h1>
          <p className="text-gray-500 text-sm mt-1">{pagination?.total || 0} tasks assigned to you</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input type="text" placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-40">
          <option value="">All Status</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="in-review">In Review</option>
          <option value="done">Done</option>
          <option value="blocked">Blocked</option>
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="input w-36">
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {isLoading ? (
        <div className="glass-card divide-y divide-white/5">
          {[...Array(8)].map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState icon={CheckSquare} title="No tasks" message="No tasks match your filters" />
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-5 py-3 text-gray-400 font-medium">Task</th>
                <th className="text-left px-5 py-3 text-gray-400 font-medium hidden md:table-cell">Project</th>
                <th className="text-left px-5 py-3 text-gray-400 font-medium hidden md:table-cell">Status</th>
                <th className="text-left px-5 py-3 text-gray-400 font-medium hidden lg:table-cell">Priority</th>
                <th className="text-left px-5 py-3 text-gray-400 font-medium hidden lg:table-cell">Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {tasks.map((task) => (
                <tr key={task._id} className="hover:bg-white/3 transition-colors">
                  <td className="px-5 py-3">
                    <Link to={`/tasks/${task._id}`} className="text-gray-200 hover:text-primary-300 font-medium line-clamp-1">
                      {task.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    <Link to={`/projects/${task.project?._id}`} className="text-gray-500 hover:text-primary-400 text-xs">
                      {task.project?.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell"><StatusBadge status={task.status} /></td>
                  <td className="px-5 py-3 hidden lg:table-cell"><PriorityBadge priority={task.priority} /></td>
                  <td className={`px-5 py-3 hidden lg:table-cell text-xs ${isOverdue(task.dueDate) && task.status !== 'done' ? 'text-red-400' : 'text-gray-500'}`}>
                    {formatDate(task.dueDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
};

export default MyTasksPage;
