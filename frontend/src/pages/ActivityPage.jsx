import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import api from '../api/axiosInstance';
import Avatar from '../components/Avatar';
import { SkeletonRow, EmptyState } from '../components/Spinner';
import Pagination from '../components/Pagination';
import { formatRelative } from '../utils/formatDate';

const actionEmoji = (action) => {
  const map = { created: '✨', updated: '✏️', deleted: '🗑️', assigned: '👤', commented: '💬', status_changed: '🔄', member_added: '➕', member_removed: '➖', time_logged: '⏱️' };
  return map[action] || '📌';
};

const ActivityPage = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [entityFilter, setEntityFilter] = useState('');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get('/activities', { params: { page, limit: 20, entity: entityFilter || undefined } });
        setLogs(data.data);
        setPagination(data.pagination);
      } catch {}
      finally { setIsLoading(false); }
    };
    load();
  }, [page, entityFilter]);

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Activity Feed</h1>
        <select value={entityFilter} onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }} className="input w-40">
          <option value="">All Entities</option>
          <option value="task">Tasks</option>
          <option value="project">Projects</option>
          <option value="comment">Comments</option>
        </select>
      </div>

      {isLoading ? (
        <div className="glass-card divide-y divide-white/5">
          {[...Array(10)].map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : logs.length === 0 ? (
        <EmptyState icon={Activity} title="No activity" message="No activity logs found" />
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="divide-y divide-white/5">
            {logs.map((log) => (
              <div key={log._id} className="flex items-start gap-4 px-5 py-3.5 hover:bg-white/3 transition-colors">
                <span className="text-lg flex-shrink-0 mt-0.5">{actionEmoji(log.action)}</span>
                <Avatar user={log.user} size="sm" className="flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300">
                    <span className="font-medium text-white">{log.user?.name}</span>{' '}
                    <span className="text-gray-500">{log.action.replace(/_/g, ' ')}</span>{' '}
                    <span className="text-primary-400">{log.entityTitle}</span>
                    {log.project && <span className="text-gray-600"> in {log.project.title}</span>}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">{formatRelative(log.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Pagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
};

export default ActivityPage;
