export const TASK_STATUSES = [
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'in-review', label: 'In Review' },
  { value: 'done', label: 'Done' },
  { value: 'blocked', label: 'Blocked' },
];

export const PROJECT_STATUSES = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
];

export const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'developer', label: 'Developer' },
];

export const KANBAN_COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20' },
  { id: 'in-progress', title: 'In Progress', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { id: 'in-review', title: 'In Review', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  { id: 'done', title: 'Done', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  { id: 'blocked', title: 'Blocked', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
];

export const getStatusClass = (status) => {
  const map = {
    todo: 'status-todo',
    'in-progress': 'status-in-progress',
    'in-review': 'status-in-review',
    done: 'status-done',
    blocked: 'status-blocked',
    planning: 'status-planning',
    active: 'status-active',
    'on-hold': 'status-on-hold',
    completed: 'status-completed',
  };
  return map[status] || 'badge bg-gray-500/20 text-gray-700 dark:text-gray-300';
};

export const getPriorityClass = (priority) => {
  const map = {
    low: 'priority-low',
    medium: 'priority-medium',
    high: 'priority-high',
    critical: 'priority-critical',
  };
  return map[priority] || 'badge bg-slate-500/20 text-slate-300';
};

export const PROJECT_COVER_COLORS = [
  '#6C63FF', '#00D4FF', '#FF6B9D', '#FFB347',
  '#00C896', '#7B68EE', '#FF7F7F', '#64B5F6',
];

export const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
