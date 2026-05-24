import { useState, useEffect } from 'react';
import { X, MapPin, Briefcase, Clock, Building } from 'lucide-react';
import { usersApi } from '../api/usersApi';
import Avatar from './Avatar';
import toast from 'react-hot-toast';

const PublicProfilePanel = ({ userId, onClose }) => {
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data } = await usersApi.getPublicProfile(userId);
        setProfileUser(data.data);
      } catch (err) {
        toast.error('Failed to load public profile');
        onClose();
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchProfile();
  }, [userId, onClose]);

  // Click outside to close
  useEffect(() => {
    const handleEscape = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const getLocalTime = (timezone) => {
    try {
      if (!timezone) return null;
      const date = new Date();
      return new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }).format(date);
    } catch {
      return null;
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-40 animate-fade-in" 
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-sm glass-card rounded-none border-l border-theme shadow-2xl z-50 animate-slide-left flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-theme">
          <h2 className="text-lg font-semibold text-primary-content">Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-muted-content hover:text-primary-content">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-col items-center text-center mb-8">
              <Avatar user={profileUser} size="xl" className="mb-4" clickable={false} />
              <h3 className="text-xl font-bold text-primary-content">
                {profileUser?.profile?.publicName || profileUser?.name}
              </h3>
              {profileUser?.profile?.pronouns && (
                <p className="text-sm text-muted-content mt-1">({profileUser.profile.pronouns})</p>
              )}
            </div>

            {profileUser?.profile?.bio && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-primary-content mb-2">About</h4>
                <p className="text-sm text-secondary-content leading-relaxed">{profileUser.profile.bio}</p>
              </div>
            )}

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-primary-content border-b border-theme pb-2">Work & Contact</h4>
              
              {profileUser?.profile?.jobTitle && (
                <div className="flex items-center gap-3 text-sm text-secondary-content">
                  <Briefcase size={16} className="text-muted-content" />
                  <span>{profileUser.profile.jobTitle}</span>
                </div>
              )}
              
              {profileUser?.profile?.department && (
                <div className="flex items-center gap-3 text-sm text-secondary-content">
                  <Building size={16} className="text-muted-content" />
                  <span>{profileUser.profile.department} {profileUser?.profile?.organization ? `at ${profileUser.profile.organization}` : ''}</span>
                </div>
              )}

              {profileUser?.profile?.basedIn && (
                <div className="flex items-center gap-3 text-sm text-secondary-content">
                  <MapPin size={16} className="text-muted-content" />
                  <span>{profileUser.profile.basedIn}</span>
                </div>
              )}

              {profileUser?.profile?.timezone && (
                <div className="flex items-center gap-3 text-sm text-secondary-content">
                  <Clock size={16} className="text-muted-content" />
                  <span>{getLocalTime(profileUser.profile.timezone)} local time</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PublicProfilePanel;
