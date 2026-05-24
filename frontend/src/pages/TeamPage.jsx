import { useState, useEffect } from 'react';
import { Search, UserCog, UserX, UserCheck, Plus, MoreVertical, Trash2, Edit2, User } from 'lucide-react';
import { usersApi } from '../api/usersApi';
import Avatar from '../components/Avatar';
import { RoleBadge } from '../components/Badges';
import { SkeletonRow, EmptyState } from '../components/Spinner';
import { ConfirmDialog } from '../components/Modal';
import Pagination from '../components/Pagination';
import { formatDate, formatRelative } from '../utils/formatDate';
import { useDebounce } from '../hooks/useDebounce';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import AddUserModal from '../components/modals/AddUserModal';
import EditUserModal from '../components/modals/EditUserModal';

const TeamPage = () => {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [suspendUser, setSuspendUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const { data } = await usersApi.getAll({
        page,
        limit: 15,
        search: debouncedSearch || undefined,
        role: roleFilter !== 'All' ? roleFilter : undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
      });
      setUsers(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, debouncedSearch, roleFilter, statusFilter]);

  const handleToggleSuspend = async () => {
    if (!suspendUser) return;
    setIsToggling(true);
    try {
      if (suspendUser.isSuspended) {
        await usersApi.unsuspend(suspendUser._id);
        toast.success('User unsuspended');
      } else {
        await usersApi.suspend(suspendUser._id);
        toast.success('User suspended');
      }
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user status');
    } finally {
      setIsToggling(false);
      setSuspendUser(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    if (deleteConfirmName !== deleteUser.name) {
      toast.error("Name doesn't match");
      return;
    }
    setIsDeleting(true);
    try {
      await usersApi.delete(deleteUser._id);
      toast.success('User account deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
      setDeleteUser(null);
      setDeleteConfirmName('');
    }
  };

  const getStatusBadge = (u) => {
    if (u.isSuspended) return <span className="badge bg-red-500/20 text-red-400">Suspended</span>;
    if (!u.isEmailVerified) return <span className="badge bg-yellow-500/20 text-yellow-400">Unverified</span>;
    return <span className="badge bg-green-500/20 text-green-400">Active</span>;
  };

  return (
    <div className="animate-fade-in" onClick={() => setActiveDropdown(null)}>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Team</h1>
          <p className="text-muted-content text-sm mt-1">{pagination?.total || 0} members</p>
        </div>
        {isAdmin && (
          <button onClick={() => setIsAddModalOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add user
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-content" />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="input pl-9" 
          />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="input w-36">
          <option value="All">All Roles</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="developer">Developer</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-36">
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Suspended">Suspended</option>
        </select>
      </div>

      {isLoading ? (
        <div className="glass-card divide-y divide-theme">
          {[...Array(8)].map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : users.length === 0 ? (
        <EmptyState icon={UserCog} title="No users found" message="No users match your filters" />
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-theme text-left">
                  <th className="px-5 py-3 text-secondary-content font-medium">User</th>
                  <th className="px-5 py-3 text-secondary-content font-medium hidden sm:table-cell">Job Title</th>
                  <th className="px-5 py-3 text-secondary-content font-medium hidden md:table-cell">Role</th>
                  <th className="px-5 py-3 text-secondary-content font-medium hidden lg:table-cell">Joined</th>
                  <th className="px-5 py-3 text-secondary-content font-medium hidden lg:table-cell">Last Login</th>
                  <th className="px-5 py-3 text-secondary-content font-medium">Status</th>
                  {isAdmin && <th className="px-5 py-3 text-secondary-content font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-theme">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar user={u} size="sm" />
                        <div>
                          <p className="font-medium text-primary-content">{u.name}</p>
                          <p className="text-xs text-muted-content">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell text-secondary-content">
                      {u.profile?.jobTitle || '-'}
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell text-muted-content text-xs">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell text-muted-content text-xs">
                      {u.lastLogin ? formatRelative(u.lastLogin) : 'Never'}
                    </td>
                    <td className="px-5 py-3">
                      {getStatusBadge(u)}
                    </td>
                    
                    {isAdmin && (
                      <td className="px-5 py-3 text-right relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown(activeDropdown === u._id ? null : u._id);
                          }}
                          className="p-1.5 hover:bg-elevated rounded-lg text-secondary-content transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {activeDropdown === u._id && (
                          <div className="absolute right-8 top-10 w-48 bg-surface border border-theme rounded-xl shadow-xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95">
                            <button
                              onClick={() => { /* View Profile Logic */ }}
                              className="w-full text-left px-4 py-2 text-sm text-secondary-content hover:bg-elevated hover:text-primary-content flex items-center gap-2"
                            >
                              <User size={14} /> View public profile
                            </button>
                            <button
                              onClick={() => setEditUser(u)}
                              className="w-full text-left px-4 py-2 text-sm text-secondary-content hover:bg-elevated hover:text-primary-content flex items-center gap-2"
                            >
                              <Edit2 size={14} /> Edit user
                            </button>
                            <button
                              onClick={() => setSuspendUser(u)}
                              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                                u.isSuspended ? 'text-green-400 hover:bg-green-500/10' : 'text-orange-400 hover:bg-orange-500/10'
                              }`}
                            >
                              {u.isSuspended ? <UserCheck size={14} /> : <UserX size={14} />}
                              {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                            </button>
                            <button
                              onClick={() => setDeleteUser(u)}
                              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                            >
                              <Trash2 size={14} /> Delete user
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination pagination={pagination} onPageChange={setPage} />

      <ConfirmDialog
        isOpen={!!suspendUser}
        onClose={() => setSuspendUser(null)}
        onConfirm={handleToggleSuspend}
        title={suspendUser?.isSuspended ? 'Unsuspend User' : 'Suspend User'}
        message={`Are you sure you want to ${suspendUser?.isSuspended ? 'unsuspend' : 'suspend'} ${suspendUser?.name}?`}
        confirmLabel="Confirm"
        isLoading={isToggling}
      />

      {deleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface rounded-2xl w-full max-w-md border border-theme shadow-card overflow-hidden animate-in zoom-in-95">
            <div className="p-6">
              <h2 className="text-xl font-bold text-primary-content mb-2">Delete User</h2>
              <p className="text-secondary-content mb-4">
                This will permanently remove <strong className="text-primary-content">{deleteUser.name}</strong> from FlowDesk. 
                Their tasks will be unassigned. This cannot be undone.
              </p>
              <div className="mb-4">
                <label className="label text-xs">Type the user's name to confirm</label>
                <input 
                  type="text" 
                  className="input" 
                  value={deleteConfirmName} 
                  onChange={(e) => setDeleteConfirmName(e.target.value)} 
                  placeholder={deleteUser.name}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteUser(null)} className="btn-secondary">Cancel</button>
                <button 
                  onClick={handleDeleteUser} 
                  disabled={isDeleting || deleteConfirmName !== deleteUser.name} 
                  className="btn-danger"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAddModalOpen && <AddUserModal onClose={() => setIsAddModalOpen(false)} onSuccess={load} />}
      {editUser && <EditUserModal user={editUser} onClose={() => setEditUser(null)} onSuccess={load} />}
    </div>
  );
};

export default TeamPage;
