const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const {
  register, login, googleLogin, logout, refreshAccessToken,
  getMe, updateAccount, updateProfile,
  verifyEmail, resendVerification,
} = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const upload = require('../middlewares/upload');

const { authLimiter } = require('../middlewares/rateLimiter');

// ─── Disposable email domain blocklist ───────────────────────────────────────
const DISPOSABLE_DOMAINS = [
  'mailinator.com', 'tempmail.com', 'guerrillamail.com', 'throwam.com',
  'trashmail.com', 'yopmail.com', 'sharklasers.com', 'guerrillamailblock.com',
  'grr.la', 'guerrillamail.info', 'guerrillamail.biz', 'guerrillamail.de',
  'guerrillamail.net', 'guerrillamail.org', 'spam4.me', 'binkmail.com',
  'bobmail.info', 'chammy.info', 'dispostable.com', 'fakeinbox.com',
  'filzmail.com', 'gowaymail.com', 'jetable.fr.nf', 'maileater.com',
  'mailnull.com', 'mailseal.de', 'mailtome.de', 'mailzilla.com',
  'mega.zik.dj', 'meltmail.com', 'mintemail.com', 'mt2009.com',
  'mytrashmail.com', 'netmails.com', 'nomail.xl.cx', 'nospamfor.us',
  'nowmymail.com', 'objectmail.com', 'obobbo.com', 'odaymail.com',
];

const emailValidation = body('email')
  .isEmail().withMessage('Valid email is required')
  .normalizeEmail()
  .matches(/^[^\+]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
  .withMessage('Email aliases with + are not allowed')
  .custom((value) => {
    const domain = value.split('@')[1]?.toLowerCase();
    if (DISPOSABLE_DOMAINS.includes(domain)) {
      throw new Error('Disposable email addresses are not allowed.');
    }
    return true;
  });

// POST /api/auth/register
router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    emailValidation,
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['admin', 'manager', 'developer']),
  ],
  validate,
  register
);

// POST /api/auth/verify-email
router.post('/verify-email', verifyEmail);

// POST /api/auth/resend-verification
const resendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  message: { success: false, message: 'Too many resend attempts. Try again in 10 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
router.post('/resend-verification', resendLimiter, resendVerification);

// POST /api/auth/login
router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

// POST /api/auth/google
router.post('/google', authLimiter, googleLogin);

// POST /api/auth/logout
router.post('/logout', logout);

// POST /api/auth/refresh
router.post('/refresh', refreshAccessToken);

// GET /api/auth/me
router.get('/me', protect, getMe);

// PUT /api/auth/profile
router.put('/profile', protect, upload.single('avatar'), updateProfile);

// PUT /api/auth/account
router.put(
  '/account',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').optional().isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
    body('email')
      .optional()
      .isEmail().withMessage('Valid email is required')
      .normalizeEmail()
      .matches(/^[^\+]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
      .withMessage('Email aliases with + are not allowed')
      .custom((value) => {
        if (!value) return true;
        const domain = value.split('@')[1]?.toLowerCase();
        if (DISPOSABLE_DOMAINS.includes(domain)) {
          throw new Error('Disposable email addresses are not allowed.');
        }
        return true;
      }),
  ],
  validate,
  updateAccount
);

module.exports = router;
