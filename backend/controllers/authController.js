const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../middlewares/asyncHandler');
const { generateTokens, setRefreshCookie } = require('../utils/generateToken');
const { sendEmail, welcomeEmail } = require('../utils/sendEmail');
const { successResponse, errorResponse } = require('../utils/response');
const { supabaseAdmin } = require('../config/supabaseAdmin');

// ─── Register ─────────────────────────────────────────────────────────────────
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return errorResponse(res, 'Email already registered', 409);

  // Initiate Supabase email verification
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password, // Store copy in Supabase for auth flow verification
    email_confirm: false, // forces verification email
    user_metadata: { name }
  });

  if (error) {
    console.error('Supabase create user error:', error);
    return errorResponse(res, 'Failed to initiate email verification', 500);
  }

  // Create unverified MongoDB user
  const user = await User.create({
    name,
    email,
    password,
    role,
    isEmailVerified: false,
    supabaseId: data.user.id
  });

  return successResponse(
    res,
    null,
    'Registration successful. Please check your email to verify your account before logging in.',
    201
  );
});

// ─── Login ────────────────────────────────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password +refreshToken +loginAttempts +lockUntil');
  if (!user) {
    return errorResponse(res, 'Invalid email or password', 401);
  }

  if (!user.isActive) {
    return errorResponse(res, 'Account is deactivated', 403);
  }

  // Check if account is locked
  if (user.lockUntil && user.lockUntil > Date.now()) {
    const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
    return errorResponse(res, `Account locked. Try again in ${minutesLeft} minutes.`, 403);
  }

  const isMatch = await user.matchPassword(password);

  if (isMatch && !user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email address before logging in. Check your inbox.',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }

  if (!isMatch) {
    user.loginAttempts = (user.loginAttempts || 0) + 1;
    if (user.loginAttempts >= 5) {
      user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
    }
    await user.save({ validateBeforeSave: false });

    if (user.loginAttempts >= 5) {
      return errorResponse(res, 'Account locked due to too many failed attempts. Try again in 30 minutes.', 403);
    }
    return errorResponse(res, 'Invalid email or password', 401);
  }

  // Reset login attempts on success
  user.loginAttempts = 0;
  user.lockUntil = null;
  user.lastLogin = Date.now();

  const { accessToken, refreshToken } = generateTokens(user._id);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  setRefreshCookie(res, refreshToken);

  return successResponse(res, {
    accessToken,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profile: user.profile,
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

// ─── Update Account ───────────────────────────────────────────────────────────
const updateAccount = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, email } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) {
    return errorResponse(res, 'Current password is incorrect', 400);
  }

  if (newPassword) user.password = newPassword;
  if (email) user.email = email;
  
  await user.save();

  return successResponse(
    res,
    { email: user.email },
    'Account updated successfully'
  );
});

// ─── Update Profile ───────────────────────────────────────────────────────────
const updateProfile = asyncHandler(async (req, res) => {
  const {
    name,
    publicName,
    pronouns,
    jobTitle,
    department,
    organization,
    basedIn,
    timezone,
    bio,
  } = req.body;

  const user = await User.findById(req.user._id);
  
  if (name) user.name = name;
  
  // Initialize profile if it somehow doesn't exist
  if (!user.profile) user.profile = {};

  if (publicName !== undefined) user.profile.publicName = publicName;
  if (pronouns !== undefined) user.profile.pronouns = pronouns;
  if (jobTitle !== undefined) user.profile.jobTitle = jobTitle;
  if (department !== undefined) user.profile.department = department;
  if (organization !== undefined) user.profile.organization = organization;
  if (basedIn !== undefined) user.profile.basedIn = basedIn;
  if (timezone !== undefined) user.profile.timezone = timezone;
  if (bio !== undefined) user.profile.bio = bio;

  if (req.file) {
    user.profile.avatarUrl = `/uploads/${req.file.filename}`;
  }

  await user.save({ validateBeforeSave: true });

  const updatedUser = await User.findById(req.user._id).select('-password -refreshToken');

  return successResponse(res, updatedUser, 'Profile updated');
});

// ─── Verify Email ───────────────────────────────────────────────────────────────
const verifyEmail = asyncHandler(async (req, res) => {
  const { token, type } = req.body;

  if (!token || type !== 'email') {
    return errorResponse(res, 'Invalid verification link', 400);
  }

  const { data, error } = await supabaseAdmin.auth.verifyOtp({ token, type: 'email' });

  if (error || !data.user) {
    return errorResponse(res, 'Invalid or expired verification link', 400);
  }

  const user = await User.findOne({ supabaseId: data.user.id });
  if (!user) {
    return errorResponse(res, 'User not found', 404);
  }

  user.isEmailVerified = true;
  await user.save({ validateBeforeSave: false });

  return successResponse(res, null, 'Email verified. You can now log in.', 200);
});

// ─── Resend Verification ──────────────────────────────────────────────────────
const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return errorResponse(res, 'If that email is registered, a link has been sent.', 200);
  }

  if (user.isEmailVerified) {
    return errorResponse(res, 'Email is already verified', 400);
  }

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'signup',
    email: user.email,
  });

  if (error) {
    return errorResponse(res, 'Failed to resend verification email', 500);
  }

  return successResponse(res, null, 'Verification email resent.', 200);
});

module.exports = {
  register,
  login,
  logout,
  refreshAccessToken,
  getMe,
  updateProfile,
  updateAccount,
  verifyEmail,
  resendVerification,
};
