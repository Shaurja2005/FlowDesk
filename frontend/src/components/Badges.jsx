import { getStatusClass, getPriorityClass } from '../utils/constants';

export const StatusBadge = ({ status }) => {
  const label = {
    todo: 'To Do',
    'in-progress': 'In Progress',
    'in-review': 'In Review',
    done: 'Done',
    blocked: 'Blocked',
    planning: 'Planning',
    active: 'Active',
    'on-hold': 'On Hold',
    completed: 'Completed',
  }[status] || status;

  return <span className={getStatusClass(status)}>{label}</span>;
};

export const PriorityBadge = ({ priority }) => {
  const icons = { low: '↓', medium: '→', high: '↑', critical: '🔥' };
  const label = priority?.charAt(0).toUpperCase() + priority?.slice(1);

  return (
    <span className={getPriorityClass(priority)}>
      {icons[priority]} {label}
    </span>
  );
};

export const RoleBadge = ({ role }) => {
  const styles = {
    admin: 'bg-purple-500/20 text-purple-300',
    manager: 'bg-blue-500/20 text-blue-300',
    developer: 'bg-green-500/20 text-green-300',
  };
  return (
    <span className={`badge ${styles[role] || 'bg-gray-500/20 text-gray-300'}`}>
      {role?.charAt(0).toUpperCase() + role?.slice(1)}
    </span>
  );
};
