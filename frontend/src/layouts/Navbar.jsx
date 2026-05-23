import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Sun, Moon, LogOut, User, Settings, ChevronDown, Check, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import Avatar from '../components/Avatar';
import { formatRelative } from '../utils/formatDate';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const navigate = useNavigate();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const notifTypeIcon = (type) => {
    const map = {
      task_assigned: '📋',
      comment_added: '💬',
      status_change: '🔄',
      project_invite: '🎯',
      mention: '@',
      deadline: '⏰',
    };
    return map[type] || '🔔';
  };

  return (
    <header className="h-14 bg-dark-800/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-5 flex-shrink-0 z-10 sticky top-0">
      {/* Left: Breadcrumb placeholder or search */}
      <div className="flex-1" />

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button onClick={toggleTheme} className="btn-ghost p-2" aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifs((s) => !s)}
            className="btn-ghost p-2 relative"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-80 glass-card shadow-glass border border-white/5 animate-slide-up overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <span className="font-semibold text-sm text-white">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
                    <Check size={12} /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm py-8">No notifications</p>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <button
                      key={n._id}
                      onClick={() => { markRead(n._id); setShowNotifs(false); if (n.link) navigate(n.link); }}
                      className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left ${!n.isRead ? 'bg-primary-500/5' : ''}`}
                    >
                      <span className="text-base flex-shrink-0 mt-0.5">{notifTypeIcon(n.type)}</span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm ${n.isRead ? 'text-gray-400' : 'text-gray-200'}`}>{n.message}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{formatRelative(n.createdAt)}</p>
                      </div>
                      {!n.isRead && (
                        <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />
                      )}
                    </button>
                  ))
                )}
              </div>

              <div className="border-t border-white/5 px-4 py-2">
                <Link
                  to="/notifications"
                  onClick={() => setShowNotifs(false)}
                  className="text-xs text-primary-400 hover:text-primary-300"
                >
                  View all notifications →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setShowProfile((s) => !s)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <Avatar user={user} size="sm" />
            <span className="text-sm font-medium text-gray-200 hidden sm:block">{user?.name}</span>
            <ChevronDown size={14} className="text-gray-500 hidden sm:block" />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-48 glass-card shadow-glass border border-white/5 py-1 animate-slide-up">
              <Link
                to="/settings"
                onClick={() => setShowProfile(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                <User size={16} /> Profile
              </Link>
              <Link
                to="/settings"
                onClick={() => setShowProfile(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                <Settings size={16} /> Settings
              </Link>
              <div className="border-t border-white/5 my-1" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 w-full transition-colors"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
