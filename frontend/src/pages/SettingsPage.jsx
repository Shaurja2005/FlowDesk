import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import Avatar from '../components/Avatar';
import { RoleBadge } from '../components/Badges';
import { formatDate } from '../utils/formatDate';
import toast from 'react-hot-toast';
import { Camera, Lock, User } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(6, 'Min 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const SettingsPage = () => {
  const { user, updateUser } = useAuth();
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '', email: user?.email || '' },
  });

  const passwordForm = useForm({ resolver: zodResolver(passwordSchema) });

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const onProfileSubmit = async (data) => {
    try {
      const fd = new FormData();
      fd.append('name', data.name);
      fd.append('email', data.email);
      if (avatarFile) fd.append('avatar', avatarFile);
      const { data: res } = await authApi.updateProfile(fd);
      updateUser(res.data);
      toast.success('Profile updated!');
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const onPasswordSubmit = async (data) => {
    try {
      await authApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password changed!');
      passwordForm.reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <h1 className="page-title mb-6">Settings</h1>

      {/* Tabs */}
      <div className="flex border-b border-white/5 mb-6">
        {['profile', 'password'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab ? 'border-primary-500 text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab === 'profile' ? <><User size={14} className="inline mr-1.5" />Profile</> : <><Lock size={14} className="inline mr-1.5" />Password</>}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-5">
          {/* Avatar */}
          <div className="glass-card p-5 flex items-center gap-5">
            <div className="relative">
              <Avatar
                user={avatarPreview ? { name: user?.name, avatar: avatarPreview } : user}
                size="xl"
              />
              <label htmlFor="avatar-upload" className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-600 transition-colors">
                <Camera size={13} className="text-white" />
                <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>
            <div>
              <p className="font-semibold text-white">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <div className="mt-1"><RoleBadge role={user?.role} /></div>
            </div>
          </div>

          <div className="glass-card p-5 space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input className={`input ${profileForm.formState.errors.name ? 'input-error' : ''}`} {...profileForm.register('name')} />
              {profileForm.formState.errors.name && <p className="text-red-400 text-xs mt-1">{profileForm.formState.errors.name.message}</p>}
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className={`input ${profileForm.formState.errors.email ? 'input-error' : ''}`} {...profileForm.register('email')} />
              {profileForm.formState.errors.email && <p className="text-red-400 text-xs mt-1">{profileForm.formState.errors.email.message}</p>}
            </div>
            <div>
              <label className="label">Member Since</label>
              <p className="text-sm text-gray-400">{formatDate(user?.createdAt)}</p>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={profileForm.formState.isSubmitting} className="btn-primary">
                {profileForm.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      )}

      {activeTab === 'password' && (
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="glass-card p-5 space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input type="password" className={`input ${passwordForm.formState.errors.currentPassword ? 'input-error' : ''}`} {...passwordForm.register('currentPassword')} />
            {passwordForm.formState.errors.currentPassword && <p className="text-red-400 text-xs mt-1">{passwordForm.formState.errors.currentPassword.message}</p>}
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" className={`input ${passwordForm.formState.errors.newPassword ? 'input-error' : ''}`} {...passwordForm.register('newPassword')} />
            {passwordForm.formState.errors.newPassword && <p className="text-red-400 text-xs mt-1">{passwordForm.formState.errors.newPassword.message}</p>}
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input type="password" className={`input ${passwordForm.formState.errors.confirmPassword ? 'input-error' : ''}`} {...passwordForm.register('confirmPassword')} />
            {passwordForm.formState.errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>}
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={passwordForm.formState.isSubmitting} className="btn-primary">
              {passwordForm.formState.isSubmitting ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SettingsPage;
