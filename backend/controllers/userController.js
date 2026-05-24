const User = require('../models/User');
const Task = require('../models/Task');
const Project = require('../models/Project');
const ActivityLog = require('../models/ActivityLog');
const asyncHandler = require('../middlewares/asyncHandler');
const { paginate } = require('../utils/pagination');
const { successResponse, errorResponse } = require('../utils/response');
const { supabaseAdmin } = require('../config/supabaseAdmin');

// ─── Create User (Admin) ───────────────────────────────────────────────────────
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, jobTitle } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return errorResponse(res, 'User with this email already exists', 400);
  }

  // Create user in Supabase
  const { data: supaUser, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Skip verification for admin-created accounts
  });

  if (error) {
    return errorResponse(res, `Supabase error: ${error.message}`, 400);
  }

  // Create user in MongoDB
  const user = await User.create({
    name,
    email,
    password, // Mongoose schema will hash this automatically in pre('save')
    role,
    profile: { jobTitle: jobTitle || '' },
    isEmailVerified: true,
    supabaseId: supaUser.user.id,
    createdBy: req.user._id,
  });

  // Emit activity log
  await ActivityLog.create({
    project: null,
    user: req.user._id,
    action: 'user_created',
    entity: 'user',
    details: { targetUserId: user._id, targetUserName: user.name }
  });

  const createdUser = user.toObject();
  delete createdUser.password;

  return successResponse(res, createdUser, 'User created successfully', 201);
});

// ─── Get All Users (Admin) ────────────────────────────────────────────────────
const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, status, search } = req.query;

  const query = { deletedAt: null }; // Exclude soft-deleted

  if (role && role !== 'All') query.role = role;
  
  if (status === 'Active') query.isSuspended = false;
  if (status === 'Suspended') query.isSuspended = true;

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const result = await paginate(User, query, {
    page,
    limit,
    sort: { createdAt: -1 },
    select: 'name email role isEmailVerified isSuspended createdAt lastLogin profile',
  });

  return successResponse(res, result.data, 'Users fetched', 200, result.pagination);
});

// ─── Get User By ID ───────────────────────────────────────────────────────────
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password -refreshToken');
  if (!user || user.deletedAt) return errorResponse(res, 'User not found', 404);
  return successResponse(res, user);
});

// ─── Get Public Profile ──────────────────────────────────────────────────────────
const getPublicProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('_id name profile createdAt');
    
  if (!user || user.deletedAt) return errorResponse(res, 'User not found', 404);
  return successResponse(res, user);
});

// ─── Update User (Admin) ──────────────────────────────────────────────────────
const updateUser = asyncHandler(async (req, res) => {
  const { name, email, role, jobTitle, department } = req.body;
  const targetUserId = req.params.id;

  if (targetUserId === req.user._id.toString() && role && role !== req.user.role) {
    return errorResponse(res, 'Cannot change your own role', 403);
  }

  const user = await User.findById(targetUserId);
  if (!user || user.deletedAt) return errorResponse(res, 'User not found', 404);

  // If email changes, update in Supabase
  if (email && email !== user.email) {
    if (user.supabaseId) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(user.supabaseId, { email });
      if (error) return errorResponse(res, `Supabase email update error: ${error.message}`, 400);
    }
    user.email = email;
  }

  if (name) user.name = name;
  if (role) user.role = role;
  if (jobTitle !== undefined) user.profile.jobTitle = jobTitle;
  if (department !== undefined) user.profile.department = department;

  await user.save({ validateBeforeSave: false });

  const updatedUser = user.toObject();
  delete updatedUser.password;
  delete updatedUser.refreshToken;

  return successResponse(res, updatedUser, 'User updated successfully');
});

// ─── Suspend User (Admin) ─────────────────────────────────────────────────────
const suspendUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return errorResponse(res, 'Cannot suspend your own account', 403);
  }

  const user = await User.findById(req.params.id);
  if (!user || user.deletedAt) return errorResponse(res, 'User not found', 404);

  user.isSuspended = true;
  user.suspendedAt = Date.now();
  user.suspendedBy = req.user._id;

  if (user.supabaseId) {
    await supabaseAdmin.auth.admin.updateUserById(user.supabaseId, { ban_duration: 'none' });
  }

  await user.save({ validateBeforeSave: false });
  return successResponse(res, null, 'User suspended successfully');
});

// ─── Unsuspend User (Admin) ───────────────────────────────────────────────────
const unsuspendUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || user.deletedAt) return errorResponse(res, 'User not found', 404);

  user.isSuspended = false;
  user.suspendedAt = null;
  user.suspendedBy = null;

  if (user.supabaseId) {
    await supabaseAdmin.auth.admin.updateUserById(user.supabaseId, { ban_duration: '0h' });
  }

  await user.save({ validateBeforeSave: false });
  return successResponse(res, null, 'User unsuspended successfully');
});

// ─── Delete User (Admin) ──────────────────────────────────────────────────────
const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return errorResponse(res, 'Cannot delete your own account', 403);
  }

  const user = await User.findById(req.params.id);
  if (!user || user.deletedAt) return errorResponse(res, 'User not found', 404);

  user.deletedAt = Date.now();
  user.isActive = false;
  await user.save({ validateBeforeSave: false });

  if (user.supabaseId) {
    await supabaseAdmin.auth.admin.deleteUser(user.supabaseId);
  }

  // Reassign open tasks
  await Task.updateMany({ assignee: user._id }, { assignee: null });

  // Remove from project members
  await Project.updateMany(
    { 'members.user': user._id },
    { $pull: { members: { user: user._id } } }
  );

  return successResponse(res, null, 'User account deleted.');
});

module.exports = {
  createUser,
  getUsers,
  getUserById,
  getPublicProfile,
  updateUser,
  suspendUser,
  unsuspendUser,
  deleteUser
};
