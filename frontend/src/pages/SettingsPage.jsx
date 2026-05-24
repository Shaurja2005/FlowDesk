import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import { githubApi } from '../api/githubApi';
import Avatar from '../components/Avatar';
import toast from 'react-hot-toast';
import { User, Lock, Bell, LayoutGrid, AlertTriangle, Camera, Link as LinkIcon, Trash2 } from 'lucide-react';
import GithubIcon from '../components/icons/GithubIcon';

const profileSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  publicName: z.string().optional(),
  pronouns: z.string().optional(),
  bio: z.string().max(300, 'Bio cannot exceed 300 characters').optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  organization: z.string().optional(),
  basedIn: z.string().optional(),
  timezone: z.string().optional(),
});

const accountSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required to make account changes'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine((d) => {
  if (d.newPassword && d.newPassword.length < 6) return false;
  return true;
}, {
  message: "New password must be at least 6 characters",
  path: ['newPassword'],
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const timezones = Intl.supportedValuesOf('timeZone');

const SettingsPage = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  
  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      publicName: user?.profile?.publicName || '',
      pronouns: user?.profile?.pronouns || '',
      bio: user?.profile?.bio || '',
      jobTitle: user?.profile?.jobTitle || '',
      department: user?.profile?.department || '',
      organization: user?.profile?.organization || '',
      basedIn: user?.profile?.basedIn || '',
      timezone: user?.profile?.timezone || '',
    },
  });

  const accountForm = useForm({
    resolver: zodResolver(accountSchema),
    defaultValues: { email: user?.email || '', currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const selectedTimezone = profileForm.watch('timezone');
  const [localTime, setLocalTime] = useState('');

  useEffect(() => {
    if (!selectedTimezone) return;
    const interval = setInterval(() => {
      try {
        const time = new Intl.DateTimeFormat('en-US', {
          timeZone: selectedTimezone,
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
          hour12: true,
        }).format(new Date());
        setLocalTime(time);
      } catch (e) {
        setLocalTime('Invalid timezone');
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedTimezone]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'github') {
      authApi.getMe().then(({ data }) => {
        updateUser(data.data);
        toast.success('GitHub account connected successfully!');
        window.history.replaceState({}, document.title, window.location.pathname);
      }).catch(() => {
        toast.error('Failed to refresh user data after GitHub connection');
      });
    } else if (params.get('error') === 'oauth_failed') {
      toast.error('GitHub connection failed. Please try again.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [updateUser]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size must be less than 2MB');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      profileForm.setValue('avatarChanged', true, { shouldDirty: true });
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile('remove');
    setAvatarPreview('remove');
    profileForm.setValue('avatarChanged', true, { shouldDirty: true });
  };

  const onProfileSubmit = async (data) => {
    try {
      const fd = new FormData();
      Object.keys(data).forEach(key => {
        if (key !== 'avatarChanged' && data[key] !== undefined) {
          fd.append(key, data[key]);
        }
      });
      if (avatarFile && avatarFile !== 'remove') {
        fd.append('avatar', avatarFile);
      } else if (avatarFile === 'remove') {
        fd.append('removeAvatar', 'true'); // Backend can handle this if implemented, otherwise ignore
      }

      const { data: res } = await authApi.updateProfile(fd);
      updateUser(res.data);
      toast.success('Profile updated successfully');
      profileForm.reset({ ...data, avatarChanged: false });
      setAvatarFile(null);
      // setAvatarPreview(null); // Keep preview if it was uploaded
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const onAccountSubmit = async (data) => {
    try {
      const payload = { currentPassword: data.currentPassword };
      if (data.newPassword) payload.newPassword = data.newPassword;
      if (data.email && data.email !== user.email) payload.email = data.email;

      await authApi.updateAccount(payload);
      toast.success('Account updated successfully');
      if (payload.email) {
        updateUser({ ...user, email: payload.email });
      }
      accountForm.reset({ ...data, currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Account update failed');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'account', label: 'Account', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'integrations', label: 'Integrations', icon: LayoutGrid },
    { id: 'danger', label: 'Danger zone', icon: AlertTriangle, className: 'text-red-500 hover:text-red-400 hover:bg-red-500/10' },
  ];

  const bioContent = profileForm.watch('bio') || '';

  return (
    <div className="max-w-6xl mx-auto animate-fade-in pb-20">
      <h1 className="page-title mb-8">Settings</h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Nav */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <nav className="flex flex-col space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-500/10 text-primary-content'
                    : `text-secondary-content hover:bg-black/5 dark:hover:bg-white/5 ${tab.className || 'hover:text-primary-content'}`
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          {activeTab === 'profile' && (
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6 max-w-3xl">
              
              {/* Avatar Section */}
              <section className="glass-card p-6">
                <h3 className="text-lg font-semibold text-primary-content mb-4">Avatar</h3>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar
                      user={avatarPreview === 'remove' ? { ...user, profile: { ...user.profile, avatarUrl: null } } : (avatarPreview ? { ...user, profile: { ...user.profile, avatarUrl: avatarPreview } } : user)}
                      size="xl"
                      className="w-24 h-24 text-2xl"
                      clickable={false}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <label htmlFor="avatar-upload" className="btn-primary py-2 px-4 cursor-pointer">
                        Change photo
                        <input id="avatar-upload" type="file" accept=".jpg,.png,.gif" className="hidden" onChange={handleAvatarChange} />
                      </label>
                      <button type="button" onClick={handleRemoveAvatar} className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors">
                        Remove photo
                      </button>
                    </div>
                    <p className="text-xs text-muted-content">Accepts .jpg, .png, .gif up to 2MB.</p>
                  </div>
                </div>
              </section>

              {/* Basic Info */}
              <section className="glass-card p-6 space-y-5">
                <h3 className="text-lg font-semibold text-primary-content mb-2">Profile information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="label">Full name *</label>
                    <input className={`input ${profileForm.formState.errors.name ? 'input-error' : ''}`} {...profileForm.register('name')} />
                    {profileForm.formState.errors.name && <p className="text-red-400 text-xs mt-1">{profileForm.formState.errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="label">Public name</label>
                    <input className="input" placeholder="How others see you" {...profileForm.register('publicName')} />
                  </div>
                  <div>
                    <label className="label">Pronouns</label>
                    <input className="input" placeholder="e.g. they/them" {...profileForm.register('pronouns')} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="label !mb-0">Bio</label>
                    <span className={`text-xs ${bioContent.length > 300 ? 'text-red-400' : 'text-muted-content'}`}>
                      {bioContent.length} / 300
                    </span>
                  </div>
                  <textarea 
                    className={`input min-h-[100px] resize-y ${profileForm.formState.errors.bio ? 'input-error' : ''}`} 
                    placeholder="Tell your team a bit about yourself..."
                    {...profileForm.register('bio')} 
                  />
                  {profileForm.formState.errors.bio && <p className="text-red-400 text-xs mt-1">{profileForm.formState.errors.bio.message}</p>}
                </div>
              </section>

              {/* Work Details */}
              <section className="glass-card p-6 space-y-5">
                <h3 className="text-lg font-semibold text-primary-content mb-2">Work details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="label">Job title</label>
                    <input className="input" placeholder="Your job title" {...profileForm.register('jobTitle')} />
                  </div>
                  <div>
                    <label className="label">Department</label>
                    <input className="input" placeholder="Your department" {...profileForm.register('department')} />
                  </div>
                  <div>
                    <label className="label">Organization</label>
                    <input className="input" placeholder="Your organization" {...profileForm.register('organization')} />
                  </div>
                  <div>
                    <label className="label">Based in</label>
                    <input className="input" placeholder="City, Country" {...profileForm.register('basedIn')} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">Time zone</label>
                    <select className="input cursor-pointer" {...profileForm.register('timezone')}>
                      <option value="">Select your timezone</option>
                      {timezones.map(tz => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                    {!selectedTimezone ? (
                      <p className="text-xs text-amber-500 mt-2">You have not set your timezone yet.</p>
                    ) : (
                      <p className="text-xs text-muted-content mt-2">Local time preview: <span className="font-medium text-primary-content">{localTime}</span></p>
                    )}
                  </div>
                </div>
              </section>

              {/* Unsaved Changes Banner */}
              {profileForm.formState.isDirty && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-40 animate-slide-up">
                  <div className="glass-card bg-dark-800/90 border-primary-500/30 p-4 flex items-center justify-between shadow-2xl">
                    <span className="text-sm text-primary-content font-medium">You have unsaved changes</span>
                    <div className="flex gap-3">
                      <button 
                        type="button" 
                        onClick={() => {
                          profileForm.reset();
                          setAvatarFile(null);
                          setAvatarPreview(null);
                        }} 
                        className="btn-ghost"
                      >
                        Discard
                      </button>
                      <button 
                        type="submit" 
                        disabled={profileForm.formState.isSubmitting} 
                        className="btn-primary"
                      >
                        {profileForm.formState.isSubmitting ? 'Saving...' : 'Save changes'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          )}

          {activeTab === 'account' && (
            <form onSubmit={accountForm.handleSubmit(onAccountSubmit)} className="space-y-6 max-w-2xl">
              
              <section className="glass-card p-6 space-y-5">
                <h3 className="text-lg font-semibold text-primary-content mb-2">Change Email</h3>
                <div>
                  <label className="label">Email address</label>
                  <input type="email" className={`input ${accountForm.formState.errors.email ? 'input-error' : ''}`} {...accountForm.register('email')} />
                  {accountForm.formState.errors.email && <p className="text-red-400 text-xs mt-1">{accountForm.formState.errors.email.message}</p>}
                </div>
              </section>

              <section className="glass-card p-6 space-y-5">
                <h3 className="text-lg font-semibold text-primary-content mb-2">Change Password</h3>
                <div>
                  <label className="label">New password</label>
                  <input type="password" placeholder="Leave blank to keep current password" className={`input ${accountForm.formState.errors.newPassword ? 'input-error' : ''}`} {...accountForm.register('newPassword')} />
                  {accountForm.formState.errors.newPassword && <p className="text-red-400 text-xs mt-1">{accountForm.formState.errors.newPassword.message}</p>}
                </div>
                <div>
                  <label className="label">Confirm new password</label>
                  <input type="password" placeholder="Confirm new password" className={`input ${accountForm.formState.errors.confirmPassword ? 'input-error' : ''}`} {...accountForm.register('confirmPassword')} />
                  {accountForm.formState.errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{accountForm.formState.errors.confirmPassword.message}</p>}
                </div>
              </section>

              <section className="glass-card p-6 space-y-5 border border-primary-500/20 bg-primary-500/5">
                <h3 className="text-lg font-semibold text-primary-content mb-2 flex items-center gap-2">
                  <Lock size={18} className="text-primary-500" />
                  Confirm Changes
                </h3>
                <p className="text-sm text-secondary-content">Please enter your current password to save account changes.</p>
                <div>
                  <label className="label">Current password *</label>
                  <input type="password" className={`input ${accountForm.formState.errors.currentPassword ? 'input-error' : ''}`} {...accountForm.register('currentPassword')} />
                  {accountForm.formState.errors.currentPassword && <p className="text-red-400 text-xs mt-1">{accountForm.formState.errors.currentPassword.message}</p>}
                </div>
                <div className="pt-2">
                  <button type="submit" disabled={accountForm.formState.isSubmitting} className="btn-primary w-full sm:w-auto">
                    {accountForm.formState.isSubmitting ? 'Saving...' : 'Save Account Changes'}
                  </button>
                </div>
              </section>
            </form>
          )}

          {/* Placeholders for other tabs */}
          {['notifications', 'danger'].includes(activeTab) && (
            <div className="glass-card p-12 text-center">
              <h3 className="text-lg font-semibold text-primary-content mb-2 capitalize">{activeTab}</h3>
              <p className="text-secondary-content">This section is currently under development.</p>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-6 max-w-3xl animate-fade-in">
              <section className="glass-card p-6 space-y-5">
                <h3 className="text-lg font-semibold text-primary-content mb-2">Connected Accounts</h3>
                <p className="text-sm text-secondary-content mb-4">Connect your external accounts to enable seamless integrations across FlowDesk.</p>
                
                <div className="flex items-center justify-between p-5 border border-primary-500/20 bg-dark-700/30 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#24292e] rounded-full flex items-center justify-center text-white shadow-lg">
                      <GithubIcon size={24} />
                    </div>
                    <div>
                      <p className="font-semibold text-primary-content text-base">GitHub</p>
                      {user?.github?.accessToken ? (
                        <div className="flex items-center gap-2 mt-0.5">
                          {user.github.avatarUrl && <img src={user.github.avatarUrl} alt="GitHub Avatar" className="w-5 h-5 rounded-full" />}
                          <span className="text-sm text-green-400 font-medium">Connected as {user.github.username}</span>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-content mt-0.5">Not connected</p>
                      )}
                    </div>
                  </div>
                  
                  {user?.github?.accessToken ? (
                    <button 
                      type="button" 
                      className="btn-ghost text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={async () => {
                        if (confirm('Are you sure you want to disconnect GitHub? Linked repositories and PRs will no longer sync.')) {
                          try {
                            await githubApi.disconnect();
                            const { data } = await authApi.getMe();
                            updateUser(data.data);
                            toast.success('GitHub disconnected');
                          } catch (err) {
                            toast.error('Failed to disconnect GitHub');
                          }
                        }
                      }}
                    >
                      <Trash2 size={16} className="mr-2 inline" />
                      Disconnect
                    </button>
                  ) : (
                    <a 
                      href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/integrations/github/connect`} 
                      className="btn-primary"
                    >
                      <LinkIcon size={16} className="mr-2 inline" />
                      Connect GitHub
                    </a>
                  )}
                </div>
              </section>

              <section className="glass-card p-6">
                <h3 className="text-lg font-semibold text-primary-content mb-4">Coming Soon</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {['GitLab', 'Bitbucket', 'Slack', 'Linear'].map(provider => (
                    <div key={provider} className="p-4 border border-dark-600 rounded-xl bg-dark-800/50 opacity-70 flex items-center justify-between group hover:opacity-100 transition-opacity">
                      <p className="font-medium text-secondary-content">{provider}</p>
                      <button 
                        type="button" 
                        className="text-xs font-medium px-3 py-1.5 rounded-md bg-dark-600 text-muted-content hover:text-primary-content hover:bg-dark-500 transition-colors"
                        onClick={() => toast("We'll let you know when this integration is ready!", { icon: '🔔' })}
                      >
                        Notify me
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default SettingsPage;
