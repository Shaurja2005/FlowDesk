const Task = require('../models/Task');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const asyncHandler = require('../middlewares/asyncHandler');
const { paginate } = require('../utils/pagination');
const { logActivity } = require('../utils/activityLogger');
const { sendEmail, taskAssignedEmail } = require('../utils/sendEmail');
const { successResponse, errorResponse } = require('../utils/response');
const { ACTIVITY_ACTIONS, NOTIFICATION_TYPES, ROLES } = require('../config/constants');
const User = require('../models/User');

// Helper — check project membership
const checkProjectAccess = async (projectId, userId, userRole) => {
  const project = await Project.findById(projectId);
  if (!project) return null;
  if (userRole === ROLES.ADMIN) return project;
  const isMember =
    project.owner.toString() === userId.toString() ||
    project.members.some((m) => m.user.toString() === userId.toString());
  return isMember ? project : false;
};

// ─── Get Tasks ────────────────────────────────────────────────────────────────
const getTasks = asyncHandler(async (req, res) => {
  const { page, limit, project, assignedTo, status, priority, search, dueDate } = req.query;
  const { role, _id: userId } = req.user;

  const query = {};
  if (project) query.project = project;
  if (assignedTo) query.assignedTo = assignedTo;
  if (status) query.status = { $in: status.split(',') };
  if (priority) query.priority = priority;
  if (search) query.title = { $regex: search, $options: 'i' };
  if (dueDate) query.dueDate = { $lte: new Date(dueDate) };

  // Developers only see tasks in their projects or assigned to them
  if (role === ROLES.DEVELOPER) {
    const userProjects = await Project.find({
      $or: [{ owner: userId }, { 'members.user': userId }],
    }).select('_id');
    const projectIds = userProjects.map((p) => p._id);
    query.$or = [{ project: { $in: projectIds } }, { assignedTo: userId }];
  }

  // Exclude subtasks from main list
  query.parentTask = null;

  const result = await paginate(Task, query, {
    page,
    limit,
    sort: { order: 1, createdAt: -1 },
    populate: [
      { path: 'assignedTo', select: 'name email avatar' },
      { path: 'createdBy', select: 'name email avatar' },
      { path: 'project', select: 'title status' },
    ],
  });

  return successResponse(res, result.data, 'Tasks fetched', 200, result.pagination);
});

// ─── Search Tasks ─────────────────────────────────────────────────────────────
const searchTasks = asyncHandler(async (req, res) => {
  const { q, projectId } = req.query;
  const query = {};
  
  if (q) {
    query.title = { $regex: q, $options: 'i' };
  }
  
  if (projectId) {
    query.project = projectId;
  }

  const tasks = await Task.find(query)
    .select('title _id workType status priority')
    .limit(20)
    .lean();
    
  return successResponse(res, tasks, 'Tasks found');
});

// ─── Create Task ──────────────────────────────────────────────────────────────
const createTask = asyncHandler(async (req, res) => {
  const {
    title, description, project: projectId, assignedTo,
    status, priority, dueDate, estimatedHours, labels, parentTask,
    workType, team, flagged, linkedItems, restrictTo, startDate
  } = req.body;

  const project = await checkProjectAccess(projectId, req.user._id, req.user.role);
  if (project === null) return errorResponse(res, 'Project not found', 404);
  if (project === false) return errorResponse(res, 'Not a project member', 403);

  // Order: put at end of status column
  const lastTask = await Task.findOne({ project: projectId, status: status || 'todo' })
    .sort({ order: -1 })
    .select('order');
  const order = lastTask ? lastTask.order + 1 : 0;

  const task = await Task.create({
    title, description, project: projectId, assignedTo,
    createdBy: req.user._id, reporter: req.body.reporter || req.user._id, status, priority, dueDate,
    estimatedHours, labels, parentTask, order,
    workType, team, flagged, linkedItems, restrictTo, startDate
  });

  await task.populate([
    { path: 'assignedTo', select: 'name email avatar' },
    { path: 'createdBy', select: 'name email avatar' },
    { path: 'project', select: 'title' },
  ]);

  // Notification + email for assignee
  if (assignedTo && assignedTo.toString() !== req.user._id.toString()) {
    await Notification.create({
      recipient: assignedTo,
      type: NOTIFICATION_TYPES.TASK_ASSIGNED,
      message: `${req.user.name} assigned you the task: "${title}"`,
      link: `/tasks/${task._id}`,
      actor: req.user._id,
    });

    const assignee = await User.findById(assignedTo).select('name email');
    if (assignee) {
      const { subject, html } = taskAssignedEmail(assignee.name, title, project.title);
      sendEmail({ to: assignee.email, subject, html });
    }
  }

  await logActivity({
    userId: req.user._id,
    action: ACTIVITY_ACTIONS.CREATED,
    entity: 'task',
    entityId: task._id,
    entityTitle: task.title,
    projectId,
  });

  return successResponse(res, task, 'Task created', 201);
});

// ─── Get Task By ID ───────────────────────────────────────────────────────────
const getTaskById = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('assignedTo', 'name email avatar')
    .populate('createdBy', 'name email avatar')
    .populate('project', 'title status linkedRepo')
    .populate('comments.user', 'name avatar')
    .populate({
      path: 'subtasks',
      populate: { path: 'assignedTo', select: 'name avatar' },
    });

  if (!task) return errorResponse(res, 'Task not found', 404);

  return successResponse(res, task);
});

// ─── Update Task ──────────────────────────────────────────────────────────────
const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return errorResponse(res, 'Task not found', 404);

  const oldStatus = task.status;
  const oldAssignee = task.assignedTo?.toString();

  const allowed = [
    'title', 'description', 'status', 'priority', 'dueDate',
    'estimatedHours', 'labels', 'assignedTo', 'order',
  ];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) task[field] = req.body[field];
  });

  await task.save();
  await task.populate([
    { path: 'assignedTo', select: 'name email avatar' },
    { path: 'createdBy', select: 'name email avatar' },
    { path: 'project', select: 'title' },
  ]);

  // Status change notification
  if (req.body.status && req.body.status !== oldStatus) {
    await logActivity({
      userId: req.user._id,
      action: ACTIVITY_ACTIONS.STATUS_CHANGED,
      entity: 'task',
      entityId: task._id,
      entityTitle: task.title,
      projectId: task.project._id,
      meta: { from: oldStatus, to: req.body.status },
    });
  }

  // New assignee notification
  const newAssignee = req.body.assignedTo?.toString();
  if (newAssignee && newAssignee !== oldAssignee && newAssignee !== req.user._id.toString()) {
    await Notification.create({
      recipient: newAssignee,
      type: NOTIFICATION_TYPES.TASK_ASSIGNED,
      message: `${req.user.name} assigned you the task: "${task.title}"`,
      link: `/tasks/${task._id}`,
      actor: req.user._id,
    });
  }

  await logActivity({
    userId: req.user._id,
    action: ACTIVITY_ACTIONS.UPDATED,
    entity: 'task',
    entityId: task._id,
    entityTitle: task.title,
    projectId: task.project._id,
  });

  return successResponse(res, task, 'Task updated');
});

// ─── Delete Task ──────────────────────────────────────────────────────────────
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return errorResponse(res, 'Task not found', 404);

  if (
    req.user.role === ROLES.DEVELOPER &&
    task.createdBy.toString() !== req.user._id.toString()
  ) {
    return errorResponse(res, 'Developers cannot delete tasks they did not create', 403);
  }

  // Delete subtasks
  await Task.deleteMany({ parentTask: task._id });
  await task.deleteOne();

  await logActivity({
    userId: req.user._id,
    action: ACTIVITY_ACTIONS.DELETED,
    entity: 'task',
    entityId: task._id,
    entityTitle: task.title,
    projectId: task.project,
  });

  return successResponse(res, null, 'Task deleted');
});

// ─── Add Comment ──────────────────────────────────────────────────────────────
const addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const task = await Task.findById(req.params.id);
  if (!task) return errorResponse(res, 'Task not found', 404);

  task.comments.push({ user: req.user._id, text });
  await task.save();
  await task.populate('comments.user', 'name avatar');

  const newComment = task.comments[task.comments.length - 1];

  // Notify task assignee (if different from commenter)
  if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
    await Notification.create({
      recipient: task.assignedTo,
      type: NOTIFICATION_TYPES.COMMENT_ADDED,
      message: `${req.user.name} commented on "${task.title}"`,
      link: `/tasks/${task._id}`,
      actor: req.user._id,
    });
  }

  await logActivity({
    userId: req.user._id,
    action: ACTIVITY_ACTIONS.COMMENTED,
    entity: 'task',
    entityId: task._id,
    entityTitle: task.title,
    projectId: task.project,
  });

  return successResponse(res, newComment, 'Comment added', 201);
});

// ─── Delete Comment ───────────────────────────────────────────────────────────
const deleteComment = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return errorResponse(res, 'Task not found', 404);

  const comment = task.comments.id(req.params.commentId);
  if (!comment) return errorResponse(res, 'Comment not found', 404);

  if (
    comment.user.toString() !== req.user._id.toString() &&
    req.user.role === ROLES.DEVELOPER
  ) {
    return errorResponse(res, 'Cannot delete another user\'s comment', 403);
  }

  comment.deleteOne();
  await task.save();

  return successResponse(res, null, 'Comment deleted');
});

// ─── Log Time ─────────────────────────────────────────────────────────────────
const logTime = asyncHandler(async (req, res) => {
  const { hours } = req.body;
  if (!hours || hours <= 0) return errorResponse(res, 'Invalid hours value', 400);

  const task = await Task.findById(req.params.id);
  if (!task) return errorResponse(res, 'Task not found', 404);

  task.loggedHours = (task.loggedHours || 0) + parseFloat(hours);
  await task.save();

  await logActivity({
    userId: req.user._id,
    action: ACTIVITY_ACTIONS.TIME_LOGGED,
    entity: 'task',
    entityId: task._id,
    entityTitle: task.title,
    projectId: task.project,
    meta: { hours },
  });

  return successResponse(res, { loggedHours: task.loggedHours }, 'Time logged');
});

// ─── Upload Attachment ────────────────────────────────────────────────────────
const uploadTaskAttachment = asyncHandler(async (req, res) => {
  if (!req.file) return errorResponse(res, 'No file uploaded', 400);

  const task = await Task.findById(req.params.id);
  if (!task) return errorResponse(res, 'Task not found', 404);

  const attachment = {
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    url: `/uploads/${req.file.filename}`,
    uploadedBy: req.user._id,
    uploadedAt: Date.now(),
  };

  task.attachments.push(attachment);
  await task.save();
  await task.populate('attachments.uploadedBy', 'name avatar profile');

  const newAttachment = task.attachments[task.attachments.length - 1];

  await logActivity({
    userId: req.user._id,
    action: ACTIVITY_ACTIONS.UPDATED,
    entity: 'task',
    entityId: task._id,
    entityTitle: task.title,
    projectId: task.project,
    meta: { action: 'uploaded attachment', filename: attachment.originalName },
  });

  return successResponse(res, newAttachment, 'Attachment uploaded', 201);
});

module.exports = {
  getTasks,
  searchTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  addComment,
  deleteComment,
  logTime,
  uploadTaskAttachment,
};
