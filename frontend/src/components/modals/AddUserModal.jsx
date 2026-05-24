import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Copy, RefreshCw } from 'lucide-react';
import { usersApi } from '../../api/usersApi';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'manager', 'developer']),
  jobTitle: z.string().optional(),
});

const generateRandomPassword = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
  let pass = '';
  for (let i = 0; i < 12; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
};

const AddUserModal = ({ onClose, onSuccess }) => {
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, setValue, getValues, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role: 'developer', password: generateRandomPassword() },
  });

  const handleGeneratePassword = () => {
    const p = generateRandomPassword();
    setValue('password', p, { shouldValidate: true });
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(getValues('password'));
    toast.success('Password copied to clipboard');
  };

  const onSubmit = async (data) => {
    try {
      await usersApi.create(data);
      toast.success('User created. They can now log in immediately.');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-surface rounded-2xl w-full max-w-lg border border-theme shadow-card flex flex-col max-h-[90vh] animate-in zoom-in-95">
        <div className="flex items-center justify-between p-6 border-b border-theme shrink-0">
          <div>
            <h2 className="text-xl font-bold text-primary-content">Add New User</h2>
            <p className="text-sm text-secondary-content mt-1">Create an account manually.</p>
          </div>
          <button onClick={onClose} className="p-2 text-secondary-content hover:text-primary-content rounded-lg hover:bg-elevated transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="add-user-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

            <div>
              <label className="label flex justify-between items-center">
                <span>Password *</span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={handleGeneratePassword} className="text-xs text-primary-400 flex items-center gap-1 hover:text-primary-300">
                    <RefreshCw size={12} /> Generate
                  </button>
                  <button type="button" onClick={handleCopyPassword} className="text-xs text-primary-400 flex items-center gap-1 hover:text-primary-300">
                    <Copy size={12} /> Copy
                  </button>
                </div>
              </label>
              <input 
                type={showPass ? "text" : "password"} 
                className={`input font-mono ${errors.password ? 'input-error' : ''}`} 
                {...register('password')} 
                onFocus={() => setShowPass(true)}
                onBlur={() => setShowPass(false)}
              />
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
              <p className="text-xs text-muted-content mt-1">Share this password with the user securely.</p>
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
                <input type="text" className="input" {...register('jobTitle')} placeholder="e.g. Frontend Engineer" />
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-theme flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button form="add-user-form" disabled={isSubmitting} type="submit" className="btn-primary">
            {isSubmitting ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddUserModal;
