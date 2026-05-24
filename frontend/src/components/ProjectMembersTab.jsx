import { useState, useEffect } from 'react';
import { UserPlus, Trash2, Crown } from 'lucide-react';
import { projectsApi } from '../api/projectsApi';
import { usersApi } from '../api/usersApi';
import Avatar from './Avatar';
import { RoleBadge } from './Badges';
import { ConfirmDialog } from './Modal';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ProjectMembersTab = ({ project, onUpdate, canManage }) => {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('developer');
  const [isAdding, setIsAdding] = useState(false);
  const [removeId, setRemoveId] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    if (canManage) {
      usersApi.getAll({ limit: 100 }).then(({ data }) => setAllUsers(data.data)).catch(() => {});
    }
  }, [canManage]);

  const members = project?.members || [];
  const memberIds = new Set(members.map((m) => m.user?._id || m.user));
  const nonMembers = allUsers.filter((u) => !memberIds.has(u._id));

  const handleAdd = async () => {
    if (!selectedUser) return;
    setIsAdding(true);
    try {
      const { data } = await projectsApi.addMember(project._id, {
        userId: selectedUser,
        role: selectedRole,
      });
      // Refresh project
      const proj = await projectsApi.getById(project._id);
      onUpdate(proj.data.data);
      setSelectedUser('');
      toast.success('Member added!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally { setIsAdding(false); }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await projectsApi.removeMember(project._id, removeId);
      const proj = await projectsApi.getById(project._id);
      onUpdate(proj.data.data);
      toast.success('Member removed');
    } catch {
      toast.error('Failed to remove member');
    } finally {
      setIsRemoving(false);
      setRemoveId(null);
    }
  };

  return (
    <div>
      {/* Add member */}
      {canManage && (
        <div className="glass-card p-4 mb-4 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-40">
            <label className="label text-xs">Add Member</label>
            <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="input">
              <option value="">Select user...</option>
              {nonMembers.map((u) => (
                <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>
          <div className="w-36">
            <label className="label text-xs">Role</label>
            <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="input">
              <option value="developer">Developer</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button onClick={handleAdd} disabled={!selectedUser || isAdding} className="btn-primary flex items-center gap-2 h-9">
            <UserPlus size={15} /> {isAdding ? 'Adding...' : 'Add'}
          </button>
        </div>
      )}

      {/* Members list */}
      <div className="glass-card overflow-hidden">
        <div className="divide-y divide-white/5">
          {members.map((member) => {
            const u = member.user;
            const isOwner = project.owner?._id === u?._id || project.owner === u?._id;
            return (
              <div key={u?._id} className="flex items-center gap-4 px-5 py-3 hover:bg-white/3 group">
                <Avatar user={u} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-primary-content">{u?.name}</p>
                    {isOwner && <Crown size={13} className="text-amber-400" />}
                  </div>
                  <p className="text-xs text-muted-content">{u?.email}</p>
                </div>
                <RoleBadge role={member.role} />
                {canManage && !isOwner && (
                  <button
                    onClick={() => setRemoveId(u?._id)}
                    className="btn-ghost p-1.5 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!removeId}
        onClose={() => setRemoveId(null)}
        onConfirm={handleRemove}
        title="Remove Member"
        message="Remove this member from the project? They'll lose access."
        confirmLabel="Remove"
        isLoading={isRemoving}
      />
    </div>
  );
};

export default ProjectMembersTab;
