const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getUsers, getUserById, getPublicProfile, updateUser, deleteUser } = require('../controllers/userController');
const { protect } = require('../middlewares/auth');
const roleGuard = require('../middlewares/roleGuard');
const validate = require('../middlewares/validate');

// Public profile route (any authenticated user)
router.get('/:id/public', protect, getPublicProfile);

// Admin-only routes
router.use(protect, roleGuard('admin'));

router.get('/', getUsers);
router.get('/:id', getUserById);
router.put(
  '/:id',
  [
    body('role').optional().isIn(['admin', 'manager', 'developer']),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  updateUser
);
router.delete('/:id', deleteUser);

module.exports = router;
