import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { usersApi } from '../../api/usersApi';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'manager', 'developer']),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
});

const EditUserModal = ({ user, onClose, onSuccess }) => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      role: user?.role || 'developer',
      jobTitle: user?.profile?.jobTitle || '',
      department: user?.profile?.department || '',
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        role: user.role,
        jobTitle: user.profile?.jobTitle || '',
        department: user.profile?.department || '',
      });
    }
  }, [user, reset]);

  const onSubmit = async (data) => {
    try {
      await usersApi.update(user._id, data);
      toast.success('User updated successfully');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-surface rounded-2xl w-full max-w-lg border border-theme shadow-card flex flex-col max-h-[90vh] animate-in zoom-in-95">
        <div className="flex items-center justify-between p-6 border-b border-theme shrink-0">
          <div>
            <h2 className="text-xl font-bold text-primary-content">Edit User</h2>
            <p className="text-sm text-secondary-content mt-1">Update profile and permissions.</p>
          </div>
          <button onClick={onClose} className="p-2 text-secondary-content hover:text-primary-content rounded-lg hover:bg-elevated transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="edit-user-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Full Name *</label>
              <input type="text" className={`input ${errors.name ? 'input-error' : ''}`} {...register('name')} />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="label">Email Address *</label>
              <input type="email" className={`input ${errors.email ? 'input-error' : ''}`} {...register('email')} />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Role *</label>
                <select className={`input ${errors.role ? 'input-error' : ''}`} {...register('role')}>
                  <option value="developer">Developer</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
                {errors.role && <p className="text-red-400 text-xs mt-1">{errors.role.message}</p>}
              </div>

              <div>
                <label className="label">Job Title</label>
                <input type="text" className="input" {...register('jobTitle')} />
              </div>
            </div>
            
            <div>
              <label className="label">Department</label>
              <input type="text" className="input" {...register('department')} />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-theme flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button form="edit-user-form" disabled={isSubmitting} type="submit" className="btn-primary">
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;
