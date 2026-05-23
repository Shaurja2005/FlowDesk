const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getUsers, getUserById, updateUser, deleteUser } = require('../controllers/userController');
const { protect } = require('../middlewares/auth');
const roleGuard = require('../middlewares/roleGuard');
const validate = require('../middlewares/validate');

// All user routes require auth + admin role
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
