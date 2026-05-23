import { useState, useEffect } from 'react';
import { Search, UserCog, UserX, UserCheck, Plus } from 'lucide-react';
import { usersApi } from '../api/usersApi';
import Avatar from '../components/Avatar';
import { RoleBadge } from '../components/Badges';
import { SkeletonRow, EmptyState } from '../components/Spinner';
import { ConfirmDialog } from '../components/Modal';
import Pagination from '../components/Pagination';
import { formatDate, formatRelative } from '../utils/formatDate';
import { useDebounce } from '../hooks/useDebounce';
import toast from 'react-hot-toast';

const TeamPage = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deactivateId, setDeactivateId] = useState(null);
  const [isToggling, setIsToggling] = useState(false);
  const debouncedSearch = useDebounce(search);

  const load = async () => {
    setIsLoading(true);
    try {
      const { data } = await usersApi.getAll({
        page,
        limit: 15,
        search: debouncedSearch || undefined,
        role: roleFilter || undefined,
      });
      setUsers(data.data);
      setPagination(data.pagination);
    } catch {}
    finally { setIsLoading(false); }
  };

  useEffect(() => { load(); }, [page, debouncedSearch, roleFilter]);

  const handleToggleActive = async () => {
    const target = users.find((u) => u._id === deactivateId);
    if (!target) return;
    setIsToggling(true);
    try {
      await usersApi.update(deactivateId, { isActive: !target.isActive });
      setUsers((prev) => prev.map((u) => u._id === deactivateId ? { ...u, isActive: !u.isActive } : u));
      toast.success(`User ${target.isActive ? 'deactivated' : 'activated'}`);
    } catch {
      toast.error('Failed to update user');
    } finally {
      setIsToggling(false);
      setDeactivateId(null);
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await usersApi.update(userId, { role });
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, role } : u));
      toast.success('Role updated');
    } catch {
      toast.error('Failed to update role');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Team</h1>
          <p className="text-gray-500 text-sm mt-1">{pagination?.total || 0} members</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input type="text" placeholder="Search members..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="input w-36">
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="developer">Developer</option>
        </select>
      </div>

      {isLoading ? (
        <div className="glass-card divide-y divide-white/5">
          {[...Array(8)].map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : users.length === 0 ? (
        <EmptyState icon={UserCog} title="No users found" message="No users match your search" />
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-5 py-3 text-gray-400 font-medium">Member</th>
                <th className="text-left px-5 py-3 text-gray-400 font-medium hidden md:table-cell">Role</th>
                <th className="text-left px-5 py-3 text-gray-400 font-medium hidden lg:table-cell">Joined</th>
                <th className="text-left px-5 py-3 text-gray-400 font-medium hidden lg:table-cell">Last Login</th>
                <th className="text-left px-5 py-3 text-gray-400 font-medium">Status</th>
                <th className="text-right px-5 py-3 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (
                <tr key={u._id} className={`hover:bg-white/3 transition-colors ${!u.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar user={u} size="sm" />
                      <div>
                        <p className="font-medium text-white">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      className="bg-transparent border border-white/10 rounded-lg px-2 py-1 text-xs text-gray-300 cursor-pointer hover:border-primary-500/50 transition-colors"
                    >
                      <option value="developer">Developer</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-5 py-3 hidden lg:table-cell text-gray-500 text-xs">{formatDate(u.createdAt)}</td>
                  <td className="px-5 py-3 hidden lg:table-cell text-gray-500 text-xs">
                    {u.lastLogin ? formatRelative(u.lastLogin) : 'Never'}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`badge ${u.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => setDeactivateId(u._id)}
                      className={`btn-ghost p-1.5 ${u.isActive ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}`}
                      title={u.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {u.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination pagination={pagination} onPageChange={setPage} />

      <ConfirmDialog
        isOpen={!!deactivateId}
        onClose={() => setDeactivateId(null)}
        onConfirm={handleToggleActive}
        title="Toggle User Status"
        message="Are you sure you want to change this user's active status?"
        confirmLabel="Confirm"
        isLoading={isToggling}
      />
    </div>
  );
};

export default TeamPage;
