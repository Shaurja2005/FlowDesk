import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, CheckSquare, Bell,
  Users, Settings, Activity, ChevronLeft, ChevronRight,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import Avatar from '../components/Avatar';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'manager', 'developer'] },
  { to: '/projects', icon: FolderKanban, label: 'Projects', roles: ['admin', 'manager', 'developer'] },
  { to: '/tasks', icon: CheckSquare, label: 'My Tasks', roles: ['admin', 'manager', 'developer'] },
  { to: '/notifications', icon: Bell, label: 'Notifications', roles: ['admin', 'manager', 'developer'], badge: true },
  { to: '/activity', icon: Activity, label: 'Activity', roles: ['admin', 'manager', 'developer'] },
  { to: '/team', icon: Users, label: 'Team', roles: ['admin'] },
  { to: '/settings', icon: Settings, label: 'Settings', roles: ['admin', 'manager', 'developer'] },
];

const Sidebar = ({ collapsed, onToggle }) => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  const filteredNav = navItems.filter((item) => item.roles.includes(user?.role));

  return (
    <aside
      className={`${collapsed ? 'w-16' : 'w-64'} flex-shrink-0 h-full flex flex-col layout-sidebar transition-all duration-300 relative z-20`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-theme">
        <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
          <Zap size={16} className="text-white" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold text-gradient">FlowDesk</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {filteredNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`
            }
            title={collapsed ? item.label : ''}
          >
            <div className="relative flex-shrink-0">
              <item.icon size={18} />
              {item.badge && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer links */}
      <div className="p-3 border-t border-theme">
        <NavLink
          to="/pricing"
          className={({ isActive }) =>
            `nav-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`
          }
          title={collapsed ? 'Pricing' : ''}
        >
          <div className="relative flex-shrink-0">
            <Zap size={18} />
          </div>
          {!collapsed && <span>Pricing</span>}
        </NavLink>
      </div>

      {/* User info */}
      {!collapsed && (
        <div className="p-3 border-t border-theme">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
            <Avatar user={user} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-primary-content truncate">{user?.name}</p>
              <p className="text-xs text-muted-content capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-elevated border border-theme rounded-full flex items-center justify-center text-secondary-content hover:text-primary-content hover:border-primary-500/50 transition-colors z-30"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
};

export default Sidebar;
