import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart2, CheckSquare, FolderKanban, Users,
  TrendingUp, Clock, AlertTriangle, ArrowRight,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { dashboardApi } from '../api/usersApi';
import { useAuth } from '../context/AuthContext';
import { SkeletonCard } from '../components/Spinner';
import Avatar from '../components/Avatar';
import { StatusBadge, PriorityBadge } from '../components/Badges';
import { formatDate, formatRelative, isOverdue } from '../utils/formatDate';

const StatCard = ({ icon: Icon, label, value, sub, color = 'primary', trend }) => {
  const colors = {
    primary: 'text-primary-400 bg-primary-500/10',
    green: 'text-green-400 bg-green-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    red: 'text-red-400 bg-red-500/10',
    cyan: 'text-cyan-400 bg-cyan-500/10',
  };
  return (
    <div className="glass-card p-5 flex items-start gap-4 group hover:border-primary-500/20 transition-all duration-200">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-gray-500 text-sm">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value ?? '—'}</p>
        {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
      </div>
    </div>
  );
};

const COLORS = ['#6C63FF', '#00D4FF', '#FFB347', '#00C896', '#FF6B9D'];

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [myTasks, setMyTasks] = useState([]);
  const [activity, setActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, t, a] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getMyTasks({ limit: 8 }),
          dashboardApi.getActivity({ limit: 10 }),
        ]);
        setStats(s.data.data);
        setMyTasks(t.data.data);
        setActivity(a.data.data);
      } catch {}
      finally { setIsLoading(false); }
    };
    load();
  }, []);

  // Build chart data from weeklyActivity
  const chartData = stats?.weeklyActivity?.map((d) => ({
    date: d._id.slice(5), // MM-DD
    completed: d.count,
  })) || [];

  // Pie data from tasksByStatus
  const taskStatusData = stats
    ? Object.entries(stats.tasks?.byStatus || {}).map(([k, v]) => ({ name: k, value: v }))
    : [];

  const activityIcon = (action) => {
    const map = { created: '✨', updated: '✏️', deleted: '🗑️', assigned: '👤', commented: '💬', status_changed: '🔄', member_added: '➕', time_logged: '⏱️' };
    return map[action] || '📌';
  };

  if (isLoading) {
    return (
      <div>
        <div className="page-header"><div className="skeleton h-8 w-48 rounded" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
            <span className="text-gradient">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">Here's what's happening with your projects</p>
        </div>
        <Link to="/projects" className="btn-primary flex items-center gap-2">
          <FolderKanban size={16} /> View Projects
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={FolderKanban} label="Total Projects" value={stats?.projects?.total} sub={`${stats?.projects?.byStatus?.active || 0} active`} color="primary" />
        <StatCard icon={CheckSquare} label="Total Tasks" value={stats?.tasks?.total} sub={`${stats?.tasks?.completionRate || 0}% complete`} color="cyan" />
        <StatCard icon={Clock} label="My Tasks" value={stats?.tasks?.myTasks} sub="assigned to you" color="green" />
        <StatCard icon={AlertTriangle} label="Overdue" value={stats?.tasks?.overdue} sub="need attention" color="red" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Area Chart: weekly completions */}
        <div className="lg:col-span-2 glass-card p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-primary-400" /> Tasks Completed (Last 7 Days)
          </h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3d" />
                <XAxis dataKey="date" stroke="#4B5563" tick={{ fill: '#6B7280', fontSize: 11 }} />
                <YAxis stroke="#4B5563" tick={{ fill: '#6B7280', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1a2235', border: '1px solid #2d3a52', borderRadius: 8, color: '#f3f4f6' }} />
                <Area type="monotone" dataKey="completed" stroke="#6C63FF" strokeWidth={2} fill="url(#grad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex items-center justify-center text-gray-600 text-sm">No activity data yet</div>
          )}
        </div>

        {/* Pie Chart: task by status */}
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <BarChart2 size={16} className="text-accent-cyan" /> Tasks by Status
          </h2>
          {taskStatusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={taskStatusData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                    {taskStatusData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1a2235', border: '1px solid #2d3a52', borderRadius: 8, color: '#f3f4f6' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {taskStatusData.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-gray-400 capitalize">{item.name.replace('-', ' ')}</span>
                    </div>
                    <span className="text-gray-300 font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-44 flex items-center justify-center text-gray-600 text-sm">No tasks yet</div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* My Tasks */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-300">My Tasks</h2>
            <Link to="/tasks" className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {myTasks.length === 0 ? (
              <p className="text-center text-gray-600 text-sm py-8">No tasks assigned</p>
            ) : (
              myTasks.map((task) => (
                <Link
                  key={task._id}
                  to={`/tasks/${task._id}`}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isOverdue(task.dueDate) && task.status !== 'done' ? 'text-red-300' : 'text-gray-200'}`}>
                      {task.title}
                    </p>
                    <p className="text-xs text-gray-600 truncate">{task.project?.title}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <PriorityBadge priority={task.priority} />
                    <StatusBadge status={task.status} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-300">Recent Activity</h2>
            <Link to="/activity" className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {activity.length === 0 ? (
              <p className="text-center text-gray-600 text-sm py-8">No recent activity</p>
            ) : (
              activity.map((log) => (
                <div key={log._id} className="flex items-start gap-3">
                  <Avatar user={log.user} size="xs" className="mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-300">
                      <span className="font-medium text-white">{log.user?.name}</span>{' '}
                      <span className="text-gray-500">{log.action.replace('_', ' ')}</span>{' '}
                      <span className="text-primary-400 truncate">{log.entityTitle}</span>
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">{formatRelative(log.createdAt)}</p>
                  </div>
                  <span className="text-base flex-shrink-0">{activityIcon(log.action)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
