import { useState } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import Avatar from '../components/Avatar';
import { EmptyState, SkeletonRow } from '../components/Spinner';
import { formatRelative } from '../utils/formatDate';
import { useNavigate } from 'react-router-dom';

const typeIcon = (type) => {
  const map = {
    task_assigned: '📋', task_updated: '✏️', comment_added: '💬',
    project_invite: '🎯', status_change: '🔄', mention: '@', deadline: '⏰',
  };
  return map[type] || '🔔';
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead, deleteNotification } = useNotifications();

  const handleClick = async (n) => {
    if (!n.isRead) await markRead(n._id);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          {unreadCount > 0 && <p className="text-gray-500 text-sm mt-1">{unreadCount} unread</p>}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-secondary flex items-center gap-2 text-sm">
            <Check size={14} /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="All caught up!" message="No notifications yet. We'll let you know when something happens." />
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="divide-y divide-white/5">
            {notifications.map((n) => (
              <div
                key={n._id}
                className={`flex items-start gap-4 px-5 py-4 hover:bg-white/3 transition-colors group cursor-pointer ${!n.isRead ? 'bg-primary-500/3' : ''}`}
                onClick={() => handleClick(n)}
              >
                <span className="text-xl flex-shrink-0 mt-0.5">{typeIcon(n.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${n.isRead ? 'text-gray-400' : 'text-gray-200'}`}>{n.message}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{formatRelative(n.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  {!n.isRead && (
                    <button
                      onClick={(e) => { e.stopPropagation(); markRead(n._id); }}
                      className="btn-ghost p-1.5 text-primary-400"
                      title="Mark as read"
                    >
                      <Check size={14} />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotification(n._id); }}
                    className="btn-ghost p-1.5 text-red-400"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-2" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
