const ActivityLog = require('../models/ActivityLog');
const asyncHandler = require('../middlewares/asyncHandler');
const { paginate } = require('../utils/pagination');
const { successResponse } = require('../utils/response');

// ─── Get Global Activity Feed (Admin / Manager) ───────────────────────────────
const getActivityFeed = asyncHandler(async (req, res) => {
  const { page, limit, entity, action } = req.query;
  const query = {};
  if (entity) query.entity = entity;
  if (action) query.action = action;

  const result = await paginate(ActivityLog, query, {
    page,
    limit,
    sort: { createdAt: -1 },
    populate: [
      { path: 'user', select: 'name avatar role' },
      { path: 'project', select: 'title' },
    ],
  });

  return successResponse(res, result.data, 'Activity feed fetched', 200, result.pagination);
});

// ─── Get Project Activity Feed ────────────────────────────────────────────────
const getProjectActivity = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;

  const result = await paginate(
    ActivityLog,
    { project: req.params.projectId },
    {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: { path: 'user', select: 'name avatar' },
    }
  );

  return successResponse(res, result.data, 'Project activity fetched', 200, result.pagination);
});

module.exports = { getActivityFeed, getProjectActivity };
