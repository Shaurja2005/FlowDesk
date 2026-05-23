const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../middlewares/asyncHandler');
const { generateTokens, setRefreshCookie } = require('../utils/generateToken');
const { sendEmail, welcomeEmail } = require('../utils/sendEmail');
const { successResponse, errorResponse } = require('../utils/response');

// ─── Register ─────────────────────────────────────────────────────────────────
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return errorResponse(res, 'Email already registered', 409);

  const user = await User.create({ name, email, password, role });
  const { accessToken, refreshToken } = generateTokens(user._id);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  setRefreshCookie(res, refreshToken);

  // Send welcome email (non-blocking)
  const { subject, html } = welcomeEmail(user.name);
  sendEmail({ to: user.email, subject, html });

  return successResponse(
    res,
    {
      accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    },
    'Registered successfully',
    201
  );
});

// ─── Login ────────────────────────────────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password +refreshToken');
  if (!user || !(await user.matchPassword(password))) {
    return errorResponse(res, 'Invalid email or password', 401);
  }

  if (!user.isActive) {
    return errorResponse(res, 'Account is deactivated', 403);
  }

  const { accessToken, refreshToken } = generateTokens(user._id);
  user.refreshToken = refreshToken;
  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  setRefreshCookie(res, refreshToken);

  return successResponse(res, {
    accessToken,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
  });
});

// ─── Logout ───────────────────────────────────────────────────────────────────
const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;
  if (refreshToken) {
    await User.findOneAndUpdate(
      { refreshToken },
      { refreshToken: null },
      { validateBeforeSave: false }
    );
  }
  res.clearCookie('refreshToken');
  return successResponse(res, null, 'Logged out successfully');
});

// ─── Refresh Token ────────────────────────────────────────────────────────────
const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) return errorResponse(res, 'No refresh token', 401);

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    return errorResponse(res, 'Invalid or expired refresh token', 401);
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== refreshToken) {
    return errorResponse(res, 'Refresh token mismatch', 401);
  }

  const { accessToken, refreshToken: newRefresh } = generateTokens(user._id);
  user.refreshToken = newRefresh;
  await user.save({ validateBeforeSave: false });
  setRefreshCookie(res, newRefresh);

  return successResponse(res, { accessToken });
});

// ─── Get Me ───────────────────────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  return successResponse(res, req.user);
});

// ─── Change Password ──────────────────────────────────────────────────────────
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) {
    return errorResponse(res, 'Current password is incorrect', 400);
  }

  user.password = newPassword;
  await user.save();

  return successResponse(res, null, 'Password changed successfully');
});

// ─── Update Profile ───────────────────────────────────────────────────────────
const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  const update = {};
  if (name) update.name = name;
  if (email) update.email = email;
  if (req.file) update.avatar = `/uploads/${req.file.filename}`;

  const user = await User.findByIdAndUpdate(req.user._id, update, {
    new: true,
    runValidators: true,
  }).select('-password -refreshToken');

  return successResponse(res, user, 'Profile updated');
});

module.exports = {
  register,
  login,
  logout,
  refreshAccessToken,
  getMe,
  changePassword,
  updateProfile,
};
