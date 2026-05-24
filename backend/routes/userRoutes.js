const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createUser,
  getUsers,
  getUserById,
  getPublicProfile,
  updateUser,
  suspendUser,
  unsuspendUser,
  deleteUser
} = require('../controllers/userController');
const { protect } = require('../middlewares/auth');
const roleGuard = require('../middlewares/roleGuard');
const validate = require('../middlewares/validate');

// Public profile route (any authenticated user)
router.get('/:id/public', protect, getPublicProfile);

// Admin-only routes
router.use(protect, roleGuard('admin'));

router.get('/', getUsers);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['admin', 'manager', 'developer']).withMessage('Invalid role'),
  ],
  validate,
  createUser
);

router.get('/:id', getUserById);

router.put(
  '/:id',
  [
    body('email').optional().isEmail(),
    body('role').optional().isIn(['admin', 'manager', 'developer']),
  ],
  validate,
  updateUser
);

router.put('/:id/suspend', suspendUser);
router.put('/:id/unsuspend', unsuspendUser);

router.delete('/:id', deleteUser);

module.exports = router;
