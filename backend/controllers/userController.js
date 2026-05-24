const User = require('../models/User');
const asyncHandler = require('../middlewares/asyncHandler');
const { paginate } = require('../utils/pagination');
const { successResponse, errorResponse } = require('../utils/response');

// ─── Get All Users (Admin) ────────────────────────────────────────────────────
const getUsers = asyncHandler(async (req, res) => {
  const { page, limit, role, search, isActive } = req.query;

  const query = {};
  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === 'true';
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
    select: '-password -refreshToken',
  });

  return successResponse(res, result.data, 'Users fetched', 200, result.pagination);
});

// ─── Get User By ID ───────────────────────────────────────────────────────────
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password -refreshToken');
  if (!user) return errorResponse(res, 'User not found', 404);
  return successResponse(res, user);
});

// ─── Get Public Profile ──────────────────────────────────────────────────────────
const getPublicProfile = asyncHandler(async (req, res) => {
  // Only select non-sensitive fields
  const user = await User.findById(req.params.id)
    .select('_id name profile createdAt');
    
  if (!user) return errorResponse(res, 'User not found', 404);
  
  return successResponse(res, user);
});

// ─── Update User (Admin) ──────────────────────────────────────────────────────
const updateUser = asyncHandler(async (req, res) => {
  const { name, role, isActive } = req.body;

  // Prevent self-demotion for admin
  if (req.params.id === req.user._id.toString() && role && role !== req.user.role) {
    return errorResponse(res, 'Cannot change your own role', 400);
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { name, role, isActive },
    { new: true, runValidators: true }
  ).select('-password -refreshToken');

  if (!user) return errorResponse(res, 'User not found', 404);

  return successResponse(res, user, 'User updated');
});

// ─── Delete User (Admin) ──────────────────────────────────────────────────────
const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return errorResponse(res, 'Cannot delete your own account', 400);
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  ).select('-password -refreshToken');

  if (!user) return errorResponse(res, 'User not found', 404);

  return successResponse(res, user, 'User deactivated');
});

module.exports = { getUsers, getUserById, getPublicProfile, updateUser, deleteUser };
