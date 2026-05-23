// Shared enums and constants used across models and controllers

const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  DEVELOPER: 'developer',
};

const PROJECT_STATUS = {
  PLANNING: 'planning',
  ACTIVE: 'active',
  ON_HOLD: 'on-hold',
  COMPLETED: 'completed',
};

const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in-progress',
  IN_REVIEW: 'in-review',
  DONE: 'done',
  BLOCKED: 'blocked',
};

const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

const NOTIFICATION_TYPES = {
  TASK_ASSIGNED: 'task_assigned',
  TASK_UPDATED: 'task_updated',
  COMMENT_ADDED: 'comment_added',
  PROJECT_INVITE: 'project_invite',
  STATUS_CHANGE: 'status_change',
  MENTION: 'mention',
  DEADLINE: 'deadline',
};

const ACTIVITY_ACTIONS = {
  CREATED: 'created',
  UPDATED: 'updated',
  DELETED: 'deleted',
  ASSIGNED: 'assigned',
  COMMENTED: 'commented',
  STATUS_CHANGED: 'status_changed',
  MEMBER_ADDED: 'member_added',
  MEMBER_REMOVED: 'member_removed',
  TIME_LOGGED: 'time_logged',
};

module.exports = {
  ROLES,
  PROJECT_STATUS,
  TASK_STATUS,
  PRIORITY,
  NOTIFICATION_TYPES,
  ACTIVITY_ACTIONS,
};
