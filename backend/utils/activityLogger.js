const ActivityLog = require('../models/ActivityLog');

/**
 * logActivity — creates an ActivityLog record asynchronously.
 * Non-blocking — errors are logged but do not bubble up.
 *
 * @param {Object} params
 * @param {string} params.userId    - Actor user ID
 * @param {string} params.action    - ACTIVITY_ACTIONS constant
 * @param {string} params.entity    - 'task' | 'project' | 'comment' | 'user'
 * @param {string} params.entityId  - MongoDB ObjectId of the entity
 * @param {string} params.entityTitle - Human-readable label
 * @param {string} [params.projectId] - Project context (optional)
 * @param {Object} [params.meta]    - Extra payload
 */
const logActivity = async ({
  userId,
  action,
  entity,
  entityId,
  entityTitle = '',
  projectId = null,
  meta = {},
}) => {
  try {
    await ActivityLog.create({
      user: userId,
      action,
      entity,
      entityId,
      entityTitle,
      project: projectId,
      meta,
    });
  } catch (err) {
    console.error('[ActivityLog] Failed to write log:', err.message);
  }
};

module.exports = { logActivity };
