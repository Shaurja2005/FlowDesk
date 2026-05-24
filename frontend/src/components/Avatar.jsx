import { getInitials } from '../utils/constants';

const COLORS = [
  'bg-primary-500', 'bg-accent-cyan', 'bg-pink-500',
  'bg-amber-500', 'bg-emerald-500', 'bg-purple-500',
];

const getColor = (name = '') => {
  const idx = name.charCodeAt(0) % COLORS.length;
  return COLORS[idx];
};

const Avatar = ({ user, size = 'md', className = '' }) => {
  const sizes = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base', xl: 'w-14 h-14 text-lg' };
  const sizeClass = sizes[size] || sizes.md;

  if (user?.avatar) {
    return (
      <img
        src={user.avatar.startsWith('http') ? user.avatar : `http://localhost:5000${user.avatar}`}
        alt={user.name}
        className={`${sizeClass} rounded-full object-cover ring-2 ring-white/10 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} ${getColor(user?.name)} rounded-full flex items-center justify-center font-semibold text-white ring-2 ring-white/10 ${className}`}
    >
      {getInitials(user?.name)}
    </div>
  );
};

export const AvatarGroup = ({ users = [], max = 4, size = 'sm' }) => {
  const visible = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className="flex -space-x-2">
      {visible.map((u, i) => (
        <Avatar key={u._id || i} user={u} size={size} />
      ))}
      {remaining > 0 && (
        <div className={`w-8 h-8 rounded-full bg-dark-400 border-2 border-dark-700 flex items-center justify-center text-xs text-gray-400 font-medium`}>
          +{remaining}
        </div>
      )}
    </div>
  );
};

export default Avatar;
