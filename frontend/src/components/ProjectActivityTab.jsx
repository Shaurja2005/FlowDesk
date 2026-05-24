import { useState, useEffect } from 'react';
import { projectsApi } from '../api/projectsApi';
import Avatar from './Avatar';
import { SkeletonRow } from './Spinner';
import { formatRelative } from '../utils/formatDate';

const actionLabel = (action, entity, title) => {
  const map = {
    created: `created ${entity}`,
    updated: `updated ${entity}`,
    deleted: `deleted ${entity}`,
    assigned: `assigned ${entity}`,
    commented: `commented on`,
    status_changed: `changed status of`,
    member_added: `added member to`,
    member_removed: `removed member from`,
    time_logged: `logged time on`,
  };
  return `${map[action] || action} ${title}`;
};

const actionEmoji = (action) => {
  const map = {
    created: '✨', updated: '✏️', deleted: '🗑️',
    assigned: '👤', commented: '💬', status_changed: '🔄',
    member_added: '➕', member_removed: '➖', time_logged: '⏱️',
  };
  return map[action] || '📌';
};

const ProjectActivityTab = ({ projectId }) => {
  const [activity, setActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const load = async (p = 1) => {
    setIsLoading(true);
    try {
      const { data } = await projectsApi.getActivity(projectId, { page: p, limit: 15 });
      if (p === 1) setActivity(data.data);
      else setActivity((prev) => [...prev, ...data.data]);
      setHasMore(data.pagination?.hasNextPage);
    } catch {}
    finally { setIsLoading(false); }
  };

  useEffect(() => { load(1); }, [projectId]);

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-secondary-content mb-4">Project Activity</h3>

      {isLoading && page === 1 ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}</div>
      ) : activity.length === 0 ? (
        <p className="text-gray-600 text-sm text-center py-8">No activity yet</p>
      ) : (
        <div className="space-y-4">
          {activity.map((log, i) => (
            <div key={log._id} className="flex items-start gap-3">
              <span className="text-base flex-shrink-0 mt-0.5">{actionEmoji(log.action)}</span>
              <div className="flex-1 min-w-0 flex items-start gap-3">
                <Avatar user={log.user} size="sm" className="flex-shrink-0" />
                <div>
                  <p className="text-sm text-secondary-content">
                    <span className="font-medium text-primary-content">{log.user?.name}</span>{' '}
                    {actionLabel(log.action, log.entity, log.entityTitle)}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">{formatRelative(log.createdAt)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && !isLoading && (
        <button
          onClick={() => { setPage((p) => { const n = p + 1; load(n); return n; }); }}
          className="btn-secondary text-xs mt-4 w-full"
        >
          Load more
        </button>
      )}
    </div>
  );
};

export default ProjectActivityTab;
