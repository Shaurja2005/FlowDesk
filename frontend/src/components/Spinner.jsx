export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10', xl: 'w-16 h-16' };
  return (
    <div className={`${sizes[size]} border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin ${className}`} />
  );
};

export const FullPageSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-base/80 z-50">
    <div className="text-center">
      <Spinner size="xl" />
      <p className="mt-3 text-secondary-content text-sm">Loading...</p>
    </div>
  </div>
);

export const EmptyState = ({ icon: Icon, title, message, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {Icon && (
      <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center mb-4">
        <Icon size={32} className="text-primary-400" />
      </div>
    )}
    <h3 className="text-lg font-semibold text-primary-content mb-2">{title}</h3>
    {message && <p className="text-secondary-content text-sm max-w-sm mb-6">{message}</p>}
    {action}
  </div>
);

export const SkeletonCard = () => (
  <div className="glass-card p-4 space-y-3">
    <div className="skeleton h-4 w-3/4 rounded" />
    <div className="skeleton h-3 w-full rounded" />
    <div className="skeleton h-3 w-2/3 rounded" />
    <div className="flex gap-2 mt-4">
      <div className="skeleton h-6 w-16 rounded-full" />
      <div className="skeleton h-6 w-16 rounded-full" />
    </div>
  </div>
);

export const SkeletonRow = () => (
  <div className="flex items-center gap-4 p-3">
    <div className="skeleton w-8 h-8 rounded-full" />
    <div className="flex-1 space-y-2">
      <div className="skeleton h-3 w-1/2 rounded" />
      <div className="skeleton h-2 w-1/3 rounded" />
    </div>
    <div className="skeleton h-6 w-16 rounded-full" />
  </div>
);
