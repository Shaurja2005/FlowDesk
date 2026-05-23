const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const asyncHandler = require('../middlewares/asyncHandler');
const { paginate } = require('../utils/pagination');
const { logActivity } = require('../utils/activityLogger');
const { successResponse, errorResponse } = require('../utils/response');
const { ACTIVITY_ACTIONS, ROLES } = require('../config/constants');

// Helper — check if user is member or owner of a project
const isMemberOrOwner = (project, userId) => {
  const id = userId.toString();
  if (project.owner._id?.toString() === id || project.owner.toString() === id) return true;
  return project.members.some((m) => m.user?.toString() === id || m.user?._id?.toString() === id);
};

// ─── Get All Projects ─────────────────────────────────────────────────────────
const getProjects = asyncHandler(async (req, res) => {
  const { page, limit, status, priority, search } = req.query;
  const { role, _id: userId } = req.user;

  let query = {};

  // Admins see all; managers/developers see only their projects
  if (role !== ROLES.ADMIN) {
    query.$or = [
      { owner: userId },
      { 'members.user': userId },
    ];
  }

  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (search) query.title = { $regex: search, $options: 'i' };

  const result = await paginate(Project, query, {
    page,
    limit,
    sort: { createdAt: -1 },
    populate: [
      { path: 'owner', select: 'name email avatar' },
      { path: 'members.user', select: 'name email avatar' },
    ],
  });

  // Attach task counts per project
  const projectIds = result.data.map((p) => p._id);
  const taskCounts = await Task.aggregate([
    { $match: { project: { $in: projectIds } } },
    { $group: { _id: '$project', count: { $sum: 1 }, done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } } } },
  ]);
  const countMap = {};
  taskCounts.forEach((t) => (countMap[t._id.toString()] = t));

  const projects = result.data.map((p) => {
    const pObj = p.toObject();
    const counts = countMap[p._id.toString()] || { count: 0, done: 0 };
    pObj.taskCount = counts.count;
    pObj.completedTaskCount = counts.done;
    pObj.progress = counts.count ? Math.round((counts.done / counts.count) * 100) : 0;
    return pObj;
  });

  return successResponse(res, projects, 'Projects fetched', 200, result.pagination);
});

// ─── Create Project ───────────────────────────────────────────────────────────
const createProject = asyncHandler(async (req, res) => {
  const { title, description, status, priority, startDate, endDate, tags, coverColor } = req.body;

  const project = await Project.create({
    title,
    description,
    status,
    priority,
    startDate,
    endDate,
    tags,
    coverColor,
    owner: req.user._id,
    members: [{ user: req.user._id, role: req.user.role }],
  });

  await project.populate('owner', 'name email avatar');

  await logActivity({
    userId: req.user._id,
    action: ACTIVITY_ACTIONS.CREATED,
    entity: 'project',
    entityId: project._id,
    entityTitle: project.title,
    projectId: project._id,
  });

  return successResponse(res, project, 'Project created', 201);
});

// ─── Get Project By ID ────────────────────────────────────────────────────────
const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('owner', 'name email avatar role')
    .populate('members.user', 'name email avatar role');

  if (!project) return errorResponse(res, 'Project not found', 404);

  // Access guard — admin sees all
  if (req.user.role !== ROLES.ADMIN && !isMemberOrOwner(project, req.user._id)) {
    return errorResponse(res, 'Not a member of this project', 403);
  }

  // Task summary
  const taskStats = await Task.aggregate([
    { $match: { project: project._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const stats = {};
  taskStats.forEach((t) => (stats[t._id] = t.count));
  const total = Object.values(stats).reduce((a, b) => a + b, 0);

  const projectObj = project.toObject();
  projectObj.taskStats = stats;
  projectObj.taskCount = total;
  projectObj.progress = total ? Math.round(((stats.done || 0) / total) * 100) : 0;

  return successResponse(res, projectObj);
});

// ─── Update Project ───────────────────────────────────────────────────────────
const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return errorResponse(res, 'Project not found', 404);

  // Only owner or admin can update
  if (
    req.user.role !== ROLES.ADMIN &&
    project.owner.toString() !== req.user._id.toString()
  ) {
    return errorResponse(res, 'Only the project owner can update it', 403);
  }

  const allowed = ['title', 'description', 'status', 'priority', 'startDate', 'endDate', 'tags', 'coverColor'];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) project[field] = req.body[field];
  });

  await project.save();
  await project.populate([
    { path: 'owner', select: 'name email avatar' },
    { path: 'members.user', select: 'name email avatar' },
  ]);

  await logActivity({
    userId: req.user._id,
    action: ACTIVITY_ACTIONS.UPDATED,
    entity: 'project',
    entityId: project._id,
    entityTitle: project.title,
    projectId: project._id,
  });

  return successResponse(res, project, 'Project updated');
});

// ─── Delete Project ───────────────────────────────────────────────────────────
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return errorResponse(res, 'Project not found', 404);

  if (
    req.user.role !== ROLES.ADMIN &&
    project.owner.toString() !== req.user._id.toString()
  ) {
    return errorResponse(res, 'Not authorized to delete this project', 403);
  }

  await Task.deleteMany({ project: project._id });
  await project.deleteOne();

  await logActivity({
    userId: req.user._id,
    action: ACTIVITY_ACTIONS.DELETED,
    entity: 'project',
    entityId: project._id,
    entityTitle: project.title,
  });

  return successResponse(res, null, 'Project deleted');
});

// ─── Add Member ───────────────────────────────────────────────────────────────
const addMember = asyncHandler(async (req, res) => {
  const { userId, role } = req.body;
  const project = await Project.findById(req.params.id);
  if (!project) return errorResponse(res, 'Project not found', 404);

  const user = await User.findById(userId).select('-password -refreshToken');
  if (!user) return errorResponse(res, 'User not found', 404);

  const alreadyMember = project.members.some((m) => m.user.toString() === userId);
  if (alreadyMember) return errorResponse(res, 'User is already a member', 409);

  project.members.push({ user: userId, role: role || ROLES.DEVELOPER });
  await project.save();

  await project.populate('members.user', 'name email avatar role');

  await logActivity({
    userId: req.user._id,
    action: ACTIVITY_ACTIONS.MEMBER_ADDED,
    entity: 'project',
    entityId: project._id,
    entityTitle: project.title,
    projectId: project._id,
    meta: { addedUser: user.name },
  });

  return successResponse(res, project.members, 'Member added');
});

// ─── Remove Member ────────────────────────────────────────────────────────────
const removeMember = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return errorResponse(res, 'Project not found', 404);

  if (project.owner.toString() === req.params.userId) {
    return errorResponse(res, 'Cannot remove the project owner', 400);
  }

  project.members = project.members.filter(
    (m) => m.user.toString() !== req.params.userId
  );
  await project.save();

  await logActivity({
    userId: req.user._id,
    action: ACTIVITY_ACTIONS.MEMBER_REMOVED,
    entity: 'project',
    entityId: project._id,
    entityTitle: project.title,
    projectId: project._id,
  });

  return successResponse(res, null, 'Member removed');
});

// ─── Get Project Activity ─────────────────────────────────────────────────────
const getProjectActivity = asyncHandler(async (req, res) => {
  const ActivityLog = require('../models/ActivityLog');
  const { page, limit } = req.query;

  const result = await paginate(
    ActivityLog,
    { project: req.params.id },
    {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: { path: 'user', select: 'name avatar' },
    }
  );

  return successResponse(res, result.data, 'Activity fetched', 200, result.pagination);
});

module.exports = {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  getProjectActivity,
};
