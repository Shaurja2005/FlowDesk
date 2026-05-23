const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const asyncHandler = require('../middlewares/asyncHandler');
const { successResponse } = require('../utils/response');
const { ROLES } = require('../config/constants');

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
const getDashboardStats = asyncHandler(async (req, res) => {
  const { role, _id: userId } = req.user;

  let projectQuery = {};
  if (role !== ROLES.ADMIN) {
    projectQuery = {
      $or: [{ owner: userId }, { 'members.user': userId }],
    };
  }

  const userProjects = await Project.find(projectQuery).select('_id');
  const projectIds = userProjects.map((p) => p._id);

  const taskQuery = role === ROLES.ADMIN
    ? {}
    : { project: { $in: projectIds } };

  // Run aggregations in parallel
  const [
    totalProjects,
    projectsByStatus,
    totalTasks,
    tasksByStatus,
    myTasks,
    overdueTasks,
    totalUsers,
  ] = await Promise.all([
    Project.countDocuments(projectQuery),
    Project.aggregate([
      { $match: projectQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Task.countDocuments({ ...taskQuery, parentTask: null }),
    Task.aggregate([
      { $match: { ...taskQuery, parentTask: null } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Task.countDocuments({ assignedTo: userId, parentTask: null }),
    Task.countDocuments({
      ...taskQuery,
      dueDate: { $lt: new Date() },
      status: { $ne: 'done' },
    }),
    role === ROLES.ADMIN ? User.countDocuments({ isActive: true }) : Promise.resolve(null),
  ]);

  // Format status maps
  const projectStatusMap = {};
  projectsByStatus.forEach((p) => (projectStatusMap[p._id] = p.count));

  const taskStatusMap = {};
  tasksByStatus.forEach((t) => (taskStatusMap[t._id] = t.count));

  // Task completion rate over last 7 days (for sparkline)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const weeklyActivity = await Task.aggregate([
    {
      $match: {
        ...taskQuery,
        updatedAt: { $gte: sevenDaysAgo },
        status: 'done',
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return successResponse(res, {
    projects: {
      total: totalProjects,
      byStatus: projectStatusMap,
    },
    tasks: {
      total: totalTasks,
      byStatus: taskStatusMap,
      myTasks,
      overdue: overdueTasks,
      completionRate: totalTasks
        ? Math.round(((taskStatusMap.done || 0) / totalTasks) * 100)
        : 0,
    },
    weeklyActivity,
    ...(role === ROLES.ADMIN && { totalUsers }),
  });
});

// ─── My Tasks ─────────────────────────────────────────────────────────────────
const getMyTasks = asyncHandler(async (req, res) => {
  const { status, priority, limit = 20 } = req.query;
  const query = { assignedTo: req.user._id, parentTask: null };
  if (status) query.status = status;
  if (priority) query.priority = priority;

  const tasks = await Task.find(query)
    .populate('project', 'title')
    .sort({ dueDate: 1, priority: -1 })
    .limit(parseInt(limit));

  return successResponse(res, tasks, 'My tasks fetched');
});

// ─── Recent Activity ──────────────────────────────────────────────────────────
const getRecentActivity = asyncHandler(async (req, res) => {
  const { limit = 15 } = req.query;
  const { role, _id: userId } = req.user;

  let query = {};
  if (role !== ROLES.ADMIN) query.user = userId;

  const activity = await ActivityLog.find(query)
    .populate('user', 'name avatar')
    .populate('project', 'title')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  return successResponse(res, activity, 'Recent activity fetched');
});

module.exports = { getDashboardStats, getMyTasks, getRecentActivity };
